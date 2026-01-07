Databricks Apps 2.0 Codegen - Evaluation Framework (Agentic DevX + DORA)
Version: Working Spec v1.0 (Oct 29, 2025) 
Authors: Evgenii Kniazev Arseni Kravchenko Igor Rekun
Executive Summary
Objective. Define a clear, reproducible, and minimally biased way to determine whether AI-generated code for Databricks Apps can reach production with little to no human intervention. 

Core principle: if an AI agent cannot autonomously run and deploy what it generated, that artifact is not production-ready.

What we built. A multi-rubric validation pipeline plus two agentic developer-experience metrics - Runability and Deployability - that test whether a lightweight agent can run, test, and deploy the codebase from generic instructions.

These metrics map directly to DORA (Deployment Frequency, Lead Time, Change Failure Rate, MTTR) to discuss delivery performance in industry-standard terms.

What's measured today:
Generic web app baseline (App.build Evals 1.0, manual rubric): 73% viability across ~30 tasks; best-case time-to-deploy 30-60 minutes.
Current (Evals 2.0, 20 simple apps on TS+tRPC template): Build/runtime: 20/20, Runability: 3.0/5, Deployability: 2.5/5, Type-safety pass: 1/20, average ~732 LOC, dashboard "avg build step" 2.7s. This is a simple set yet - not production claims.
1) Goals
Evaluations required to be able to test changes in codegen used for app generation, its infrastructure, assess new codegen algorithms, assess impact of Databricks SDK improvements on agent performance, monitor regressions.

Evals 2.0 are better because of:

Speed: Objective evaluation in minutes, not hours
Scale: Consistent evaluation across 100-300+ generated apps
Quality: Prioritizes deployability evidence over subjective style
Cost: Automates checks and rollbacks to reduce manual review
Viability Assessment: Better assessment of prompt to features correspondence  
2) Scope & Definitions
Unit of evaluation: one prompt→app attempt on the reference stack (initially TypeScript + tRPC + custom Databricks integration + codegen MCP)
Viability (Evals 1.0 baseline): human-audited "complete & ready to deploy"; used only as a baseline for improvement
Core rubrics - core metrics that provide Databricks Apps objective qualities
DevX rubrics - advanced rubrics that assess “agent-friendliness” of generated apps - if an average agent can run, test, deploy generated applications automatically 
Runability (0-5): ability of a sample AI agent to run the app using only README + .env file
Deployability (0-5): ability for a sample AI agent to build, pass healthcheck, and smoke-verify first response

Out-of-scope (for now): complex multi-service topologies, bespoke UX polish, and long-running workflows; staged later via Advanced/Hard cohorts.
3) Evaluation Rubrics
ID
Check
What it validates
Result
L1
Build Success
Project compiles
Binary
L2
Runtime Success
App starts & serves content
Binary
L3
Type Safety
No type errors
Binary
L4
Tests Pass
Unit/integration pass
Binary
L5
DB Connectivity
Databricks connection works
Binary
L6
Data Operations
CRUD operations correct (TODO: expand)
Binary
L7
UI Validation
Frontend renders w/o errors
Binary
D8
Runability (agentic)
Can a sample AI agent run generated apps locally?
0-5
D9
Deployability (agentic)
Can a sample AI agent deploy a generated app?
0-5
E10
Tokens used
Number of tokens used to generate application
Num
E11
Generation time
Time spent to generate application, s
Num
E12
Agent turns
Number of turns agent took to generate application
Num
E13
LOC
Lines of code of generated application
Num



Additional sub-checks:
Change prompts - from each of the generated applications that are successful, execute change request prompts and measure as Change Request Evaluation (report same metrics as main rubric) 
Issue fix rubric - from a set of applications with embedded failures, generate fixed application  and measure as Change Request Evaluation (report same metrics as main rubric)
SQL validation: TBD (start with lint, EXPLAIN, forbid destructive ops, column existence, result-shape sanity)
UI validation: TBD (start with route discovery, basic screenshots, DOM error scan, simple accessibility smoke)
Viability: how the application features corresponds to initial prompt requirements 

4) AppEval-100 Composite Score
To enable automatic, comparable measurement of end-to-end application generation quality across prompts and runs, we introduce a single numeric index - AppEval-100 - representing normalized readiness and agentic operability on a 0-100 scale.
Unlike the binary viability flag in § 3, this formulation is smooth: each metric contributes continuously, ensuring partial progress is measurable and comparable across prompts of varying complexity.
Definition
Let each evaluation produce:
Implemented in AppEval-100?
Symbol
Metric
Range
Source (current implementation)
yes
𝑏₍build₎
Build success
{0, 1}
build_success
yes
𝑏₍runtime₎
Runtime success
{0, 1}
runtime_success
yes
𝑏₍type₎
Type safety
{0, 1}
type_safety
yes
𝑏₍tests₎
Unit/integration tests pass
{0, 1}
tests_pass
no
𝑏₍db₎
Databricks connectivity
{0, 1}
databricks_connectivity
no
x̂₍data₎
Data validity
[0, 1]
data_validity_score / 5
no
x̂₍ui₎
UI functionality
[0, 1]
ui_functional_score / 5
no
x̂₍run₎
Local runability
[0, 1]
local_runability_score / 5
no
x̂₍deploy₎
Deployability
[0, 1]
deployability_score / 5

Definition
Let each evaluation produce:
Step 1 – Reliability Pillar
Aggregate all runtime-critical checks with a geometric mean:
R = GM(b_build, b_runtime, b_type, b_tests, b_db, x̂_data, x̂_ui)
This captures the fraction of core subsystems operating correctly in a single multiplicative measure.
Step 2 – Agentic DevX Pillar
D = GM(x̂_run, x̂_deploy)
Quantifies how well the generated app integrates with an autonomous agent’s local execution and deployment pipeline.
Step 3 – Soft Penalty Gate
To retain continuity yet penalize critical outages:
G = (0.25 + 0.75 × b_build) × (0.25 + 0.75 × b_runtime) × (0.50 + 0.50 × b_db)
These multipliers reduce credit when essential subsystems fail without collapsing the score to 0.
Step 4 – Final Composite

AppEval-100 = 100 × (0.7 × R + 0.3 × D) × G
Values near 100 denote near-perfect readiness, 50-70 partial operability and <30 signifies fundamental execution issues. 
Interpretation
Each point approximates a percentage of capabilities functioning simultaneously.
The index is robust across prompts and run counts because it scales all partial scores to [0, 1].
Longitudinal averages over prompts (AppEval-100@k) can be used for macro-tracking as described below.


Planned Extensions
Planned addition
Purpose
Deterministic CRUD check
Align with L3/L4 rubric for “Data Operations”
Efficiency pillar (tokens, time, turns, LOC)
Incorporate performance and cost efficiency
Difficulty-weighted prompt aggregation
Normalize for varying prompt complexity
Quantile scaling for numeric metrics
Statistical robustness across cohorts
Assessor handbook thresholds
Replace heuristic mapping with explicit PASS/WARN/FAIL rules

5) Efficiency

Definition (lower the better):

EffUnits = T / 1000 + U + V
T = tokens used on this run (prompt+completion)
U = agent turns
V = validation runs / retries
We only scale tokens to “thousands” so it’s on the same rough magnitude as turns/validations.
No other weights, no calibration. For a 0-100 index, may report EffIndex = 100 * EffUnits / (1 + K) with K deterministic passes + DevX/5, but simplest is to show EffUnits raw.


Current Evaluation Results

Current Evals 2.0, 20 simple apps, TS + tRPC + template + codegen MCP + Databricks custom integration:



Run results in MLFlow (test run, work in progress)
https://6177827686947384.4.gcp.databricks.com/ml/experiments/11941304440222/runs/5b1eceb1265c4ab59e0b643191e5e7d2?o=6177827686947384




SDK integration run in MLFlow (test run, work in progress)
https://6177827686947384.4.gcp.databricks.com/ml/experiments/11941304440222/runs/93efd2b4ccbc41c0b65a3fcd42827e98?o=6177827686947384

Current metrics are preliminary and calculated on a small set of prompts that needs to be extended to be representative.
6) Agentic DevX Rubrics
DevX rubrics are simulating user experience of the developer - how easy is it to run the application, how easy is it to test it, debug and deploy?

In the target solution LLM agent will be given a task to run the app and it will do this reading files at least number of operations, same for test, debug and deploy. 

For now the below metrics are just proxies that are used to estimate the target metrics.

Runability (0–5):
0: install/start fails; missing scripts/env
1: installs; start fails not solvable via README
2: starts with manual tweaks (undocumented env)
3: starts cleanly with .env.example + documented steps
4: starts and seeds/migrations via scripts
5: + healthcheck endpoint + smoke test succeeds
Deployability (0–5):
0: no/broken Dockerfile
1: image builds; container fails to start
2: starts; healthcheck fails or ports undefined
3: healthcheck OK; smoke 2xx
4: + logs/metrics hooks present
5: + automated rollback to prior known-good tag
7) Mapping to DORA (with calculation rules)
Google DORA metrics is an industry standard for evaluating software process maturity - we target an Elite score because of codegen capabilities given to developers.

Deployment Frequency: count of successful Layer-9 events per app per day (or per 100 prompts).
Estimates from mean efficiency E-metrics (time to generate + time to deploy): how long it takes to generate one application from the prompt in the evaluation plus deployment time
Lead Time: median time from first model call to first successful Layer-9 (or Layer-7 "pre-deploy" when L9 gated).
Estimates from mean efficiency E-metrics of change requests (new rubric, time to generate + time to deploy): how long it takes to generate application update from the change prompt in the evaluation plus deployment time
Change Failure Rate: fraction of L9 deployments that fail healthcheck or are rolled back within T=30 min.
Estimates from number of various failures in generated applications
MTTR: median time from failure detection to restore (prior healthy image running).
Estimates from mean efficiency E-metrics of change requests for issue fixes (new rubric, time to generate + time to deploy): how long it takes to generate application update from the change prompt in the evaluation plus deployment time.
Agentic DevX scores directly enable DORA by raising probability of L9 success and reducing fix time.
8) Readiness Levels & Go/No-Go Gates
Level
When to use
Gate (must satisfy)
What's allowed
Research
model iteration & stack changes
L1–L2 pass; L8 ≥ 2
Local demos only
Internal Preview
internal usage & feedback
L1–L7 pass; L8 ≥ 3, L9 ≥ 3
Staged internal deploy
Production Candidate
external consideration
L1–L7 pass; L8 ≥ 4, L9 ≥ 4; type-safety pass; DORA guardrails: Lead Time P50 ≤ 10 min, CFR ≤ 15%, MTTR ≤ 15 min over last 50 runs
On-demand deploy with rollback


9) Risks & Mitigations
Narrow eval set. Expand from 20 simple prompts → 100+ across Basic / Advanced / Hard tiers to improve generalizability.
Stack specificity. Start with TS+tRPC; add A/B with Databricks Apps SDK, plus one mainstream Python/TS variant.
Test brittleness. Prefer unit/integration; keep UI smoke minimal and actionable.
Reproducibility. Ship a full artifact pack (prompts, seeds, Dockerfiles, CI, assessor rubric, one-command runner).
10) Roadmap (4–6 weeks)
Artifacts & Telemetry: Publish repro pack; instrument DORA telemetry in CI (deploy logs, healthchecks, rollbacks).
Prompt Cohorts: Grow to 100+ prompts with tiered difficulty; keep current 20 as a regression set.
Benchmarks: Add at least one external baseline (agent without environment scaffolding) + report token counts.
Agentic DevX uplift: Enforce .env.example + exact run/deploy steps; add observability as a Deployability sub-criterion (no new layer).
Databricks Apps SDK A/B: Measure Runability/Deployability delta vs baseline scaffolds.
Appendix A — Current "Simple 20" Prompt Set
Prompt ID
Description
churn-risk-dashboard
Build a churn risk dashboard showing customers with less than 30 day login activity, declining usage trends, and support ticket volume. Calculate a risk score.
revenue-by-channel
Show daily revenue by channel (store/web/catalog) for the last 90 days with week-over-week growth rates and contribution percentages.
customer-rfm-segments
Create customer segments using RFM analysis (recency, frequency, monetary). Show 4-5 clusters with average spend, purchase frequency, and last order date.
taxi-trip-metrics
Calculate taxi trip metrics: average fare by distance bracket and time of day. Show daily trip volume and revenue trends.
slow-moving-inventory
Identify slow-moving inventory: products with more than 90 days in stock, low turnover ratio, and current warehouse capacity by location.
customer-360-view
Create a 360-degree customer view: lifetime orders, total spent, average order value, preferred categories, and payment methods used.
product-pair-analysis
Show top 10 product pairs frequently purchased together with co-occurrence rates. Calculate potential bundle revenue opportunity.
revenue-forecast-quarterly
Show revenue trends for next quarter based on historical growth rates. Display monthly comparisons and seasonal patterns.
data-quality-metrics
Monitor data quality metrics: track completeness, outliers, and value distribution changes for key fields over time.
channel-conversion-comparison
Compare conversion rates and average order value across store/web/catalog channels. Break down by customer segment.
customer-churn-analysis
Show customer churn analysis: identify customers who stopped purchasing in last 90 days, segment by last order value and ticket history.
pricing-impact-analysis
Analyze pricing impact: compare revenue at different price points by category. Show price recommendations based on historical data.
supplier-scorecard
Build supplier scorecard: on-time delivery percentage, defect rate, average lead time, and fill rate. Rank top 10 suppliers.
sales-density-heatmap
Map sales density by zip code with heatmap visualization. Show top 20 zips by revenue and compare to population density.
cac-by-channel
Calculate CAC by marketing channel (paid search, social, email, organic). Show CAC to LTV ratio and payback period in months.
subscription-tier-optimization
Identify subscription tier optimization opportunities: show high-usage users near tier limits and low-usage users in premium tiers.
product-profitability
Show product profitability: revenue minus returns percentage minus discount cost. Rank bottom 20 products by net margin.
warehouse-efficiency
Build warehouse efficiency dashboard: orders per hour, fulfillment SLA (percentage shipped within 24 hours), and capacity utilization by facility.
customer-ltv-cohorts
Calculate customer LTV by acquisition cohort: average revenue per customer at 12, 24, 36 months. Show retention curves.
promotion-roi-analysis
Measure promotion ROI: incremental revenue during promo vs cost, with 7-day post-promotion lift. Flag underperforming promotions.

Appendix B — Minimal Runbook (Repo Hygiene)
README with exact local run & docker run commands
.env.example listing all required keys
Healthcheck endpoint + one-step smoke test
Logs/metrics hooks (observability stubs)
Seed/migration scripts when data is needed
Appendix C — Reproducibility & Audit Checklist
Cohort manifest (prompt IDs, seeds)
Token accounting (input/output, calls/app)
Exact repo commit + Dockerfiles + CI recipes
One-command runner to reproduce summary tables
Assessor rubric with pass/fail thresholds per gate
TL;DR (short)
Methodology (objective, reproducible)
Unit: one prompt → one app on TS+tRPC+Databricks.
Gates: L1–L7 binary checks + Agentic DevX — L8 Runability (0–5), L9 Deployability (0–5).
Ship app only if L1–L7 pass, L8≥4, L9≥4, type-safety passes, and DORA guardrails met (P50 lead time ≤10m, CFR ≤15%, MTTR ≤15m).
Where we are (is it good?)
Baseline (Evals 1.0): ~73% viability; best-case deploy 30–60m.
Current (Evals 2.0; 20 simple apps): Build/Runtime 20/20, L8=3.0, L9=2.5, Type-safety 1/20, ~732 LOC, 2.7s build step, 93 turns/app, $14.81 total (~$0.74/app).
 Verdict: reproducible baseline; below ship thresholds; not production-ready.
What’s next
Scale evals 20 → 100+ prompts; keep 20 as regression.
Ship repro pack (prompts/seeds/Docker/CI/runner/rubric).
Wire DORA in CI and enforce guardrails.
Lift L8/L9: exact README cmds, .env.example, healthcheck+smoke, seeds/migrations, observability stub.
A/B Databricks Apps SDK vs baseline; fix type-safety (target ≥90% pass) and add an external baseline.
