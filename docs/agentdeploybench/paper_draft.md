# Beyond Pass@k: Measuring AI Code Generation Production-Readiness with AgentDeployBench

**Draft — Short Paper (4 pages, ACM sigconf format)**

---

## Abstract

Existing benchmarks for AI code generation measure functional correctness (HumanEval, MBPP) or bug-fixing ability (SWE-bench), yet neither asks the question practitioners care about most: *can AI ship code to production?* We introduce **AgentDeployBench**, a benchmark and composite scoring framework that measures the end-to-end deployability of AI-generated applications. AgentDeployBench defines nine evaluation rubrics spanning build success, runtime stability, type safety, test passage, data connectivity, UI correctness, and two novel *agentic DevX* dimensions—Runability and Deployability—that test whether a downstream AI agent can autonomously run and deploy the generated code. We combine these rubrics into **ShipScore**, a single 0–100 index: `100 × (0.30R + 0.25S + 0.25W + 0.20D) × G`, where R captures reliability, S SQL quality, W web quality, D agentic operability, and G is a soft penalty gate for critical failures. We evaluate six frontier and open-weight models on a 20-application pilot, finding that while 100% achieve build success, only 5% pass type-safety checks and mean Deployability is 2.5/5—revealing a *deployability gap* invisible to existing benchmarks. AgentDeployBench is stack-agnostic and model-agnostic by design; we release the evaluation harness and invite the community to contribute prompt sets across diverse technology stacks.

**Keywords:** benchmark, code generation, deployability, agentic evaluation, production readiness

---

## 1. Introduction

The rapid maturation of large language models (LLMs) for code generation has produced impressive benchmark results. HumanEval [1] leaders now exceed 90% pass@1 on isolated function synthesis; SWE-bench Verified [2] top agents resolve ~72% of curated GitHub issues. Yet a fundamental disconnect persists: *none of these benchmarks measure whether AI-generated code can be deployed to production*.

**The deployability gap.** Consider the lifecycle of a real software artifact. It must compile, start, pass type checks, connect to data sources, render a correct UI, and survive deployment to a containerized environment with health checks and rollback capability. Existing benchmarks stop far short of this bar. HumanEval evaluates single functions against unit tests. SWE-bench evaluates patches against repository test suites. Neither exercises the full deployment pipeline—Dockerfiles, environment configuration, health endpoints, observability hooks—that determines whether code actually ships.

This gap has practical consequences. Industrial teams adopting AI code generation report that generated applications frequently compile but fail in deployment: missing environment variables, broken container configurations, absent health checks, and hardcoded secrets [3]. The community lacks a standard way to measure and compare these failure modes.

**Our contribution.** We propose **AgentDeployBench**, a benchmark framework that evaluates AI-generated applications across the complete path from source code to running deployment. Our contributions are:

1. **A multi-rubric evaluation framework** (§2) comprising seven binary quality checks (L1–L7) and two agentic DevX scores (D8–D9) that measure whether a *separate* AI agent can run and deploy the generated code—a proxy for autonomous operability.

2. **ShipScore** (§2.3), a composite 0–100 index that combines reliability, SQL quality, web quality, and agentic DevX into a single comparable metric, with a soft penalty gate that degrades gracefully on critical failures.

3. **A multi-model empirical evaluation** (§3) on a 20-application pilot revealing a significant deployability gap: models that achieve perfect build/runtime success score poorly on type safety (5%), runability (3.0/5), and deployability (2.5/5).

4. **A vendor-neutral, stack-agnostic design** (§2.4) that enables adoption beyond any single platform or technology stack.

---

## 2. The AgentDeployBench Framework

### 2.1 Evaluation Rubrics

AgentDeployBench defines nine core rubrics organized into three tiers (Table 1).

**Table 1: AgentDeployBench Evaluation Rubrics**

| ID | Rubric | What It Validates | Type |
|----|--------|-------------------|------|
| L1 | Build Success | Project compiles; container build exits 0 | Binary |
| L2 | Runtime Success | App starts and serves content within timeout | Binary |
| L3 | Type Safety | Static type checker reports zero errors | Binary |
| L4 | Tests Pass | Unit/integration test suite passes | Binary |
| L5 | Data Connectivity | Database/API connection established | Binary |
| L6 | Data Operations | CRUD operations return correct results | Binary |
| L7 | UI Validation | Frontend renders without console errors | Binary |
| D8 | Runability | Can a sample AI agent run the app locally? | 0–5 |
| D9 | Deployability | Can a sample AI agent deploy the app? | 0–5 |

**L1–L7: Core quality checks.** These binary rubrics capture the minimum requirements for a working application. L1 and L2 verify that the artifact compiles and starts—necessary but far from sufficient. L3–L4 assess code correctness beyond "it runs." L5–L7 validate integration with external systems and user-facing behavior. Each check is automated and deterministic, ensuring reproducibility across evaluation runs.

**D8–D9: Agentic DevX.** These rubrics introduce a novel evaluation dimension: *can another AI agent operate this code?* This matters because in compound AI systems, one agent's output becomes another agent's input. D8 (Runability) scores 0–5 based on a rubric ranging from "install fails" (0) through "starts cleanly with documented steps" (3) to "healthcheck + smoke test succeeds" (5). D9 (Deployability) ranges from "no/broken Dockerfile" (0) through "healthcheck OK, smoke 2xx" (3) to "automated rollback to prior known-good tag" (5).

The key insight is that these scores capture what humans can work around but agents cannot. A human developer will figure out missing environment variables through trial and error; an agent needs an explicit `.env.example`. A human will guess undocumented ports; an agent needs a health endpoint to verify success. D8 and D9 measure the *agent-friendliness* of generated artifacts.

### 2.2 Supplementary Metrics

Beyond the nine rubrics, AgentDeployBench records four efficiency metrics: tokens consumed (E10), generation time in seconds (E11), agent conversation turns (E12), and lines of code (E13). These are reported but not incorporated into the composite score, enabling cost-effectiveness analysis without conflating quality with efficiency.

### 2.3 ShipScore: A Composite Deployability Index

To enable automatic, comparable measurement across models, prompts, and runs, we define **ShipScore**—a single 0–100 index representing normalized production readiness.

**Step 1 — Reliability Pillar (R).** The geometric mean of core binary checks:

$$R = \text{GM}(b_{\text{build}},\; b_{\text{runtime}},\; b_{\text{type}},\; b_{\text{tests}})$$

The geometric mean ensures that a single critical failure (e.g., build failure) drives R toward zero, reflecting the conjunctive nature of production readiness: *all* core systems must work.

**Step 2 — SQL Quality Pillar (S).** A weighted combination of execution correctness ($S_1$), valid efficiency score ($S_2$, adapted from BIRD [4]), and SQL safety ($S_4$):

$$S = 0.50 \times S_1 + 0.30 \times S_2 + 0.20 \times S_4$$

**Step 3 — Web Quality Pillar (W).** A weighted combination of task completion ($W_1$), visual rendering correctness ($W_2$), interactive element functionality ($W_3$), and accessibility ($W_4$):

$$W = 0.40 \times W_1 + 0.30 \times W_2 + 0.20 \times W_3 + 0.10 \times W_4$$

**Step 4 — Agentic DevX Pillar (D).** The geometric mean of normalized runability and deployability:

$$D = \text{GM}(\hat{x}_{\text{run}},\; \hat{x}_{\text{deploy}}), \quad \hat{x} = \text{score}/5$$

**Step 5 — Soft Penalty Gate (G).** Rather than collapsing the score to zero on critical failures, a multiplicative gate degrades gracefully:

$$G = (0.25 + 0.75 \cdot b_{\text{build}}) \times (0.25 + 0.75 \cdot b_{\text{runtime}}) \times (0.50 + 0.50 \cdot b_{\text{db}})$$

When build succeeds ($b_{\text{build}}=1$), the first factor is 1.0; when it fails, the factor is 0.25—reducing the score by 75% but preserving partial credit for other rubrics.

**Step 6 — Final Composite.**

$$\textbf{ShipScore} = 100 \times (0.30R + 0.25S + 0.25W + 0.20D) \times G$$

**Interpretation.** Scores near 100 indicate near-perfect production readiness across all four pillars. Scores of 50–70 indicate partial operability with specific deficiencies. Scores below 30 indicate fundamental execution issues. The index is smooth: partial progress is measurable, enabling longitudinal tracking as models and tooling improve.

**Weight rationale.** Reliability (30%) is weighted highest because non-functional code cannot be deployed regardless of other qualities. SQL and Web quality (25% each) capture the core value proposition of data-centric applications. Agentic DevX (20%) reflects the growing importance of autonomous operability in compound AI systems.

### 2.4 Design for Generalizability

AgentDeployBench is designed to be **vendor-neutral** and **stack-agnostic**:

- **Rubrics are technology-independent.** "Build success" applies equally to `npm run build`, `cargo build`, or `pip install`. "Type safety" maps to TypeScript's `tsc`, Python's `mypy`, or Rust's compiler. The rubric definitions specify *what* to check, not *how*.

- **Prompt sets are pluggable.** The framework separates the evaluation harness from the prompt corpus. Research groups can contribute prompt sets targeting different stacks (React, Django, Spring Boot), domains (analytics dashboards, CRUD apps, APIs), and difficulty tiers.

- **D8/D9 rubrics generalize across platforms.** The runability and deployability scales measure universal properties: documentation quality, environment configuration, health endpoints, and container correctness. These apply whether the target is AWS, GCP, Azure, or a self-hosted Kubernetes cluster.

- **The ShipScore formula is configurable.** The pillar weights (0.30/0.25/0.25/0.20) and gate thresholds can be adjusted for different evaluation contexts. For API-only applications, the W pillar could be zeroed out and its weight redistributed.

---

## 3. Evaluation

### 3.1 Experimental Setup

We evaluate on a pilot set of 20 application prompts spanning data dashboards, business analytics, and operational tools (e.g., "Build a churn risk dashboard," "Create customer segments using RFM analysis," "Monitor data quality metrics"). Each prompt specifies a realistic application requirement without prescribing implementation details.

Applications were generated using multiple frontier and open-weight models, with generation pipelines providing standard scaffolding (TypeScript + tRPC template) but no evaluation-specific guidance. Generation and evaluation were strictly isolated at the container level to prevent metric gaming [5].

### 3.2 Results

**Table 2: Aggregate Results (n=20 applications)**

| Rubric | Result | Notes |
|--------|--------|-------|
| L1: Build Success | 20/20 (100%) | All apps compile |
| L2: Runtime Success | 20/20 (100%) | All apps start and serve |
| L3: Type Safety | 1/20 (5%) | Critical gap |
| L4: Tests Pass | — | Not yet instrumented |
| L5: DB Connectivity | 18/20 (90%) | 2 connection failures |
| D8: Runability | 3.0/5 avg | Below production threshold (≥4) |
| D9: Deployability | 2.5/5 avg | Below production threshold (≥4) |

**Table 3: Generation Efficiency (n=20 applications)**

| Metric | Value |
|--------|-------|
| Tokens per app | ~16K |
| Generation time | 6–9 min |
| Agent turns | 93 avg |
| Lines of code | 732 avg |
| Cost per app | $0.74 |

**Table 4: Multi-Model Comparison (extended dataset, n=30 per model)**

| Model | Success Rate | Cost/App | Cost/Viable App |
|-------|-------------|----------|-----------------|
| Claude Sonnet 4 | 86.7% | $3.67 | $5.01 |
| Qwen3-Coder-480B | 70.0% | $0.42 | $0.61 |
| GPT OSS 120B | 30.0% | $0.15 | $0.51 |

### 3.3 Key Findings

**Finding 1: The deployability gap is real and significant.** All 20 applications achieve build and runtime success (L1–L2), which would yield 100% on any benchmark that stops at "does it compile and run?" Yet only 5% pass type safety (L3), mean runability is 3.0/5 (below the production threshold of ≥4), and mean deployability is 2.5/5. This gap is invisible to HumanEval-style benchmarks and partially invisible to SWE-bench, which tests patch correctness but not deployment pipeline integrity.

**Finding 2: Build success is necessary but radically insufficient.** The 100% build/runtime pass rate creates a false sense of production readiness. The ShipScore framework reveals that these applications are far from deployable: missing `.env.example` files, absent or incorrect Dockerfiles, no health endpoints, hardcoded configuration, and incomplete documentation make them inoperable by downstream agents or junior developers.

**Finding 3: Open-weight models offer viable cost-performance tradeoffs.** Qwen3-Coder-480B achieves 80.8% of the frontier model's success rate at 8.2× lower cost per viable application ($0.61 vs. $5.01). For applications where deployment requirements are relaxed, this represents a practical engineering tradeoff.

**Finding 4: Type safety is the weakest link.** At 5% pass rate, type safety represents the single largest quality gap. This suggests that current models generate code that is syntactically correct and functionally plausible but structurally unsound—a class of defect that only manifests under static analysis or at scale.

---

## 4. Discussion and Conclusion

### 4.1 Why This Matters

The AI code generation community has converged on benchmarks that optimize for the wrong objective. Pass@k measures whether a model *can* produce correct code among k samples. SWE-bench measures whether a model can fix a known bug. Neither measures whether the resulting artifact can survive the journey from source code to production deployment—the outcome that practitioners actually need.

AgentDeployBench reframes the evaluation question: not "can AI write correct code?" but "can AI ship code?" This shift has implications for model development (optimizing for deployability, not just correctness), tooling development (improving scaffolding, templates, and validation pipelines), and industrial adoption (providing a standard measure of production readiness).

The agentic DevX dimension (D8–D9) is particularly forward-looking. As AI systems become compound—with multiple agents collaborating on code generation, review, testing, and deployment—the ability of one agent's output to be consumed by another becomes a first-class quality attribute. AgentDeployBench is, to our knowledge, the first benchmark to measure this property.

### 4.2 Mapping to DORA Metrics

ShipScore maps naturally to the DORA framework [6] for software delivery performance:

- **Deployment Frequency** ← count of successful D9 events per evaluation cohort
- **Lead Time** ← median time from first model call to successful deployment
- **Change Failure Rate** ← fraction of deployments failing healthcheck within 30 minutes
- **Mean Time to Restore** ← median time from failure detection to restored service

This mapping enables organizations to evaluate AI code generation using the same delivery performance framework they apply to human engineering teams—a prerequisite for enterprise adoption.

### 4.3 Limitations

Our current evaluation has several limitations. The pilot set of 20 prompts, while diverse, is small; we are expanding to 100+ prompts across three difficulty tiers with ±9% confidence intervals at 95% confidence. The D8/D9 scores are currently evaluated via artifact-based proxy checks (presence of `.env.example`, Dockerfile correctness) rather than live agent simulation; we plan to augment these with statistical agent simulation across multiple developer personas. The evaluation is currently validated on a single stack (TypeScript/tRPC); generalization to Python, Java, and other ecosystems requires additional prompt sets and stack-specific rubric implementations. Finally, the S and W pillars are designed but not yet fully instrumented in the current harness.

### 4.4 Future Work

We outline three directions for AgentDeployBench:

1. **Public leaderboard.** We will host a continuously updated leaderboard of ShipScores across models and prompt sets, analogous to the HumanEval and SWE-bench leaderboards but measuring deployability rather than correctness.

2. **Open-source evaluation harness.** We will release the complete evaluation harness—rubric implementations, scoring functions, containerized execution, and result aggregation—as an open-source package that any team can run against their own models and prompt sets.

3. **Community prompt sets.** We invite the research community to contribute prompt sets for additional stacks, domains, and difficulty levels, expanding AgentDeployBench from a single-stack pilot to a comprehensive, multi-ecosystem benchmark.

### 4.5 Conclusion

AgentDeployBench addresses a critical gap in AI code generation evaluation: the absence of production-readiness measurement. By defining nine rubrics spanning build, runtime, correctness, integration, and agentic operability—and composing them into the ShipScore index—we provide a standardized, reproducible way to answer the question that matters most to practitioners: *can AI ship code to production?* Our pilot evaluation reveals a significant deployability gap hidden by existing benchmarks, suggesting that the community's focus on functional correctness has come at the cost of deployment readiness. We hope AgentDeployBench will redirect attention toward the full lifecycle of AI-generated software.

---

## References

[1] M. Chen et al., "Evaluating Large Language Models Trained on Code," *arXiv:2107.03374*, 2021.

[2] C. E. Jimenez et al., "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" *ICLR*, 2024.

[3] [placeholder] Industry reports on AI code generation deployment challenges.

[4] X. Li et al., "Can LLM Already Serve as a Database Interface? A BIg Bench for Large-Scale Database Grounded Text-to-SQL (BIRD)," *NeurIPS*, 2023.

[5] D. Amodei et al., "Concrete Problems in AI Safety," *arXiv:1606.06565*, 2016.

[6] N. Forsgren, J. Humble, and G. Kim, *Accelerate: The Science of Lean Software and DevOps*, IT Revolution, 2018.

[7] S. Zhou et al., "WebArena: A Realistic Web Environment for Building Autonomous Agents," *ICLR*, 2024.

[8] [placeholder] BigCodeBench, LiveCodeBench, and related function-level benchmarks.

[9] [placeholder] SWE-agent and repository-level agent evaluation.

[10] [placeholder] AgentDeployBench evaluation harness release (forthcoming).
