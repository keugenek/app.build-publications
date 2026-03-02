# EASE 2026 Paper Assessment — Reviewer Simulation

## Critical Issues (Must Fix)

### 1. FACTUAL ERROR: Claude Opus vs Claude Sonnet contradiction
- **Line ~182**: synthesis uses "a reasoning model (Claude Opus)"
- **Line ~424**: "Cost is dominated by the reasoning model (Claude Sonnet)"
- These directly contradict each other. Which model does the synthesis phase use?

### 2. FACTUAL ERROR: Cluster radar chart (Figure 1) data is stale
- TikZ comments say `HIGH cluster (n=8)`, `MEDIUM cluster (n=10)`, `LOW cluster (n=2)` — old n=20 values
- The polygon coordinates (e.g., D8 at `1.848/2.2 = 0.84`) were computed from old 0–5 scoring. But text says metrics are now **binary {0,1}**. Cluster centroids for binary data should be proportions, not the old continuous values. The chart shape would look completely different.
- **Status: Partially addressed** — n values in legend updated to n=20/25/5, but polygon shapes still reflect old data.

### 3. INTERNAL INCONSISTENCY: L4 (tests) missing from results
- The 9-metric framework explicitly lists "L1–L4: build, runtime, type safety, **tests**"
- But L4 never appears in the results table (Table 4), radar chart, or cluster vector
- Reviewer will ask: was L4 evaluated? What was the pass rate? If part of the 9-metric framework, it must be reported.
- **Fix**: Add L4 to results table, or explain why it's excluded.
- **Note**: L4 is in the prompt contracts table (Table 3) with its agentic prompt. The eval code (`check_tests_pass`) runs it. Need the actual pass rate from the n=50 Claude run to add to Table 4.

### 3b. FACTUAL ERROR (FIXED): L1–L4 called "deterministic" but are agentic
- **Previously**: Paper said "Core Functionality (L1–L4) uses deterministic checks"
- **Reality**: All L1–L4 go through the same `EvalAgent._run_agent_step()` → Claude SDK → `STATUS: PASS|FAIL` protocol as L5–L7 and D8–D9
- The only difference: L1–L4 use single-trial, D8/D9/L6 use 3-trial
- **Status: FIXED** — Updated throughout paper to say "all metrics are agentic; L1–L4 use single trial"

### 4. INTERNAL INCONSISTENCY: Cluster vector excludes L6, L7
- Cluster vector: $(L_1, L_2, L_3, L_5, D_8, D_9)$ — 6 dimensions
- But L6 (Data Returned, 80%) and L7 (UI Renders, 84%) are in the results table
- Why include L5 but not L6/L7? Selection is arbitrary and unexplained.
- **Fix**: Either include L6/L7 in cluster vector or justify exclusion.

### 5. INTERNAL INCONSISTENCY: Abstract says multi-agent, results are single-agent
- Abstract: "Claude Agent SDK, Cursor, Opencode with open-source models"
- Results (line ~374): "Each was generated... using the Claude Agent SDK"
- The main results table (n=50) has one set of numbers with no per-backend breakdown.
- **Status: Partially addressed** — Table 6 (multi-agent comparison) now shows Claude vs Opencode, but the n=50 results are still single-backend, and Cursor has no data at all.

### 6. WEAK EVIDENCE: Feedback loop improvement not quantified
- The feedback loop is the paper's central claim
- Evidence: "After implementing the fix, subsequent iterations showed improvement"
- **What improvement?** Type safety went from 6% to what? Without before/after numbers, the feedback loop claim is unsubstantiated.
- **This is the weakest point of the paper and a likely rejection cause.**

## Moderate Issues (Should Fix)

### 7. "Up to 90%" is ambiguous
- Results table shows 45/50 = exactly 90%. If it's 90%, say 90%.
- "Up to" implies variability across backends, but there's no per-backend breakdown for the n=50 set.
- Line 402 reads awkwardly: "The up to 90% build/runtime success..."

### 8. DORA mapping is a stretch
- "Deployment frequency = D9 pass rate across evaluation runs" — DORA measures how often teams deploy to production, not a test metric pass rate
- "Mean time to restore = how quickly the feedback loop fixes regressions" — very loose
- A reviewer familiar with DORA will flag this as overclaiming.

### 9. No confidence intervals or statistical tests
- With n=50 binary outcomes, D8=72% has a 95% CI of roughly [58%, 83%] and D9=60% has [46%, 73%]. Wide.
- For EASE (Evaluation and **Assessment**), omitting statistical analysis is a notable gap.
- **Status: Partially addressed** — 3-trial variance analysis now included for Opencode, but not for the main Claude n=50 results.

### 10. Quality spectrum bar is misleading
- X-axis says "Cosine similarity to ideal vector" but dots are **evenly spaced** within each band — not placed at actual similarity values.

### 11. Generation–evaluation isolation: evidence is anecdotal
- "We observed agents reading evaluation scripts" — how? In how many trajectories? Without quantification, this reads as an anecdote.

### 12. Platform-independence claim scope
- "The same contracts apply to any data application platform without modification"
- L5 assumes a database-backed app. Many application types don't have queryable databases.
- Should scope to "data application platforms" (which it mostly does, but the claim is still broad).

### 13. Cost per app doesn't clarify what's included
- Is $2.33 generation cost only? Generation + evaluation? Including trajectory analysis ($0.30/app)?

### 14. "93 average agent turns" appears without context (line ~424)
- Is this for generation? Evaluation? Never defined or referenced elsewhere.
- **Note**: Now used in multi-agent table but still lacks definition in the text.

### 15. Evals 1.0 vs 2.0 comparison was not apples-to-apples
- **Status**: Table removed in latest version.

## Minor / Formatting Issues

### 16. Title is long for a short paper
- 15 words in the subtitle. Could be tightened.

### 17. "We believe this approach generalizes" (abstract)
- "We believe" is weak for a scientific paper. Either present evidence or drop the hedge.

### 18. Data Availability subsection is generous for a short paper
- Could be one sentence in the conclusion to save space.

### 19. Opencode n=5 is preliminary
- Table 6 (multi-agent) correctly notes "preliminary" but the statistical conclusions drawn from n=5 should be more cautious.

### 20. D8 pass criteria mismatch
- Paper says "majority of trials succeed" (2/3)
- Actual eval code requires 3/3 passes
- The Opencode D8=40% uses the code's 3/3 strict rule, but the paper text says majority. These should be reconciled.

## Summary Priority Matrix

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Opus/Sonnet contradiction | Must fix | Low |
| 2 | Radar chart stale data | Must fix | Medium |
| 3 | L4 missing from results | Must fix | Low |
| 5 | Multi-agent claim gaps | Must fix | Medium |
| 6 | Feedback loop not quantified | **Likely rejection cause** | High |
| 4 | Cluster vector arbitrary | Should fix | Low |
| 7 | "Up to 90%" ambiguity | Should fix | Low |
| 8 | DORA overclaiming | Should fix | Medium |
| 9 | No statistical tests (n=50) | Should fix | Medium |
| 20 | D8 majority vs 3/3 mismatch | Should fix | Low |
