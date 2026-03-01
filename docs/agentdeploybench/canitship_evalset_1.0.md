# CanItShip EvalSet 1.0

## Philosophy

Two-layer evaluation: **Agent Validator** (LLM, subjective) + **Hard Gate** (script, objective).

The agent validates *intent* — does this app do what was asked?
The script validates *fact* — does it actually run, deploy, type-check?

Neither alone is sufficient. Together they answer: **Can it ship?**

---

## Architecture

```
                        CanItShip EvalSet 1.0

┌─────────────────────────────────────────────────────────┐
│                    GENERATED ARTIFACT                     │
│              (code repo from model under test)            │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
    ┌──────────────────┐   ┌──────────────────┐
    │  AGENT VALIDATOR  │   │    HARD GATE     │
    │                  │   │                  │
    │  LLM reads code, │   │  Scripts produce │
    │  tries to build, │   │  artifacts:      │
    │  run, deploy,    │   │                  │
    │  interact.       │   │  • running app   │
    │                  │   │  • deployed app  │
    │  Reports:        │   │  • test report   │
    │  • turns used    │   │  • typecheck log │
    │  • modifications │   │  • Playwright    │
    │  • observations  │   │    screenshots   │
    │  • judgment      │   │  • CRUD results  │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             ▼                      ▼
    ┌──────────────────────────────────────────┐
    │              SCORE MERGE                  │
    │                                          │
    │  ShipScore = agent_score × gate_score    │
    │  (can't cheat either layer)              │
    └──────────────────────────────────────────┘
```

---

## Agent Validator: 3 Tiers

The same evaluation prompt runs at 3 model tiers. Different models = different "seniority levels." This measures how *agent-friendly* the code is — can a junior agent ship it, or does it need a senior?

| Tier | Model | Analogy | What it tests |
|------|-------|---------|---------------|
| 🔴 **Expert** | Claude Opus | Senior engineer | Can the best agent ship it? (ceiling) |
| 🟡 **Mid** | Claude Sonnet | Mid-level dev | Can a competent agent ship it? (target) |
| 🟢 **Junior** | Claude Haiku | Junior / intern | Can even a cheap fast agent ship it? (floor) |

**Why 3 tiers matter:**
- If Expert passes but Junior fails → code works but needs tribal knowledge
- If all 3 pass → code is well-documented and self-explanatory
- If Expert fails → code is fundamentally broken
- **Tier gap = documentation quality signal**

### Agent Validator Prompt (per task)

Each task gets ONE prompt. Agent works within a turn budget. No hand-holding.

```
SYSTEM: You are a {tier} software engineer evaluating a code artifact.
Your job: {task_description}
Budget: {max_turns} attempts.
Rules:
- Do NOT modify source code unless absolutely necessary.
- If you modify code, document exactly what and why.
- After each attempt, report what happened.
- When done, report: SUCCESS or FAIL, plus observations.
```

---

## 9 Evaluation Tasks

### T1: Build

| | |
|---|---|
| **Agent prompt** | "Read the project docs. Build the project. Report success or failure." |
| **Hard gate artifact** | `build.log` (exit code 0 or non-0) |
| **Hard gate check** | `exit_code == 0 && no_error_lines(build.log)` |
| **Agent measures** | turns, modifications, missing docs found |

### T2: Run

| | |
|---|---|
| **Agent prompt** | "Start the application. Verify it serves content on the expected port." |
| **Hard gate artifact** | Running process + HTTP response |
| **Hard gate check** | `curl localhost:PORT → 2xx within 30s` |
| **Agent measures** | turns, env vars created, modifications |

### T3: Type Safety

| | |
|---|---|
| **Agent prompt** | "Find and run the type checker. Report the number of type errors." |
| **Hard gate artifact** | `typecheck.log` |
| **Hard gate check** | `error_count == 0` (from parsed log) |
| **Agent measures** | turns, which checker found, error count |

### T4: Tests

| | |
|---|---|
| **Agent prompt** | "Discover and run the test suite. Report results." |
| **Hard gate artifact** | `test_report.json` (JUnit/TAP/JSON) |
| **Hard gate check** | `pass_rate >= threshold` (e.g., 80%) |
| **Agent measures** | turns, tests discovered, pass/fail/skip counts |

### T5: Data Connectivity

| | |
|---|---|
| **Agent prompt** | "Verify the app connects to its database. Report DB type and status." |
| **Hard gate artifact** | DB connection log or `SELECT 1` result |
| **Hard gate check** | `connection_established == true` |
| **Agent measures** | turns, connection method, modifications |

### T6: Data Operations (CRUD)

| | |
|---|---|
| **Agent prompt** | "Read the source code. Find a data model. Create a record, read it back, update it, delete it. Try API first, then DB, then UI." |
| **Hard gate artifact** | CRUD response log (HTTP status codes + response bodies) |
| **Hard gate check** | `create_201 && read_200 && update_200 && delete_200 && read_after_delete_404` |
| **Agent measures** | approach (API/DB/UI), turns, data model found, CRUD results |

### T7: UI Validation

| | |
|---|---|
| **Agent prompt** | "Open the running app. Navigate the main pages. Report what renders, what's broken, console errors." |
| **Hard gate artifact** | Playwright screenshots + console log |
| **Hard gate check** | `screenshot_not_blank && console_errors == 0 && title_matches_prompt` |
| **Agent measures** | pages visited, interactive elements found, visual assessment |

**Playwright script (hard gate):**
```javascript
// Minimal automated check — runs AFTER agent confirms app is up
const page = await browser.newPage();
await page.goto(APP_URL);

// 1. Not blank
const screenshot = await page.screenshot();
const isBlank = await isBlankImage(screenshot); // pixel analysis

// 2. Console errors
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) });

// 3. Title/content matches original prompt
const bodyText = await page.textContent('body');
const relevance = await llm_judge(bodyText, original_prompt);
// "Does this page content match what was requested?"

results = { isBlank, consoleErrors: errors, relevanceScore: relevance };
```

### T8: Runability (end-to-end)

| | |
|---|---|
| **Agent prompt** | "You have {N} minutes. Get this project running locally from scratch. Do not modify code unless necessary." |
| **Hard gate artifact** | Running app (HTTP 2xx on expected port) |
| **Hard gate check** | `curl_success && response_time < 5s` |
| **Agent measures** | total turns, total modifications, total time, blockers found |

### T9: Deployability

| | |
|---|---|
| **Agent prompt** | "Deploy this app to a Docker container. It must pass a health check." |
| **Hard gate artifact** | Running container + health endpoint |
| **Hard gate check** | `docker_running && healthcheck_2xx && container_stable_60s` |
| **Agent measures** | turns, Dockerfile modifications, health endpoint found/created |

---

## Hard Gate: Script Agent

Deterministic. No LLM. Runs AFTER agent validator produces artifacts.

```python
class HardGate:
    """Objective verification of agent's work."""
    
    def check_build(self, build_log: str) -> bool:
        """Parse build log, return True if exit 0 and no ERROR lines."""
        
    def check_running(self, port: int, timeout: int = 30) -> bool:
        """curl localhost:port, return True if 2xx within timeout."""
        
    def check_typecheck(self, typecheck_log: str) -> tuple[bool, int]:
        """Parse typecheck output, return (zero_errors, error_count)."""
        
    def check_tests(self, test_report: str) -> tuple[bool, float]:
        """Parse test report, return (above_threshold, pass_rate)."""
        
    def check_db(self, connection_log: str) -> bool:
        """Verify DB connection was established."""
        
    def check_crud(self, crud_log: list[dict]) -> tuple[bool, int]:
        """Verify CRUD operations by HTTP status codes. Return (all_pass, ops_passed)."""
        
    def check_ui(self, screenshot: bytes, console_log: list, prompt: str) -> dict:
        """
        Playwright-based:
        - screenshot not blank (pixel check)
        - console errors == 0
        - content relevance (LLM judge OR keyword match vs prompt)
        """
        
    def check_deploy(self, container_id: str, health_url: str) -> bool:
        """Container running + health 2xx + stable 60s."""
```

### UI Check: Prompt Comparison

For v1.0, UI validation uses a **simple prompt relevance check** — not full visual regression:

```
Option A (fast, no LLM): 
  Extract text from page → keyword overlap with original app prompt
  Score = matching_keywords / total_keywords_in_prompt
  Pass if score > 0.5

Option B (better, uses LLM judge):
  Send {page_text, original_prompt} to cheap LLM:
  "Does this web page implement what was described in the prompt? 
   Answer YES/NO with one-sentence reason."
  
Option C (future, visual):
  Playwright screenshot → vision model → compare with prompt
  "Does this UI look like a {original_prompt}?"
```

**v1.0 recommendation:** Option A for hard gate (fast, deterministic), Option B for agent validator (richer signal). Option C deferred to v2.0.

---

## Scoring

### Per-task score

```
TaskScore(i) = AgentScore(i) × GateScore(i)
```

**AgentScore** (0.0 – 1.0):
```
AgentScore = success × (1 - 0.1 × modifications) × efficiency
efficiency = max(0.1, (budget - turns_used) / budget)
```

**GateScore** (0.0 or 1.0 for binary gates; 0.0 – 1.0 for graduated):
```
GateScore(build)    = 1.0 if exit_code == 0 else 0.0
GateScore(run)      = 1.0 if http_2xx else 0.0
GateScore(types)    = max(0, 1 - error_count / 50)
GateScore(tests)    = pass_rate  (0.0 – 1.0)
GateScore(db)       = 1.0 if connected else 0.0
GateScore(crud)     = ops_passed / 4  (0.0 – 1.0)
GateScore(ui)       = (not_blank × 0.4 + no_errors × 0.3 + relevance × 0.3)
GateScore(run_e2e)  = 1.0 if http_2xx else 0.0
GateScore(deploy)   = 1.0 if health_2xx_and_stable else 0.0
```

**Key property:** `AgentScore × GateScore` means:
- Agent says "it works" but gate fails → score = 0 (can't BS the gate)
- Gate passes but agent used 50 modifications → score penalized (code quality matters)

### ShipScore (composite)

```
ShipScore = 100 × Σ(weight_i × TaskScore_i) × G

Weights:
  T1 build:     0.15
  T2 run:       0.15
  T3 types:     0.10
  T4 tests:     0.10
  T5 db_conn:   0.05
  T6 crud:      0.10
  T7 ui:        0.10
  T8 runability:0.15
  T9 deploy:    0.10
  
G = (0.25 + 0.75 × gate_build) × (0.25 + 0.75 × gate_run)
```

### Tier Comparison Table

For each artifact, we report:

```
| Task    | Expert (Opus) | Mid (Sonnet) | Junior (Haiku) | Hard Gate |
|---------|---------------|--------------|----------------|-----------|
| Build   | ✅ 2 turns    | ✅ 4 turns   | ❌ 8 turns     | ✅ exit 0 |
| Run     | ✅ 3 turns    | ✅ 6 turns   | ✅ 12 turns*   | ✅ 2xx    |
| Types   | ✅ 0 errors   | ✅ 0 errors  | ❌ couldn't find| ❌ 23 err |
| ...     |               |              |                |           |

* = 2 code modifications (penalty applied)
```

**The tier gap tells the story:** 
- Small gap (Expert ≈ Junior) → well-documented, self-explanatory code
- Large gap (Expert ✅, Junior ❌) → works but needs expertise → documentation debt
- All fail → fundamentally broken

---

## Eval Set 1.0: Scope

### What's in v1.0
- [x] 9 agent tasks with prompts
- [x] Hard gate checks: build log, curl, typecheck log, test report, CRUD status codes
- [x] Playwright: screenshot blank check + console errors + prompt keyword match
- [x] 3 agent tiers (Opus / Sonnet / Haiku)
- [x] ShipScore with agent×gate multiplication
- [x] Turn budgets and modification penalties

### What's deferred to v2.0
- [ ] Visual regression (screenshot → vision model comparison)
- [ ] Live agent simulation (multiple developer personas)
- [ ] Multi-stack prompt sets (Python, Java, Go)
- [ ] Automated rollback testing (T9 bonus)
- [ ] Cost-weighted scoring (factor in eval cost per tier)
- [ ] Statistical confidence intervals (need n≥30 per model)

### Minimum Viable Eval Run

```bash
# 1. Generate app from prompt
app = generate(model="sonnet", prompt="Build a churn dashboard")

# 2. Run agent validator (3 tiers × 9 tasks = 27 agent runs)
for tier in [opus, sonnet, haiku]:
    for task in T1..T9:
        result = run_agent(tier, task, app, budget=task.max_turns)

# 3. Run hard gate (deterministic, ~30 seconds)
gate = HardGate()
gate_results = gate.check_all(app, artifacts_from_step_2)

# 4. Compute ShipScore
for tier in [opus, sonnet, haiku]:
    score = ship_score(agent_results[tier], gate_results)
    
# 5. Output
# | Tier   | ShipScore | Build | Run | Types | Tests | DB | CRUD | UI | E2E | Deploy |
# |--------|-----------|-------|-----|-------|-------|----|------|----|-----|--------|
# | Expert | 78.3      | ✅    | ✅  | ✅    | ⚠️80% | ✅ | 3/4  | ✅ | ✅  | ✅     |
# | Mid    | 61.2      | ✅    | ✅  | ❌    | ⚠️80% | ✅ | 2/4  | ✅ | ✅  | ❌     |
# | Junior | 34.7      | ✅    | ✅* | ❌    | ❌    | ❌ | 0/4  | ⚠️ | ❌  | ❌     |
```

**Estimated cost per artifact (full 3-tier eval):**
| Component | Cost |
|-----------|------|
| Expert (Opus) × 9 tasks | ~$2.50 |
| Mid (Sonnet) × 9 tasks | ~$0.50 |
| Junior (Haiku) × 9 tasks | ~$0.05 |
| Hard gate (scripts) | ~$0.00 |
| Playwright | ~$0.00 |
| **Total per artifact** | **~$3.05** |
| **20-app pilot** | **~$61** |
| **100-app full eval** | **~$305** |
