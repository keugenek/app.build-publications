#!/usr/bin/env python3
"""Analyze benchmark results from agent evaluation runs."""

import hashlib
from pathlib import Path
from typing import Any

import polars as pl
import ujson

from fire import Fire


def extract_ablation_type(results_path: Path) -> str:
    """Extract ablation type from directory path structure.

    Returns ablation name if path contains 'ablation/DIR', otherwise 'baseline'.
    """
    path_parts = results_path.parts

    # look for pattern like 'ablation/something' or 'benchmark_results_something'
    for part in path_parts:
        if part.startswith("benchmark_results_") and part != "benchmark_results":
            # extract ablation type from benchmark_results_X format
            return part.replace("benchmark_results_", "")

    return "baseline"


def check_template_failed(experiment_dir: Path, template_id: str) -> bool:
    """Check if template generation failed for trpc-agent by examining App.tsx MD5.

    For trpc-agent, if source_code/client/src/App.tsx has MD5 eeb92b801087f89346a7ad3c1baa5163,
    it means the template generation failed (file is the default template, no real UI is generated)
    """
    if template_id != "trpc-agent":
        return False

    app_tsx_path = experiment_dir / "source_code" / "client" / "src" / "App.tsx"
    if not app_tsx_path.exists():
        return False

    try:
        with app_tsx_path.open("rb") as f:
            content = f.read()
            md5_hash = hashlib.md5(content).hexdigest()
            return md5_hash == "eeb92b801087f89346a7ad3c1baa5163"
    except (OSError, IOError):
        return False


def load_experiment_data(results_dir: str) -> list[dict[str, Any]]:
    """Load experiment data from a single results directory."""
    results_path = Path(results_dir)
    if not results_path.exists():
        return []

    results: list[dict[str, Any]] = []

    for experiment_dir in results_path.iterdir():
        if not experiment_dir.is_dir() or experiment_dir.name == ".DS_Store":
            continue

        status_file = experiment_dir / "status.json"
        telemetry_file = experiment_dir / "telemetry.json"

        if not status_file.exists():
            continue

        # load status data
        with status_file.open("rb") as f:
            status_data = ujson.load(f)

        # load telemetry data if available
        telemetry_data = {}
        if telemetry_file.exists():
            with telemetry_file.open("rb") as f:
                telemetry_data = ujson.load(f)

        # parse experiment name components
        parts = experiment_dir.name.split("_")
        if len(parts) >= 4:
            prompt_name = parts[0]
            template_id = parts[1]
            coding_model = parts[2]
            universal_model = parts[3]
        else:
            prompt_name = experiment_dir.name
            template_id = "unknown"
            coding_model = "unknown"
            universal_model = "unknown"

        # extract key metrics
        healthcheck_pass = status_data.get("success", False)
        template_failed = check_template_failed(experiment_dir, template_id)

        result = {
            "experiment_name": experiment_dir.name,
            "prompt_name": prompt_name,
            "template_id": template_id,
            "coding_model": coding_model,
            "universal_model": universal_model,
            "ablation_type": extract_ablation_type(results_path),
            "healthcheck_pass": healthcheck_pass,
            "success": healthcheck_pass and not template_failed,
            "exit_code": status_data.get("exit_code", -1),
            "docker_healthy": status_data.get("docker_healthy", False),
            "duration_seconds": status_data.get("duration_seconds", 0.0),
            "timestamp": status_data.get("timestamp", ""),
            "template_failed": template_failed,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_llm_calls": 0,
            "total_llm_time": 0.0,
            "source_dir": str(results_path),
        }

        # aggregate telemetry metrics across all models
        for model_name, metrics in telemetry_data.items():
            result["total_input_tokens"] += metrics.get("total_input_tokens", 0)
            result["total_output_tokens"] += metrics.get("total_output_tokens", 0)
            result["total_llm_calls"] += metrics.get("total_calls", 0)
            result["total_llm_time"] += metrics.get("total_time_seconds", 0.0)

        results.append(result)

    return results


def analyze_benchmarks(*results_dirs: str) -> None:
    """Analyze benchmark results from one or more directories and display comprehensive statistics."""
    if not results_dirs:
        results_dirs = ("/Users/arseni.kravchenko/dev/agent/agent/benchmark_results",)

    all_results: list[dict[str, Any]] = []

    for results_dir in results_dirs:
        print(f"Loading from {results_dir}...")
        experiment_data = load_experiment_data(results_dir)
        all_results.extend(experiment_data)
        print(f"  Found {len(experiment_data)} experiments")

    if not all_results:
        print("No experiment data found in any directory")
        return

    df = pl.DataFrame(all_results)

    # overall summary
    print("=== Benchmark Results Summary ===")
    print(f"Total experiments: {len(df)}")
    print(f"Success rate: {df['success'].mean():.2%}")
    print(f"Healthcheck pass rate: {df['healthcheck_pass'].mean():.2%}")
    trpc_df = df.filter(pl.col("template_id") == "trpc-agent")
    if len(trpc_df) > 0:
        print(f"Template failure rate (trpc-agent): {trpc_df['template_failed'].mean():.2%}")
    print(f"Average duration: {df['duration_seconds'].mean():.1f}s")
    print(f"Median duration: {df['duration_seconds'].median():.1f}s")

    # token usage and cost calculation
    total_input_tokens = df["total_input_tokens"].sum()
    total_output_tokens = df["total_output_tokens"].sum()
    total_calls = df["total_llm_calls"].sum()
    total_llm_time = df["total_llm_time"].sum()

    # cost rates per 1M tokens (input/output)
    cost_rates = {
        "claude": (3.0, 15.0),
        "gpt-oss": (0.1, 0.5),
        "qwen3-480b-35a": (0.3, 1.2)
    }

    # calculate costs by model
    total_cost = 0.0
    model_costs = {}

    for model in df["coding_model"].unique():
        model_df = df.filter(pl.col("coding_model") == model)
        input_tokens = model_df["total_input_tokens"].sum()
        output_tokens = model_df["total_output_tokens"].sum()

        if model in cost_rates:
            input_rate, output_rate = cost_rates[model]
            cost = (input_tokens / 1_000_000 * input_rate) + (output_tokens / 1_000_000 * output_rate)
            model_costs[model] = cost
            total_cost += cost

    print(f"\n=== Token Usage & Costs ===")
    print(f"Total input tokens: {total_input_tokens:_}")
    print(f"Total output tokens: {total_output_tokens:_}")
    print(f"Total LLM calls: {total_calls:_}")
    print(f"Total LLM time: {total_llm_time:.1f}s")
    print(f"Total cost: ${total_cost:.2f}")
    if total_llm_time > 0:
        print(f"Avg tokens/sec (input): {total_input_tokens/total_llm_time:.0f}")
        print(f"Avg tokens/sec (output): {total_output_tokens/total_llm_time:.0f}")

    print(f"\n=== Cost by Model ===")
    for model, cost in model_costs.items():
        print(f"{model}: ${cost:.2f}")

    # by coding model with cost
    print("\n=== By Coding Model & Ablation Type ===")
    model_stats = df.group_by(["coding_model", "ablation_type"]).agg([
        pl.col("success").mean().alias("success_rate"),
        pl.col("healthcheck_pass").mean().alias("healthcheck_pass_rate"),
        pl.col("template_failed").mean().alias("template_failed_rate"),
        pl.col("duration_seconds").mean().alias("avg_duration"),
        pl.col("total_input_tokens").sum().alias("input_tokens"),
        pl.col("total_output_tokens").sum().alias("output_tokens"),
        pl.col("total_llm_calls").sum().alias("llm_calls"),
        pl.len().alias("count")
    ]).sort(["coding_model", "success_rate"], descending=[False, True])

    # add cost column
    costs = []
    for row in model_stats.iter_rows(named=True):
        model = row["coding_model"]
        if model in cost_rates:
            input_rate, output_rate = cost_rates[model]
            cost = (row["input_tokens"] / 1_000_000 * input_rate) + (row["output_tokens"] / 1_000_000 * output_rate)
            costs.append(cost)
        else:
            costs.append(0.0)

    model_stats = model_stats.with_columns(pl.Series("cost_usd", costs))

    # format numbers with underscores
    with pl.Config(tbl_rows=-1, tbl_cols=-1, tbl_width_chars=1000, thousands_separator=True):
        print(model_stats)

    # by template/stack
    print("\n=== By Template/Stack & Ablation Type ===")
    template_stats = df.group_by(["template_id", "ablation_type"]).agg([
        pl.col("success").mean().alias("success_rate"),
        pl.col("healthcheck_pass").mean().alias("healthcheck_pass_rate"),
        pl.col("template_failed").mean().alias("template_failed_rate"),
        pl.col("duration_seconds").mean().alias("avg_duration"),
        pl.col("total_input_tokens").sum().alias("input_tokens"),
        pl.col("total_output_tokens").sum().alias("output_tokens"),
        pl.len().alias("count")
    ]).sort(["template_id", "success_rate"], descending=[False, True])

    # format numbers with underscores
    with pl.Config(tbl_rows=-1, tbl_cols=-1, tbl_width_chars=1000, thousands_separator=True):
        print(template_stats)

    # by stack + model combination with cost
    print("\n=== By Stack + Model + Ablation Combination ===")
    stack_model_stats = df.group_by(["template_id", "coding_model", "ablation_type"]).agg([
        pl.col("success").mean().alias("success_rate"),
        pl.col("healthcheck_pass").mean().alias("healthcheck_pass_rate"),
        pl.col("template_failed").mean().alias("template_failed_rate"),
        pl.col("duration_seconds").mean().alias("avg_duration"),
        pl.col("total_input_tokens").sum().alias("input_tokens"),
        pl.col("total_output_tokens").sum().alias("output_tokens"),
        pl.col("total_llm_calls").sum().alias("llm_calls"),
        pl.len().alias("count")
    ]).sort(["template_id", "coding_model", "success_rate"], descending=[False, False, True])

    # add cost column
    stack_costs = []
    for row in stack_model_stats.iter_rows(named=True):
        model = row["coding_model"]
        if model in cost_rates:
            input_rate, output_rate = cost_rates[model]
            cost = (row["input_tokens"] / 1_000_000 * input_rate) + (row["output_tokens"] / 1_000_000 * output_rate)
            stack_costs.append(cost)
        else:
            stack_costs.append(0.0)

    stack_model_stats = stack_model_stats.with_columns(pl.Series("cost_usd", stack_costs))

    # configure polars to show full table with formatted numbers
    with pl.Config(tbl_rows=-1, tbl_cols=-1, tbl_width_chars=1000, thousands_separator=True):
        print(stack_model_stats)

    # export to csv
    output_path = "benchmark_analysis.csv"
    df.write_csv(output_path)
    print(f"\nExported {len(df)} results to {output_path}")


if __name__ == "__main__":
    Fire(analyze_benchmarks)
