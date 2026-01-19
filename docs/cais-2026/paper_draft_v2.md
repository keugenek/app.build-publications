# Closing the Feedback Loop for Agent Tooling in Data Application Development

**Abstract**

When AI agents fail to build production applications, should we improve the agent or its environment? Our prior work found that environment quality—templates, tools, guidance—matters more than model selection. We present a feedback loop for iterative tooling improvement: (1) an **installable domain knowledge** architecture packages expertise as agent-consumable artifacts; (2) agents use this package to generate applications, producing execution trajectories; (3) an **agentic trajectory analyzer** processes these trajectories to identify friction and recommend fixes to the package; (4) **Agentic DevX metrics** serve as the final quality gate, measuring whether generated applications can be operated by other agents. We believe this approach generalizes across domains; we validate it on Databricks data applications across multiple agent backends (Claude Agent SDK, Cursor, Codex, LiteLLM with open-source models). On 20 applications, we achieve 90% one-shot build success at $0.74/app. The trajectory analyzer identified concrete improvements—batch operations, clearer tool descriptions, missing examples—that we implemented, demonstrating the feedback loop in action. The architecture is designed for automatic optimization: the analyzer's recommendations target tool descriptions, prompts, and examples—artifacts amenable to techniques like GEPA or DSPy-style prompt tuning, potentially closing the loop without human intervention.

---

## 1. Introduction

AI agents can generate functional software, but they lack domain-specific knowledge required for production applications. The conventional response is building better agents. We take a different approach: improve what agents have access to.

This approach emerged from our prior work [SANER'26 preprint]: when comparing agent performance across environments while holding the model constant, we found that environment quality (templates, tools, guidance) had larger effects than model upgrades. An agent with excellent tooling outperforms a better model with poor tooling.

Accepting that tooling matters raises a question: how do we improve it systematically? Manual inspection doesn't scale. End-state metrics (build pass/fail) don't reveal causes. We need a feedback loop that:

1. Captures how agents actually use tooling (trajectories)
2. Identifies friction points and root causes (analysis)
3. Produces actionable recommendations (fixes)
4. Verifies improvements against agent-centric criteria (evaluation)

```
┌─────────────────────────────────────────────────────────────┐
│            Iterative Tooling Improvement Loop               │
│                                                             │
│  ┌──────────────┐    agents    ┌──────────────┐            │
│  │   Domain     │────use─────►│  Generated   │            │
│  │   Package    │              │    Apps      │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         ▲                             │                     │
│         │                        produces                   │
│     improves                          │                     │
│         │                             ▼                     │
│  ┌──────┴───────┐              ┌──────────────┐            │
│  │  Trajectory  │◄─────────────│ Trajectories │            │
│  │  Analyzer    │   friction   │  (+ evals)   │            │
│  └──────────────┘   signals    └──────────────┘            │
│                                                             │
│                    ┌──────────────┐                        │
│                    │  Agentic     │                        │
│                    │  DevX Evals  │◄── final quality gate  │
│                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘

**Figure 1: The feedback loop. Trajectories feed the analyzer, which
improves the package. Agentic DevX evals verify the final output.**
```

We instantiate each component:

1. **Installable Domain Knowledge** (Section 2). An architecture for packaging domain expertise as agent-consumable artifacts. We validate on Databricks, exposing tools via CLI commands—applicable to emerging standards like Agent Skills (agentskills.io).

2. **Agentic Trajectory Analyzer** (Section 3). A two-phase system: parallel friction extraction with a cheap model followed by agentic synthesis with a reasoning model that has source code access. The analyzer consumes trajectories and optionally evaluation results.

3. **Agentic DevX Metrics** (Section 4). The final quality gate: Runability (0-5) and Deployability (0-5) measure whether another agent—not a human—can operate generated applications. This is a novel evaluation dimension absent from existing benchmarks.

**Validation.** We validate across Claude Agent SDK (primary), Cursor, Codex (manual), and LiteLLM with open-source models. On 20 Databricks applications: 90% build success, 90% database connectivity, $0.74/app, 6-9 minute latency. The trajectory analyzer identified improvements that we implemented and verified through multiple iterations.

---

## 2. Installable Domain Knowledge

### 2.1 Motivation

Developers already use capable agents—Claude Code, Cursor, Codex. Rather than asking them to adopt yet another tool, we bring domain knowledge to the agents they already use. A user installs our package into their existing environment; the agent gains domain expertise without workflow changes.

This approach has a practical advantage: we leverage the ecosystem of existing agents rather than competing with them. The alternative—building a custom agent per domain—doesn't scale and creates vendor lock-in.

### 2.2 Architecture

The package has three components: context layers that inject domain knowledge progressively, tools exposed via CLI, and a state machine that enforces validation before deployment.

```
┌─────────────────────────────────────────────────────────────────┐
│                  Installable Domain Package                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Context Layers (injected progressively)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ L0: Tools    │ Tool names/descriptions    │ Always         │ │
│  │ L1: Workflow │ Patterns, CLI usage        │ On discovery   │ │
│  │ L2: Target   │ App vs job constraints     │ When detected  │ │
│  │ L3: Template │ SDK patterns, examples     │ After scaffold │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Tools (exposed via CLI)                                         │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │  Lifecycle   │ │    Data      │                              │
│  │  scaffold    │ │  exploration │                              │
│  │  validate    │ │  + batching  │                              │
│  │  deploy      │ │  + examples  │                              │
│  └──────────────┘ └──────────────┘                              │
│                                                                  │
│  State Machine                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Scaffolded ──► Modified ──► Validated ──► Deployed       │  │
│  │     │              ▲          │(checksum)                │  │
│  │     └──────────────┴──────────┘                          │  │
│  │         (edit invalidates)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

**Figure 2: Domain package architecture. Context layers avoid overload;
state machine enforces validation before deployment.**
```

### 2.3 Context Layers

Agents have limited context windows. Dumping all domain knowledge upfront wastes tokens and can confuse the model. Instead, we inject context progressively—each layer activates when relevant.

| Layer | Content | When Injected |
|-------|---------|---------------|
| L0: Tools | Tool names and descriptions | Always (protocol-level) |
| L1: Workflow | Universal patterns, CLI usage, validation rules | On first discovery call |
| L2: Target | Target-specific constraints (apps vs jobs vs pipelines) | When target type detected |
| L3: Template | Language/SDK-specific patterns (charts, tRPC, types) | After scaffolding or from CLAUDE.md |

For example, an agent scaffolding a new app receives L0-L2 initially. Only after scaffolding completes does L3 activate—providing SDK-specific patterns like "how to draw charts with Recharts" or "tRPC router conventions". For existing projects, the agent reads CLAUDE.md (placed in the project root) to acquire L3 context.

### 2.4 Tools

We expose domain functionality through CLI commands—a pattern that Cloudflare ("Code Mode") [1] and Anthropic [2] found effective, reporting that LLMs perform better writing code to call tools than calling tools directly.

**Lifecycle commands:** scaffold (creates project from template with CLAUDE.md guidance), validate (builds in Docker, captures Playwright screenshot), deploy (to target platform).

**Data exploration:** Commands for discovering available data, with agent-friendly additions: batch operations that bundle multiple queries, clearer error messages, and syntax examples for platform-specific SQL variations.

Workspace tools (read/write/edit, grep, glob, bash) are not our contribution—agents already have these. Our package adds domain-specific capabilities on top.

### 2.5 State Machine

Applications cannot deploy unless they pass validation after their most recent modification:

```
Scaffolded → [edit] → Modified → [validate] → Validated(checksum) → [deploy] → Deployed
                ↑                                    |
                └────────── [edit] ─────────────────┘
```

The checksum captures state at validation time. Any change after validation requires re-validation. This prevents untested code deployment—a common failure mode when agents skip validation.

### 2.6 Agent Compatibility

To validate agent-agnosticism, we tested the package across multiple backends. The key requirement is function calling capability—any agent that can invoke tools works with our package.

| Backend | Validation | Notes |
|---------|------------|-------|
| Claude Agent SDK | Automated | Primary production use |
| Cursor | Manual | IDE integration |
| Codex | Manual | Alternative agent |
| LiteLLM + [PLACEHOLDER] | Automated | Open-source models |

The LiteLLM backend demonstrates that the approach isn't tied to specific vendors—we wrap any model with function calling into our generation pipeline.

---

## 3. Agentic Trajectory Analyzer

### 3.1 Role in the Feedback Loop

To run trajectory analysis at scale, we built infrastructure for bulk app generation that saves execution traces in a structured format. In production, users work with their own agents (Cursor, Claude Code) which may not save trajectories in our format—but the analyzer works with any trace data that captures tool calls and results.

The analyzer consumes trajectories and recommends package improvements. This closes the loop: agents struggle → we see it in trajectories → we fix the tooling → agents struggle less.

### 3.2 Why Trajectories, Not Just Outcomes

End-state metrics (build success, test pass) don't reveal causes:

- Model limitations (reasoning, instruction following)?
- Tool problems (unclear descriptions, missing functionality)?
- Template issues (incorrect scaffolding, missing guidance)?
- Prompt issues (underspecified requirements, contradicting constraints accumulated during project evolution)?

Trajectories—the sequence of reasoning, tool calls, and results—show where things went wrong. An agent retrying the same malformed SQL five times reveals a missing example. An agent calling N tools for N tables reveals a missing batch operation.

### 3.3 Two-Phase Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Trajectory Analyzer Pipeline                     │
└─────────────────────────────────────────────────────────────────────┘

     Trajectories                 Map Phase
    ┌──────────┐              (cheap model)
    │ App 1    │─────┐      ┌─────────────────┐
    │ trace    │     │      │ Extract:        │
    └──────────┘     ├─────►│ - Errors/retries│───┐
    ┌──────────┐     │      │ - Confusion     │   │
    │ App 2    │─────┤      │ - Inefficiency  │   │
    │ trace    │     │      └─────────────────┘   │
    └──────────┘     │              ▲             │
         ⋮          │              │             │
    ┌──────────┐     │         (parallel)        │
    │ App N    │─────┘                           │
    │ trace    │                                 ▼
    └──────────┘                      ┌─────────────────────┐
                                      │ Aggregated Friction │
                                      │ Patterns            │
                                      └──────────┬──────────┘
                                                 │
                      ┌──────────────────────────┼────────────────────┐
                      │        Agentic Synthesis Phase                │
                      │         (reasoning model)                     │
                      │  ┌─────────────────────────────────────────┐  │
                      │  │  Agent with Read/Glob/Grep access to:   │  │
                      │  │                                         │  │
                      │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
                      │  │  │Template │ │  Tool   │ │  Eval   │   │  │
                      │  │  │ Source  │ │  Defs   │ │ Metrics │   │  │
                      │  │  └─────────┘ └─────────┘ └─────────┘   │  │
                      │  │                                         │  │
                      │  │  Up to 50 turns of exploration          │  │
                      │  │  Progressive context discovery          │  │
                      │  └─────────────────────────────────────────┘  │
                      └──────────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────┐
                              │ Recommendations:             │
                              │ - Add discover_schema batch  │
                              │   tool for multi-table query │
                              │ - Add QUALIFY syntax example │
                              │   to SQL guidance            │
                              │ - Rename list_tables to      │
                              │   find_tables                │
                              └──────────────────────────────┘

**Figure 3: Two-phase trajectory analyzer. The synthesis phase is itself
agentic—it explores source code to find root causes.**
```

**Map phase.** Each trajectory is processed independently by a cheap model (we use Claude Haiku, ~$0.001/trajectory), extracting errors, retries, confusion patterns, and inefficient tool usage. This runs in parallel.

**Agentic synthesis phase.** Aggregated patterns go to a reasoning model (we use Claude Opus) with read-only access to:
- Template and CLI tools source code (via Read/Glob/Grep)
- Tool definitions (extracted from MCP server)
- Evaluation metrics (per-app scores, optional)

This is a full agent with up to 50 turns of exploration. If trajectories show SQL confusion, the agent greps templates for SQL examples. If tool descriptions seem unclear, it reads implementations. Context is discovered progressively as patterns demand.

**Extensibility.** The architecture naturally extends to new context sources. We started with trajectories only, then added template source code access, then tool definitions extracted via the MCP binary. Adding new sources (e.g., user feedback, production logs) requires only pointing the synthesis agent at additional files.

### 3.4 Concrete Improvements

The analyzer identified issues leading to fixes we implemented:

| Pattern Observed | Diagnosis | Fix Applied |
|-----------------|-----------|-------------|
| N separate calls for N tables | Missing batch operation | Added `discover_schema` batch command |
| Agents expecting list, got search | Confusing tool name | Renamed `list_tables` → `find_tables` |
| Repeated SQL syntax errors | Missing examples | Added QUALIFY, PIVOT syntax to guidance |
| Retries on malformed errors | Unclear error messages | Added contextual parameter messages |

These aren't hypothetical—they're actual fixes derived from trajectory analysis and committed to the codebase.

### 3.5 Cost Model

For N trajectories:
- Map: N × ~$0.001 (cheap model)
- Synthesis: 1 × ~$0.5-3 (reasoning model, bounded at 50 turns)

Total scales linearly but remains bounded. For 20 apps, analysis cost was under $15.

### 3.6 Future Direction

Our current approach is semi-automatic: the analyzer outputs recommendations, but a human reviews them and decides which to implement. This keeps a human in the loop for changes to production tooling. Recent work on reflective prompt evolution (GEPA) shows prompts can be automatically optimized through self-reflection. Similar techniques could close this gap—automatically applying fixes, measuring improvement, and iterating without human intervention.

---

## 4. Agentic DevX Metrics

### 4.1 Role in the Feedback Loop

Agentic DevX is the final quality gate. After the package is improved and agents generate applications, we need to verify: can another agent actually operate this output?

This is distinct from the trajectory analyzer's role. The analyzer improves the package based on how agents behave during generation. DevX metrics evaluate the result—whether generated applications meet agent-operability criteria.

### 4.2 Motivation

Consider an agent that generates a working application. A human developer can run it: they'll figure out missing environment variables, install unlisted dependencies, work around unclear documentation. An agent cannot. It needs explicit `.env.example` files, documented commands, health endpoints for verification.

Existing metrics miss this distinction. Build success (binary) doesn't capture whether the build process is agent-friendly. We need metrics that ask: **can another agent operate this?**

### 4.3 Runability (0-5)

Measures whether a sample AI agent can run the application locally:

| Score | Criteria |
|-------|----------|
| 0 | Install or start fails; missing scripts or environment |
| 1 | Installs but start fails; not solvable via README |
| 2 | Starts with manual tweaks (undocumented env vars) |
| 3 | Starts cleanly with .env.example + documented steps |
| 4 | Starts with seeds/migrations via scripts |
| 5 | + healthcheck endpoint + smoke test succeeds |

### 4.4 Deployability (0-5)

Measures whether a sample AI agent can deploy the application:

| Score | Criteria |
|-------|----------|
| 0 | No Dockerfile or broken Dockerfile |
| 1 | Image builds; container fails to start |
| 2 | Starts; healthcheck fails or ports undefined |
| 3 | Healthcheck OK; smoke returns 2xx |
| 4 | + logs/metrics hooks present |
| 5 | + automated rollback to prior known-good tag |

### 4.5 Why This Matters

These metrics encode what agents need but humans can work around:

- **Explicit environment**: `.env.example` with all required variables
- **Documented commands**: exact `npm install && npm start` in README
- **Verification endpoints**: `/health` that returns 200 when ready
- **Deployment configuration**: working Dockerfile, port exposure, healthcheck

Human developers tolerate ambiguity; agents fail on it. Agentic DevX measures the gap.

### 4.6 Integration with Other Metrics

Agentic DevX doesn't replace traditional metrics—it complements them. We embed it within a 9-metric framework that covers correctness (does it build?), functionality (does it connect to the database?), and operability (can another agent run it?).

```
┌─────────────────────────────────────────────────────────────┐
│                    AppEval Framework                         │
├─────────────────────────────────────────────────────────────┤
│  Core Functionality (Binary)                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │L1 Build │ │L2 Run   │ │L3 Types │ │L4 Tests │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Platform Integration (Binary)                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │L5 DB    │ │L6 Data  │ │L7 UI    │                       │
│  │Connect  │ │Returned │ │Renders  │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
├─────────────────────────────────────────────────────────────┤
│  Agentic DevX (0-5 Score) ← NOVEL                           │
│  ┌───────────────┐ ┌───────────────┐                       │
│  │ D8 Runability │ │D9 Deployabil. │                       │
│  │     0-5       │ │     0-5       │                       │
│  └───────────────┘ └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘

**Figure 4: AppEval 9-metric framework. Agentic DevX (bottom) is the
novel contribution measuring agent-operability.**
```

L1-L4 are standard software quality checks. L5-L7 verify platform integration. D8-D9 (Agentic DevX) ask the question existing frameworks miss: is this output usable in an agentic pipeline?

### 4.7 DORA Alignment

To ground our metrics in industry practice, we map to DORA (DevOps Research and Assessment) delivery metrics—the standard for measuring software delivery performance.

| DORA Metric | AppEval Mapping |
|-------------|-----------------|
| Deployment Frequency | Successful D9 events per evaluation |
| Lead Time | Time from prompt to successful deployment |
| Change Failure Rate | Fraction of deployments failing healthcheck |
| MTTR | Time from failure to restored deployment |

This mapping lets teams familiar with DORA interpret our results in their existing framework.

---

## 5. Results

### 5.1 Generation Performance

We evaluated on 20 Databricks applications spanning dashboards, analytics tools, and business intelligence interfaces. Each app was generated from a natural language prompt describing the desired functionality.

| Metric | Result | Notes |
|--------|--------|-------|
| Build Success (L1) | 18/20 (90%) | |
| Runtime Success (L2) | 18/20 (90%) | |
| Type Safety (L3) | 1/20 (5%) | Primary gap identified |
| DB Connectivity (L5) | 18/20 (90%) | |
| Runability (D8) | 3.0/5 avg | |
| Deployability (D9) | 2.5/5 avg | |

The 90% build/runtime success indicates the core generation pipeline works. The 5% type safety rate is the primary gap—trajectory analysis traced this to TypeScript strict mode violations, particularly null handling (see 5.3).

### 5.2 Efficiency

Generation is practical for real use: under 10 minutes and under $1 per application.

| Metric | Value |
|--------|-------|
| Generation Time | 6-9 minutes |
| Cost per App | $0.74 |
| Agent Turns | 93 avg |
| Lines of Code | 732 avg |

Cost is dominated by the reasoning model (Claude Sonnet in our case). The 93 turns include data exploration, scaffolding, iterative code generation, and validation.

### 5.3 Feedback Loop in Action

The trajectory analyzer identified type safety as the primary gap (5% pass rate). Root cause from trajectory analysis: TypeScript strict mode violations, particularly null handling in generated code.

This demonstrates the feedback loop:
1. Agents used the package → generated apps with type errors
2. Trajectories showed repeated tsc failures and confusion about null checks
3. Analyzer recommended: add explicit null handling examples to CLAUDE.md guidance
4. Fix implemented → next iteration showed improvement

---

## 6. Related Work

**Environment matters more than model.** Our prior work [SANER'26 Industrial Track, preprint] compared agent performance across different environments. Template quality, tool descriptions, and embedded guidance had larger effects than model upgrades. This motivates our focus on improving tooling rather than agents.

**Evaluation gap.** Existing benchmarks evaluate code correctness (HumanEval, SWE-bench), task completion (WebArena, GAIA), or SQL quality (BIRD, Spider). None ask whether generated code can be operated by other agents—a critical question for compound AI systems where one agent's output becomes another's input.

**Agent tool protocols.** The Model Context Protocol (MCP) standardizes agent-tool interaction. Cloudflare ("Code Mode") [1] and Anthropic [2] report that LLMs perform better writing code to call tools than calling tools directly. We adopt this pattern.

**Trajectory analysis.** Analyzing agent execution traces for debugging is established practice. Our contribution is making the synthesis phase itself agentic—an agent that explores source code to generate recommendations, rather than static aggregation.

---

## 7. Discussion and Limitations

**Platform specificity.** We validate on Databricks; the architecture generalizes but requires platform-specific implementation work.

**Dataset size.** Twenty applications provide initial validation; scaling to 100+ planned.

**Type safety gap.** 5% pass rate indicates template/guidance issues. The trajectory analyzer identified the cause; fixes are being validated through subsequent loop iterations.

**Agentic DevX validation.** Current scores are proxy measurements; future work should validate with actual agent operation trials.

**Loop maturity.** We run the feedback loop continuously; reported results reflect multiple iterations. Longer-term longitudinal study would strengthen confidence in the approach.

---

## 8. Conclusion

We presented a feedback loop for iterative improvement of agent tooling:

1. **Installable domain knowledge** packages expertise as agent-consumable artifacts
2. Agents use the package, producing **trajectories**
3. **Agentic trajectory analyzer** identifies friction and recommends fixes
4. **Agentic DevX metrics** verify the final output is agent-operable

When agents fail, improve their environment rather than the agents themselves. Our system operationalizes this insight with a closed loop—trajectories reveal friction, analysis produces fixes, evaluation verifies improvement.

**Open source.** Domain package, trajectory analyzer, and evaluation harness available at: [URL redacted for review]

---

## References

[1] Cloudflare. Code Mode: Converting MCP tools to TypeScript APIs. Blog post, 2025.

[2] Anthropic. Code Execution with MCP. Engineering blog, 2025.

[SANER'26] [Authors]. Environment Matters: [Title]. SANER 2026 Industrial Track. Preprint: [URL]

[GEPA] Reflective Prompt Evolution Can Outperform Reinforcement Learning. [Citation TBD]

[Additional: MCP, DORA, SWE-bench, WebArena, BIRD, Spider]
