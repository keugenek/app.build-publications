# AgentDeployBench v2 — Fully Agent-Driven Evaluation

## Core Reframe

**v1:** Scripted binary checks (L1-L7) + 2 agentic scores (D8-D9)
**v2:** ALL checks are agent-driven tasks. One agent, one artifact, time budget.

### Setup

```
Input:
  - Generated code artifact (zip/repo)
  - Task description (one sentence per check)
  - Turn budget: N turns max
  - Rule: "Do NOT modify source code. If you must, each modification is penalized."

Output (per task):
  - success: bool
  - turns_used: int
  - modifications: list[{file, diff, reason}]
  - errors_encountered: list[{type, message, turn}]
  - agent_verified: bool  (did agent confirm result with own eyes?)
```

---

## 9 Agent Tasks

### T1: Build
```
Prompt: "Read the project docs/README. Build the project. Report success or failure."
```
**Agent does:** reads README → finds build command → runs it → reports
**We measure:**
| Metric | What |
|--------|------|
| success | Build exits 0? |
| turns | How many attempts to figure out build |
| modifications | Did agent have to fix package.json, add deps, etc? |
| errors | What errors did agent encounter? |

**Scoring:** `T1 = success × (1 - 0.1 × modifications) × (budget - turns) / budget`

---

### T2: Run
```
Prompt: "Start the application. Verify it serves content. Report the URL."
```
**Agent does:** reads docs → sets up env vars → starts app → hits localhost → confirms response
**We measure:**
| Metric | What |
|--------|------|
| success | App responds on expected port? |
| turns | How many attempts (missing .env, wrong port, etc) |
| modifications | Did agent have to create .env, fix config? |
| agent_verified | Did agent actually curl/fetch the URL and see content? |

**Key insight:** If agent has to CREATE .env from scratch (no .env.example), that's a documentation failure of the generated code — we count it but don't penalize the agent.

---

### T3: Type Safety
```
Prompt: "Find and run the type checker for this project. Report the number of type errors."
```
**Agent does:** inspects package.json/pyproject.toml → finds tsc/mypy/etc → runs it → counts errors
**We measure:**
| Metric | What |
|--------|------|
| success | 0 type errors? |
| error_count | Number of type errors found |
| turns | Did agent figure out which checker to use? |
| agent_verified | Did agent actually read the output? |

**Scoring:** `T3 = max(0, 1 - error_count / 50)` (degrades linearly, 50+ errors = 0)

---

### T4: Tests
```
Prompt: "Discover and run the test suite. Report pass/fail and coverage if available."
```
**Agent does:** finds test command → runs → parses results
**We measure:** success, test count, pass rate, turns to discover tests

---

### T5: Data Connectivity
```
Prompt: "The app should connect to a database. Verify the connection works. Report the DB type and connection status."
```
**Agent does:** reads code → finds DB config → checks if connection is established → may need to start DB container
**We measure:** success, turns, modifications (did agent have to fix connection string?)

---

### T6: Data Operations (CRUD) ⭐ NEW APPROACH
```
Prompt: "Read the source code. Find an example data entity/model. 
Create a record, read it back, update it, delete it. 
Report success for each operation."
```

**Agent does:**
1. Reads source code (models/, schema/, etc.)
2. Identifies a data entity (e.g. `User`, `Product`, `Order`)
3. Extracts field names and types from code
4. Crafts CRUD requests against the running app

**Option A — Via API (if app is running):**
```
Agent: "I see a User model with {name, email, role}. Let me try..."
→ POST /api/users {name: "Test", email: "test@test.com", role: "admin"}
→ GET /api/users/1  (verify data matches)
→ PUT /api/users/1 {name: "Updated"}
→ DELETE /api/users/1
→ GET /api/users/1 (verify 404)
```

**Option B — Via DB directly (if no API):**
```
Agent: "I see a Prisma schema with User model. Let me connect to the DB..."
→ INSERT INTO users (name, email) VALUES ('Test', 'test@test.com')
→ SELECT * FROM users WHERE email = 'test@test.com'
→ UPDATE users SET name = 'Updated' WHERE id = 1
→ DELETE FROM users WHERE id = 1
```

**Option C — Via deployed app UI (browser agent):**
```
Agent: "I see a form at /users/new. Let me fill it..."
→ Navigate to /users/new
→ Fill form, submit
→ Verify new record appears in list
→ Click edit, modify, save
→ Click delete, confirm gone
```

**We measure:**
| Metric | What |
|--------|------|
| crud_score | C/R/U/D each 0 or 1, total 0-4 |
| approach | API / DB / UI (records agent's strategy) |
| turns | How many attempts |
| agent_verified | Did agent confirm data actually changed? |
| data_realistic | Did agent use realistic test data (not "asdf")? |

---

### T7: UI Validation
```
Prompt: "Open the running app in a browser. Navigate the main pages. 
Report: does it render? Are there console errors? Can you interact with elements?"
```

**Agent does (browser agent):**
1. Opens app URL
2. Takes screenshot / reads DOM
3. Checks for JS console errors
4. Clicks main navigation elements
5. Reports what works and what doesn't

**We measure:** render_success, console_errors, interactive_elements_working, turns

---

### T8: Runability (end-to-end)
```
Prompt: "You have N minutes. Clone this repo. Get it running locally. 
Verify you can use it. Do NOT modify code unless absolutely necessary."
```

**This is T1+T2+T5 combined as a single timed run.** The score is holistic:
- Did agent get it running? (Y/N)
- How long / how many turns?
- How many code modifications needed?
- How much documentation was missing?

**Scoring:** `T8 = success × time_factor × (1 - 0.15 × modifications)`

---

### T9: Deployability
```
Prompt: "Deploy this app to a container. It must pass a health check. 
Verify it's accessible. Bonus: set up rollback capability."
```

**Agent does:**
1. Reads Dockerfile (or creates one if missing — penalty)
2. Builds container
3. Runs container with correct env
4. Hits health endpoint
5. (Bonus) Tags image, tests rollback

**We measure:** deploy_success, healthcheck_pass, turns, modifications (to Dockerfile/compose), rollback_capable

---

## Composite Score: ShipScore v2

### Per-task score formula

```
TaskScore(i) = success(i) × confidence(i) × mod_penalty(i) × efficiency(i)

where:
  success(i)    = 1.0 if passed, 0.0 if failed
  confidence(i) = 1.0 if agent_verified, 0.8 if not
  mod_penalty(i)= max(0, 1.0 - 0.15 × num_modifications)
  efficiency(i) = (budget - turns_used) / budget  (0.1 floor)
```

### ShipScore v2

```
ShipScore = 100 × (
    0.20 × TaskScore(T1_build) +
    0.15 × TaskScore(T2_run) +
    0.10 × TaskScore(T3_types) +
    0.10 × TaskScore(T4_tests) +
    0.05 × TaskScore(T5_db_conn) +
    0.10 × TaskScore(T6_crud) +
    0.10 × TaskScore(T7_ui) +
    0.10 × TaskScore(T8_runability) +
    0.10 × TaskScore(T9_deploy)
) × G

G = soft gate (same as v1)
```

### What's new vs v1:
- **modification_count** — core new metric. Counts code changes agent made. Penalty per change.
- **turns_used** — measures documentation quality and code clarity
- **agent_verified** — did agent actually confirm with own senses? (not just "I assume it worked")
- **approach** (T6) — records HOW agent tested data (API vs DB vs UI)
- **All rubrics are now agent tasks** — reproducible by running the same agent model

### Why this is better than scripted checks:
1. **Measures real-world deployability** — can an agent (or junior dev) actually use this code?
2. **modifications = documentation quality proxy** — well-documented code needs 0 modifications
3. **turns = cognitive load proxy** — easy-to-deploy code needs fewer turns
4. **agent_verified = observability proxy** — if agent can't verify, humans can't either
5. **Stack-agnostic by nature** — agent figures out the stack, not the benchmark

### Why this is better than human evaluation:
1. **Reproducible** — same agent model = same results (with temperature=0)
2. **Scalable** — run 1000 evaluations overnight
3. **Cheap** — ~$0.50 per full evaluation (9 tasks × ~$0.05 each)
4. **No human bias** — agent doesn't "know" the framework or have muscle memory

---

## Data Operations: 3 Approaches Compared

| Approach | When | Pros | Cons |
|----------|------|------|------|
| **API** | App has REST/GraphQL endpoints | Realistic, tests full stack | Needs running app + API discovery |
| **DB Direct** | App uses ORM with visible schema | Fast, precise | Skips app logic layer |
| **Browser/UI** | App has forms/UI | Most realistic end-to-end | Slowest, needs browser agent, brittle |

**Recommendation:** Agent tries API first (most common), falls back to DB, falls back to UI. The approach itself is recorded as metadata — it tells us about the app's API quality.

**Prompt for T6 (refined):**
```
Read the source code of this application. Identify the main data models.
Pick one model and perform full CRUD:
1. Create a new record with realistic test data
2. Read it back and verify the data matches
3. Update one field and verify the change
4. Delete the record and verify it's gone

Try via the app's API first. If no API is available, try direct DB access.
If neither works, try via the UI.
Report which approach you used and the result of each operation.
```

---

## Turn Budget Guidelines

| Task | Suggested Budget | Rationale |
|------|-----------------|-----------|
| T1 Build | 10 turns | Well-documented = 2-3 turns |
| T2 Run | 15 turns | May need env setup |
| T3 Types | 5 turns | Find checker + run |
| T4 Tests | 5 turns | Find + run |
| T5 DB Conn | 10 turns | May need to start DB |
| T6 CRUD | 20 turns | Discovery + 4 operations |
| T7 UI | 15 turns | Navigate + interact |
| T8 Runability | 30 turns | Full end-to-end |
| T9 Deploy | 25 turns | Docker + health |

**Total: ~135 turns max per evaluation**
**Estimated cost: ~$0.30-0.80 per full eval** (depending on agent model)
