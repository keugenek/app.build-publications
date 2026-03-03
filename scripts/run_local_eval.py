#!/usr/bin/env python3
"""Standalone local evaluation script for both Node.js and Python apps.

Runs the full CanItShip 9-metric evaluation using shell commands.
Works for both Claude-generated (Node.js) and Opencode-generated (Python) apps.

Metrics:
  L1: Build success
  L2: Runtime success (start + healthcheck)
  L3: Type safety (tsc / pyright)
  L4: Tests pass (vitest / pytest)
  L5: DB connectivity (needs running app + DB creds)
  L6: Data returned (needs running app + DB)
  L7: UI renders (curl check on running app)
  D8: Local runability (3-trial: install + start + healthcheck)
  D9: Deployability (3-trial: Docker build + run + healthcheck)

Usage:
    python scripts/run_local_eval.py --dir /path/to/apps --limit 2
    python scripts/run_local_eval.py --dir /path/to/apps --apps app1 app2
    python scripts/run_local_eval.py --dir /path/to/apps  # all apps
"""

import argparse
import json
import os
import shlex
import signal
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# App type detection
# ---------------------------------------------------------------------------

def detect_app_type(app_dir: Path) -> str:
    """Detect whether the app is Node.js or Python."""
    if (app_dir / "package.json").exists():
        return "node"
    if (app_dir / "requirements.txt").exists() or (app_dir / "main.py").exists():
        return "python"
    if (app_dir / "pyproject.toml").exists():
        return "python"
    return "unknown"


def detect_python_entry_point(app_dir: Path) -> str | None:
    """Find the main entry point file for a Python app.

    Returns relative path from app_dir, or None if not found.
    """
    candidates = [
        "main.py",
        "app.py",
        "src/app.py",
        "src/main.py",
        "app/app.py",
        "app/main.py",
        "guest_history_app/app.py",  # specific case
    ]
    for c in candidates:
        if (app_dir / c).exists():
            return c

    # Fallback: find any app.py or main.py recursively (max depth 3)
    for pattern in ["**/app.py", "**/main.py"]:
        matches = sorted(app_dir.glob(pattern))
        matches = [m for m in matches if ".venv" not in str(m) and "__pycache__" not in str(m) and "test" not in str(m).lower()]
        if matches:
            return str(matches[0].relative_to(app_dir))

    return None


def detect_python_framework(app_dir: Path) -> str:
    """Detect the Python web framework used."""
    reqs = (app_dir / "requirements.txt")
    main = (app_dir / "main.py")
    src_app = (app_dir / "src" / "app.py")

    content = ""
    for f in [reqs, main, src_app]:
        if f.exists():
            content += f.read_text(errors="ignore")

    if "streamlit" in content.lower():
        return "streamlit"
    if "flask" in content.lower():
        return "flask"
    if "fastapi" in content.lower():
        return "fastapi"
    if "dash" in content.lower():
        return "dash"
    if "gradio" in content.lower():
        return "gradio"
    return "unknown"


# ---------------------------------------------------------------------------
# Shell command runner
# ---------------------------------------------------------------------------

def run_cmd(cmd: str, cwd: str, timeout: int = 120, env: dict | None = None) -> tuple[bool, str, str]:
    """Run a shell command. Returns (success, stdout, stderr)."""
    run_env = os.environ.copy()
    if env:
        run_env.update(env)

    # Unset Claude Code env vars to avoid nested session issues
    run_env.pop("CLAUDECODE", None)
    run_env.pop("CLAUDE_CODE_ENTRYPOINT", None)
    run_env.pop("CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY", None)

    try:
        result = subprocess.run(
            ["bash", "-c", cmd],
            cwd=cwd,
            env=run_env,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", f"Command timed out after {timeout}s"
    except Exception as e:
        return False, "", str(e)


def kill_port(port: int):
    """Kill any process on the given port."""
    subprocess.run(
        ["bash", "-c", f"lsof -ti:{port} | xargs kill -9 2>/dev/null || true"],
        capture_output=True, timeout=10
    )


# ---------------------------------------------------------------------------
# Metrics dataclass
# ---------------------------------------------------------------------------

@dataclass
class EvalMetrics:
    build_success: bool = False
    runtime_success: bool = False
    type_safety: bool = False
    tests_pass: bool = False
    databricks_connectivity: bool = False
    data_returned: bool = False
    ui_renders: bool = False
    local_runability_score: int = 0  # 0-3
    deployability_score: int = 0  # 0-3
    local_runability_pass: bool = False
    deployability_pass: bool = False
    test_coverage_pct: float = 0.0
    total_loc: int = 0
    build_time_sec: float = 0.0
    app_type: str = "unknown"
    framework: str = "unknown"


@dataclass
class EvalResult:
    app_name: str
    app_dir: str
    timestamp: str
    metrics: EvalMetrics
    issues: list[str]
    details: dict


# ---------------------------------------------------------------------------
# Individual metric checks
# ---------------------------------------------------------------------------

def check_build_node(app_dir: Path) -> tuple[bool, float, str]:
    """L1: Build for Node.js apps."""
    start = time.time()
    # Install dependencies
    ok, out, err = run_cmd(
        """
        if grep -q '"install:all"' package.json 2>/dev/null; then
            npm run install:all 2>&1
        else
            for dir in . server client; do
                if [ -f "$dir/package.json" ]; then
                    (cd "$dir" && npm install 2>&1) || exit 1
                fi
            done
        fi
        npm rebuild esbuild 2>/dev/null || true
        """,
        cwd=str(app_dir), timeout=180
    )
    if not ok:
        return False, time.time() - start, f"Install failed: {err[:500]}"

    # Build
    ok2, out2, err2 = run_cmd(
        """
        if [ -f "scripts/generate-types.ts" ]; then
            npm rebuild esbuild 2>/dev/null || true
            npm run typegen 2>&1 || echo "Warning: typegen failed"
        fi
        if [ -f "client/package.json" ]; then
            (cd client && npm run build 2>&1)
        elif grep -q '"build"' package.json 2>/dev/null; then
            npm run build 2>&1
        fi
        """,
        cwd=str(app_dir), timeout=180
    )
    dt = time.time() - start
    if not ok2:
        return False, dt, f"Build failed: {err2[:500]}"
    return True, dt, ""


def _get_venv_python(app_dir: Path) -> str:
    """Get path to venv python, creating venv if needed.

    Returns an UNQUOTED path — callers must use shlex.quote() when
    embedding in shell strings.
    """
    venv_dir = app_dir / ".venv"
    venv_python = venv_dir / "bin" / "python"
    if not venv_python.exists():
        subprocess.run(
            ["python3", "-m", "venv", str(venv_dir)],
            capture_output=True, timeout=30
        )
    return str(venv_python)


def check_build_python(app_dir: Path) -> tuple[bool, float, str]:
    """L1: Build for Python apps."""
    start = time.time()
    reqs = app_dir / "requirements.txt"
    pyproject = app_dir / "pyproject.toml"

    # Create venv
    venv_python = _get_venv_python(app_dir)
    qpy = shlex.quote(venv_python)

    if reqs.exists():
        ok, out, err = run_cmd(
            f"{qpy} -m pip install -r requirements.txt --quiet 2>&1",
            cwd=str(app_dir), timeout=300
        )
    elif pyproject.exists():
        ok, out, err = run_cmd(
            f"{qpy} -m pip install -e . --quiet 2>&1",
            cwd=str(app_dir), timeout=300
        )
    else:
        ok = True
        out, err = "", ""

    dt = time.time() - start
    if not ok:
        return False, dt, f"Install/build failed: {(out + err)[:500]}"

    # Sanity check: can we import main module?
    main_py = app_dir / "main.py"
    if main_py.exists():
        ok2, _, err2 = run_cmd(
            f"""{qpy} -c 'import ast; ast.parse(open("main.py").read())' 2>&1""",
            cwd=str(app_dir), timeout=30
        )
        if not ok2:
            return False, dt, f"Syntax error in main.py: {err2[:300]}"

    return True, dt, ""


def check_type_safety_node(app_dir: Path) -> tuple[bool, str]:
    """L3: TypeScript type checking."""
    ok, out, err = run_cmd(
        """
        if [ -f "scripts/generate-types.ts" ]; then
            npm rebuild esbuild 2>/dev/null || true
            npm run typegen 2>&1 || true
        fi
        for dir in . server client; do
            if [ -f "$dir/tsconfig.json" ]; then
                (cd "$dir" && npx tsc --noEmit --skipLibCheck 2>&1) || exit 1
            fi
        done
        """,
        cwd=str(app_dir), timeout=120
    )
    if not ok:
        return False, f"TypeScript errors: {(out + err)[-500:]}"
    return True, ""


def check_type_safety_python(app_dir: Path) -> tuple[bool, str]:
    """L3: Python type checking (best-effort)."""
    venv_python = _get_venv_python(app_dir)
    qpy = shlex.quote(venv_python)

    ok, out, err = run_cmd(
        f'find . -name "*.py" ! -path "./.venv/*" ! -path "./__pycache__/*" '
        f'-exec {qpy} -m py_compile {{}} \\; 2>&1',
        cwd=str(app_dir), timeout=60
    )
    return ok, f"Syntax errors: {(out + err)[-500:]}" if not ok else ""


def check_tests_node(app_dir: Path) -> tuple[bool, str]:
    """L4: Run tests for Node.js apps."""
    ok, out, err = run_cmd(
        """
        if [ -f "server/package.json" ]; then
            cd server
        fi
        npm test 2>&1
        """,
        cwd=str(app_dir), timeout=120
    )
    return ok, f"Test output: {(out + err)[-500:]}" if not ok else ""


def check_tests_python(app_dir: Path) -> tuple[bool, str]:
    """L4: Run tests for Python apps."""
    venv_python = _get_venv_python(app_dir)
    qpy = shlex.quote(venv_python)
    tests_dir = app_dir / "tests"
    test_dir = app_dir / "test"

    if not tests_dir.exists() and not test_dir.exists():
        ok, out, _ = run_cmd(
            'find . -name "test_*.py" -o -name "*_test.py" | grep -v .venv | head -1',
            cwd=str(app_dir), timeout=10
        )
        if not out.strip():
            return False, "No tests found"

    # Install pytest in venv
    run_cmd(f"{qpy} -m pip install pytest --quiet 2>&1", cwd=str(app_dir), timeout=60)

    ok, out, err = run_cmd(f"{qpy} -m pytest -x -q 2>&1", cwd=str(app_dir), timeout=120)
    return ok, f"Test output: {(out + err)[-500:]}" if not ok else ""


def check_start_node(app_dir: Path, port: int = 8000) -> tuple[bool, str]:
    """Start a Node.js app and verify it responds."""
    kill_port(port)

    ok, out, err = run_cmd(
        f"""
        npm start > /tmp/app_{port}.log 2>&1 &
        sleep 5
        for i in 1 2 3 4 5; do
            if curl -sf --max-time 2 http://localhost:{port}/healthcheck 2>/dev/null; then
                echo "HEALTH_OK"
                exit 0
            fi
            if curl -sf --max-time 2 http://localhost:{port}/ 2>/dev/null; then
                echo "ROOT_OK"
                exit 0
            fi
            sleep 2
        done
        echo "HEALTH_FAIL"
        exit 1
        """,
        cwd=str(app_dir), timeout=30
    )
    return ok, out + err


def check_start_python(app_dir: Path, port: int = 8000) -> tuple[bool, str]:
    """Start a Python app and verify it responds."""
    kill_port(port)

    venv_python = _get_venv_python(app_dir)
    venv_bin = str(Path(venv_python).parent)
    qpy = shlex.quote(venv_python)
    qbin = shlex.quote(venv_bin)
    framework = detect_python_framework(app_dir)
    entry = detect_python_entry_point(app_dir) or "main.py"
    qentry = shlex.quote(entry)

    if framework == "streamlit":
        start_cmd = f"{qbin}/streamlit run {qentry} --server.port {port} --server.headless true > /tmp/app_{port}.log 2>&1 &"
    elif framework == "flask":
        start_cmd = f"FLASK_RUN_PORT={port} {qpy} {qentry} > /tmp/app_{port}.log 2>&1 &"
    elif framework == "fastapi":
        # Derive module path from entry point
        module = entry.replace("/", ".").replace(".py", "") + ":app"
        start_cmd = f"{qbin}/uvicorn {module} --port {port} > /tmp/app_{port}.log 2>&1 &"
    else:
        start_cmd = f"DATABRICKS_APP_PORT={port} {qpy} {qentry} > /tmp/app_{port}.log 2>&1 &"

    ok, out, err = run_cmd(
        f"""
        export PATH={qbin}:"$PATH"
        {start_cmd}
        sleep 8
        for i in 1 2 3 4 5; do
            if curl -sf --max-time 2 http://localhost:{port}/healthcheck 2>/dev/null; then
                echo "HEALTH_OK"
                exit 0
            fi
            if curl -sf --max-time 2 http://localhost:{port}/ 2>/dev/null; then
                echo "ROOT_OK"
                exit 0
            fi
            sleep 2
        done
        cat /tmp/app_{port}.log 2>/dev/null | tail -20
        echo "HEALTH_FAIL"
        exit 1
        """,
        cwd=str(app_dir), timeout=60
    )
    return ok, out + err


def check_runtime(app_dir: Path, app_type: str, port: int = 8000) -> tuple[bool, str]:
    """L2: Runtime success (start + healthcheck)."""
    if app_type == "node":
        return check_start_node(app_dir, port)
    elif app_type == "python":
        return check_start_python(app_dir, port)
    return False, "Unknown app type"


def check_ui_renders(port: int = 8000) -> tuple[bool, str]:
    """L7: Check if UI renders (app must already be running)."""
    ok, out, err = run_cmd(
        f"""
        body=$(curl -sf --max-time 5 "http://localhost:{port}/" 2>/dev/null || true)
        if [ -z "$body" ]; then
            echo "STATUS: FAIL - empty response"
            exit 1
        fi
        echo "$body" | tr '[:upper:]' '[:lower:]' | grep -q "error\\|exception\\|traceback\\|cannot get\\|not found" && {{ echo "STATUS: FAIL - error in response"; exit 1; }}
        echo "STATUS: PASS"
        exit 0
        """,
        cwd="/tmp", timeout=15
    )
    return ok, out + err


def check_db_connectivity(port: int = 8000) -> tuple[bool, str]:
    """L5: Check Databricks connectivity through running app."""
    ok, out, err = run_cmd(
        f"""
        if curl -sf --max-time 3 "http://localhost:{port}/healthcheck" 2>/dev/null | grep -qi "databricks\\|connected\\|ok"; then
            echo "STATUS: PASS"
            exit 0
        fi
        # Try common API endpoints
        for ep in /api/health /api/status /api/analytics; do
            resp=$(curl -sf --max-time 5 "http://localhost:{port}$ep" 2>/dev/null || true)
            if [ -n "$resp" ] && echo "$resp" | grep -qi "data\\|rows\\|result"; then
                echo "STATUS: PASS"
                exit 0
            fi
        done
        echo "STATUS: FAIL"
        exit 1
        """,
        cwd="/tmp", timeout=20
    )
    return ok, out + err


def check_runability_trial(app_dir: Path, app_type: str, port: int = 8000) -> tuple[bool, str]:
    """Single D8 trial: install + start + healthcheck + stop."""
    kill_port(port)

    if app_type == "node":
        cmd = f"""
        cd "{app_dir}"
        if grep -q '"install:all"' package.json 2>/dev/null; then
            npm run install:all 2>&1 || exit 1
        else
            for dir in . server client; do
                if [ -f "$dir/package.json" ]; then
                    (cd "$dir" && npm install 2>&1) || exit 1
                fi
            done
        fi
        npm start > /tmp/app_runability.log 2>&1 &
        sleep 5
        ok=0
        for i in 1 2 3; do
            if curl -sf --max-time 3 http://localhost:{port}/healthcheck >/dev/null 2>&1; then ok=1; break; fi
            if curl -sf --max-time 3 http://localhost:{port}/ >/dev/null 2>&1; then ok=1; break; fi
            sleep 2
        done
        lsof -ti:{port} | xargs kill -9 2>/dev/null || true
        if [ "$ok" -eq 1 ]; then
            echo "STATUS: PASS"
            exit 0
        fi
        echo "STATUS: FAIL"
        cat /tmp/app_runability.log 2>/dev/null | tail -10
        exit 1
        """
    elif app_type == "python":
        venv_python = _get_venv_python(app_dir)
        venv_bin = str(Path(venv_python).parent)
        qpy = shlex.quote(venv_python)
        qbin = shlex.quote(venv_bin)
        qdir = shlex.quote(str(app_dir))
        framework = detect_python_framework(app_dir)
        entry = detect_python_entry_point(app_dir) or "main.py"
        qentry = shlex.quote(entry)
        if framework == "streamlit":
            start = f"{qbin}/streamlit run {qentry} --server.port {port} --server.headless true"
        elif framework == "fastapi":
            module = entry.replace("/", ".").replace(".py", "") + ":app"
            start = f"{qbin}/uvicorn {module} --port {port}"
        else:
            start = f"{qpy} {qentry}"

        cmd = f"""
        cd {qdir}
        export PATH={qbin}:"$PATH"
        if [ -f requirements.txt ]; then
            {qpy} -m pip install -r requirements.txt --quiet 2>&1 || exit 1
        fi
        export DATABRICKS_APP_PORT={port}
        {start} > /tmp/app_runability.log 2>&1 &
        sleep 8
        ok=0
        for i in 1 2 3; do
            if curl -sf --max-time 3 http://localhost:{port}/healthcheck >/dev/null 2>&1; then ok=1; break; fi
            if curl -sf --max-time 3 http://localhost:{port}/ >/dev/null 2>&1; then ok=1; break; fi
            sleep 2
        done
        lsof -ti:{port} | xargs kill -9 2>/dev/null || true
        if [ "$ok" -eq 1 ]; then
            echo "STATUS: PASS"
            exit 0
        fi
        echo "STATUS: FAIL"
        cat /tmp/app_runability.log 2>/dev/null | tail -10
        exit 1
        """
    else:
        return False, "Unknown app type"

    ok, out, err = run_cmd(cmd, cwd=str(app_dir), timeout=120)
    kill_port(port)
    return ok, out + err


def check_deployability_trial(app_dir: Path, port: int = 8010) -> tuple[bool, str]:
    """Single D9 trial: Docker build + run + healthcheck."""
    dockerfile = app_dir / "Dockerfile"
    if not dockerfile.exists():
        return False, "No Dockerfile found"

    tag = f"eval-deploy-{app_dir.name.lower().replace('_', '-')}"

    cmd = f"""
    docker rm -f "{tag}" >/dev/null 2>&1 || true
    docker build -t "{tag}" . 2>&1 || {{ echo "STATUS: FAIL - build"; exit 1; }}
    docker run -d --name "{tag}" -p {port}:8000 "{tag}" >/dev/null 2>&1 || \
    docker run -d --name "{tag}" -p {port}:3000 "{tag}" >/dev/null 2>&1 || \
    {{ echo "STATUS: FAIL - run"; exit 1; }}
    sleep 5
    ok=0
    for i in 1 2 3; do
        if curl -sf --max-time 3 http://localhost:{port}/healthcheck >/dev/null 2>&1; then ok=1; break; fi
        if curl -sf --max-time 3 http://localhost:{port}/ >/dev/null 2>&1; then ok=1; break; fi
        sleep 2
    done
    docker rm -f "{tag}" >/dev/null 2>&1 || true
    if [ "$ok" -eq 1 ]; then
        echo "STATUS: PASS"
        exit 0
    fi
    echo "STATUS: FAIL"
    exit 1
    """

    ok, out, err = run_cmd(cmd, cwd=str(app_dir), timeout=300)
    # Cleanup
    subprocess.run(["bash", "-c", f'docker rm -f "{tag}" 2>/dev/null || true'],
                    capture_output=True, timeout=10)
    return ok, out + err


def count_loc(app_dir: Path) -> int:
    """Count lines of code (excluding node_modules, .git, etc.)."""
    ok, out, _ = run_cmd(
        "find . -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.py' "
        "| grep -v node_modules | grep -v .git | grep -v __pycache__ "
        "| xargs wc -l 2>/dev/null | tail -1",
        cwd=str(app_dir), timeout=30
    )
    if ok and out.strip():
        try:
            return int(out.strip().split()[0])
        except (ValueError, IndexError):
            pass
    return 0


# ---------------------------------------------------------------------------
# Full evaluation
# ---------------------------------------------------------------------------

RUNABILITY_PASS_THRESHOLD = 2  # 2/3 majority
DEPLOYABILITY_PASS_THRESHOLD = 2
D8_PORT = 8000
D9_PORT = 8010
D8_TRIALS = 3
D9_TRIALS = 3


def evaluate_app(app_dir: Path, skip_db: bool = True, skip_deploy: bool = False) -> EvalResult:
    """Run full evaluation on a single app."""
    app_name = app_dir.name
    app_type = detect_app_type(app_dir)
    framework = detect_python_framework(app_dir) if app_type == "python" else "node"

    print(f"\n{'='*60}")
    print(f"Evaluating: {app_name} (type={app_type}, framework={framework})")
    print(f"{'='*60}")

    metrics = EvalMetrics(app_type=app_type, framework=framework)
    issues = []
    details = {}

    # --- L1: Build ---
    print("  [L1] Build...", end=" ", flush=True)
    if app_type == "node":
        build_ok, build_time, build_err = check_build_node(app_dir)
    elif app_type == "python":
        build_ok, build_time, build_err = check_build_python(app_dir)
    else:
        build_ok, build_time, build_err = False, 0.0, "Unknown type"
    metrics.build_success = build_ok
    metrics.build_time_sec = round(build_time, 1)
    print("PASS" if build_ok else f"FAIL ({build_err[:80]})")
    if not build_ok:
        issues.append(f"Build failed: {build_err[:200]}")
    details["build"] = {"ok": build_ok, "time": build_time, "error": build_err[:300]}

    # --- L3: Type Safety ---
    print("  [L3] Type safety...", end=" ", flush=True)
    if app_type == "node":
        ts_ok, ts_err = check_type_safety_node(app_dir)
    elif app_type == "python":
        ts_ok, ts_err = check_type_safety_python(app_dir)
    else:
        ts_ok, ts_err = False, "Unknown type"
    metrics.type_safety = ts_ok
    print("PASS" if ts_ok else f"FAIL")
    if not ts_ok:
        issues.append(f"Type safety failed")
    details["type_safety"] = {"ok": ts_ok, "error": ts_err[:300]}

    # --- L4: Tests ---
    print("  [L4] Tests...", end=" ", flush=True)
    if app_type == "node":
        test_ok, test_out = check_tests_node(app_dir)
    elif app_type == "python":
        test_ok, test_out = check_tests_python(app_dir)
    else:
        test_ok, test_out = False, "Unknown type"
    metrics.tests_pass = test_ok
    print("PASS" if test_ok else "FAIL")
    if not test_ok:
        issues.append("Tests failed")
    details["tests"] = {"ok": test_ok, "output": test_out[:500]}

    # --- L2: Runtime (start + healthcheck) ---
    print("  [L2] Runtime...", end=" ", flush=True)
    rt_ok, rt_out = check_runtime(app_dir, app_type, port=D8_PORT)
    metrics.runtime_success = rt_ok
    print("PASS" if rt_ok else "FAIL")
    if not rt_ok:
        issues.append("Runtime failed (app did not start or respond)")
    details["runtime"] = {"ok": rt_ok, "output": rt_out[:500]}

    # --- L7: UI Renders (if app started) ---
    if rt_ok:
        print("  [L7] UI renders...", end=" ", flush=True)
        ui_ok, ui_out = check_ui_renders(port=D8_PORT)
        metrics.ui_renders = ui_ok
        print("PASS" if ui_ok else "FAIL")
        if not ui_ok:
            issues.append("UI renders check failed")
        details["ui_renders"] = {"ok": ui_ok, "output": ui_out[:300]}

        # --- L5: DB Connectivity ---
        if not skip_db:
            print("  [L5] DB connectivity...", end=" ", flush=True)
            db_ok, db_out = check_db_connectivity(port=D8_PORT)
            metrics.databricks_connectivity = db_ok
            print("PASS" if db_ok else "FAIL")
            details["db_connectivity"] = {"ok": db_ok, "output": db_out[:300]}
        else:
            print("  [L5] DB connectivity... SKIP (no DB creds)")
            details["db_connectivity"] = {"ok": False, "output": "Skipped - no DB credentials"}

        # L6: Data returned - skip locally
        print("  [L6] Data returned... SKIP (needs live DB)")
        details["data_returned"] = {"ok": False, "output": "Skipped - needs live DB"}
    else:
        print("  [L5-L7] Skipping (app not running)")
        details["ui_renders"] = {"ok": False, "output": "App not running"}
        details["db_connectivity"] = {"ok": False, "output": "App not running"}
        details["data_returned"] = {"ok": False, "output": "App not running"}

    # Stop any running process
    kill_port(D8_PORT)

    # --- D8: Local Runability (3 trials) ---
    print(f"  [D8] Local runability ({D8_TRIALS} trials)...")
    d8_passes = 0
    d8_details = []
    for trial in range(D8_TRIALS):
        print(f"    Trial {trial+1}/{D8_TRIALS}...", end=" ", flush=True)
        d8_ok, d8_out = check_runability_trial(app_dir, app_type, port=D8_PORT)
        d8_passes += int(d8_ok)
        d8_details.append({"trial": trial+1, "ok": d8_ok, "output": d8_out[:300]})
        print("PASS" if d8_ok else "FAIL")
    metrics.local_runability_score = d8_passes
    metrics.local_runability_pass = d8_passes >= RUNABILITY_PASS_THRESHOLD
    print(f"    D8 result: {d8_passes}/{D8_TRIALS} (threshold={RUNABILITY_PASS_THRESHOLD}) → {'PASS' if metrics.local_runability_pass else 'FAIL'}")
    if not metrics.local_runability_pass:
        issues.append(f"Runability failed ({d8_passes}/{D8_TRIALS} trials passed)")
    details["runability"] = {"passes": d8_passes, "trials": D8_TRIALS, "details": d8_details}

    # --- D9: Deployability (3 trials) ---
    if not skip_deploy:
        dockerfile = app_dir / "Dockerfile"
        if dockerfile.exists():
            print(f"  [D9] Deployability ({D9_TRIALS} trials)...")
            d9_passes = 0
            d9_details = []
            for trial in range(D9_TRIALS):
                print(f"    Trial {trial+1}/{D9_TRIALS}...", end=" ", flush=True)
                d9_ok, d9_out = check_deployability_trial(app_dir, port=D9_PORT)
                d9_passes += int(d9_ok)
                d9_details.append({"trial": trial+1, "ok": d9_ok, "output": d9_out[:300]})
                print("PASS" if d9_ok else "FAIL")
            metrics.deployability_score = d9_passes
            metrics.deployability_pass = d9_passes >= DEPLOYABILITY_PASS_THRESHOLD
            print(f"    D9 result: {d9_passes}/{D9_TRIALS} (threshold={DEPLOYABILITY_PASS_THRESHOLD}) → {'PASS' if metrics.deployability_pass else 'FAIL'}")
            details["deployability"] = {"passes": d9_passes, "trials": D9_TRIALS, "details": d9_details}
        else:
            print("  [D9] Deployability... SKIP (no Dockerfile)")
            details["deployability"] = {"ok": False, "output": "No Dockerfile"}
    else:
        print("  [D9] Deployability... SKIP (disabled)")
        details["deployability"] = {"ok": False, "output": "Disabled"}

    if not metrics.deployability_pass:
        issues.append("Deployability failed or skipped")

    # LOC count
    metrics.total_loc = count_loc(app_dir)

    return EvalResult(
        app_name=app_name,
        app_dir=str(app_dir),
        timestamp=datetime.now(timezone.utc).isoformat(),
        metrics=metrics,
        issues=issues,
        details=details,
    )


# ---------------------------------------------------------------------------
# Batch runner
# ---------------------------------------------------------------------------

def find_app_dirs(base_dir: Path, apps: list[str] | None = None, limit: int | None = None, skip: int = 0) -> list[Path]:
    """Find app directories under base_dir (handles nested collection folders)."""
    all_apps = []

    for item in sorted(base_dir.iterdir()):
        if not item.is_dir():
            continue
        if item.name.startswith(".") or item.name == "__pycache__" or item.name == "node_modules":
            continue

        # Check if this is a collection folder (contains sub-app folders)
        if item.name.startswith("app-"):
            for sub in sorted(item.iterdir()):
                if sub.is_dir() and not sub.name.startswith(".") and sub.name != "node_modules":
                    # Check it looks like an app
                    if (sub / "package.json").exists() or (sub / "main.py").exists() or (sub / "requirements.txt").exists():
                        all_apps.append(sub)
        else:
            # Direct app directory
            if (item / "package.json").exists() or (item / "main.py").exists() or (item / "requirements.txt").exists():
                all_apps.append(item)

    if apps:
        all_apps = [a for a in all_apps if a.name in apps]

    all_apps = all_apps[skip:]
    if limit:
        all_apps = all_apps[:limit]

    return all_apps


def main():
    parser = argparse.ArgumentParser(description="Run local CanItShip evaluation")
    parser.add_argument("--dir", required=True, help="Root directory containing apps")
    parser.add_argument("--apps", nargs="*", help="Specific app names to evaluate")
    parser.add_argument("--limit", type=int, help="Max number of apps to evaluate")
    parser.add_argument("--skip", type=int, default=0, help="Number of apps to skip")
    parser.add_argument("--skip-db", action="store_true", default=True, help="Skip DB connectivity checks")
    parser.add_argument("--skip-deploy", action="store_true", default=False, help="Skip deployability checks")
    parser.add_argument("--output", help="Output directory for results (default: next to --dir)")
    args = parser.parse_args()

    base_dir = Path(args.dir).resolve()
    if not base_dir.exists():
        print(f"Error: {base_dir} does not exist")
        sys.exit(1)

    app_dirs = find_app_dirs(base_dir, args.apps, args.limit, args.skip)
    print(f"Found {len(app_dirs)} apps to evaluate")
    for a in app_dirs:
        print(f"  - {a.parent.name}/{a.name}")

    if not app_dirs:
        print("No apps found!")
        sys.exit(1)

    # Output directory
    if args.output:
        out_dir = Path(args.output)
    else:
        out_dir = base_dir / "eval_results"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Run evaluations
    results = []
    for i, app_dir in enumerate(app_dirs, 1):
        print(f"\n[{i}/{len(app_dirs)}] {app_dir.parent.name}/{app_dir.name}")
        try:
            result = evaluate_app(app_dir, skip_db=args.skip_db, skip_deploy=args.skip_deploy)
            results.append(result)

            # Save individual result
            result_file = out_dir / f"{app_dir.name}_eval.json"
            with open(result_file, "w") as f:
                json.dump(asdict(result), f, indent=2)
            print(f"  → Saved: {result_file}")

        except Exception as e:
            print(f"  ERROR: {e}")
            results.append(EvalResult(
                app_name=app_dir.name,
                app_dir=str(app_dir),
                timestamp=datetime.now(timezone.utc).isoformat(),
                metrics=EvalMetrics(),
                issues=[f"Evaluation error: {str(e)}"],
                details={"error": str(e)},
            ))

    # Summary
    print(f"\n{'='*60}")
    print("EVALUATION SUMMARY")
    print(f"{'='*60}")
    total = len(results)
    l1 = sum(1 for r in results if r.metrics.build_success)
    l2 = sum(1 for r in results if r.metrics.runtime_success)
    l3 = sum(1 for r in results if r.metrics.type_safety)
    l4 = sum(1 for r in results if r.metrics.tests_pass)
    l5 = sum(1 for r in results if r.metrics.databricks_connectivity)
    l6 = sum(1 for r in results if r.metrics.data_returned)
    l7 = sum(1 for r in results if r.metrics.ui_renders)
    d8 = sum(1 for r in results if r.metrics.local_runability_pass)
    d9 = sum(1 for r in results if r.metrics.deployability_pass)

    print(f"  Total apps: {total}")
    print(f"  L1 Build:           {l1}/{total} ({100*l1/total:.0f}%)")
    print(f"  L2 Runtime:         {l2}/{total} ({100*l2/total:.0f}%)")
    print(f"  L3 Type Safety:     {l3}/{total} ({100*l3/total:.0f}%)")
    print(f"  L4 Tests:           {l4}/{total} ({100*l4/total:.0f}%)")
    print(f"  L5 DB Connectivity: {l5}/{total} ({100*l5/total:.0f}%)")
    print(f"  L6 Data Returned:   {l6}/{total} ({100*l6/total:.0f}%)")
    print(f"  L7 UI Renders:      {l7}/{total} ({100*l7/total:.0f}%)")
    print(f"  D8 Runability:      {d8}/{total} ({100*d8/total:.0f}%)")
    print(f"  D9 Deployability:   {d9}/{total} ({100*d9/total:.0f}%)")

    # Save aggregate report
    report = {
        "run_timestamp": datetime.now(timezone.utc).isoformat(),
        "base_dir": str(base_dir),
        "total_apps": total,
        "metrics_summary": {
            "L1_build": {"pass": l1, "total": total, "pct": round(100*l1/total, 1)},
            "L2_runtime": {"pass": l2, "total": total, "pct": round(100*l2/total, 1)},
            "L3_type_safety": {"pass": l3, "total": total, "pct": round(100*l3/total, 1)},
            "L4_tests": {"pass": l4, "total": total, "pct": round(100*l4/total, 1)},
            "L5_db_connectivity": {"pass": l5, "total": total, "pct": round(100*l5/total, 1)},
            "L6_data_returned": {"pass": l6, "total": total, "pct": round(100*l6/total, 1)},
            "L7_ui_renders": {"pass": l7, "total": total, "pct": round(100*l7/total, 1)},
            "D8_runability": {"pass": d8, "total": total, "pct": round(100*d8/total, 1)},
            "D9_deployability": {"pass": d9, "total": total, "pct": round(100*d9/total, 1)},
        },
        "per_app": [asdict(r) for r in results],
    }

    report_file = out_dir / "evaluation_report.json"
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n  Report saved: {report_file}")


if __name__ == "__main__":
    main()
