# CAIS 2026 Paper Restructuring Plan

## Current Problem

Paper structure is imbalanced - AppEval-100 takes most space while other contributions are underrepresented:
1. Installable domain knowledge package for agents (currently MCP, future: Skills)
2. Agentic trajectory analyzer for tooling improvement
3. AppEval framework with novel Agentic DevX metrics

All three are core contributions that deserve balanced coverage.

## Target Narrative (3 Pillars)

### Pillar 1: Installable Domain Knowledge for Agents

**Thesis**: Instead of building yet another agent, we package domain knowledge as an installable artifact that any agent can use. User installs a thing → agent gets correct context + useful scaffolding.

**Key points**:
- Problem: Databricks apps require specific stack (TypeScript/tRPC), infra knowledge (Unity Catalog, SQL Warehouse, Apps deployment), and lifecycle management
- Insight from SANER (preprint, accepted at SANER'26 Industrial Track): environment/tooling matters more than model selection
- Solution: Installable package exposing:
  - `scaffold_data_app` → template with embedded guidance (CLAUDE.md)
  - `validate_data_app` → Docker build + Playwright screenshot + state machine
  - `deploy_databricks_app` → Databricks Apps platform deployment
  - Databricks exploration tools (SQL execution, catalog browsing)
- **Protocol-agnostic framing**: Currently implemented as MCP server, but core idea applies to emerging standards like Agent Skills (agentskills.io). The abstraction is: user installs domain package → agent gains domain expertise.
- Agent-agnostic validation:
  - Primary: Claude Agent SDK (production use)
  - Manual: Cursor, Codex
  - Automated: LiteLLM backend with open-source models (codegen_multi.py)
- State machine enforces correct workflow: Scaffolded → Validated (checksum) → Deployed

**CAIS relevance**: Pillar 1 (Architectural Patterns - tool-augmented designs), Pillar 3 (Engineering & Operations - production case studies)

### Pillar 2: Agentic Trajectory Analyzer

**Thesis**: Systematic feedback loop to improve tooling based on agent execution patterns. Context-first analysis enables targeted improvements to any component (templates, tools, guidance).

**Key points**:
- Problem: When agents fail, is it the model or the tooling? How do we know what to improve?
- Solution: Two-phase analysis pipeline:
  1. **Map phase** (Haiku): Parallel analysis of individual trajectories - friction points, errors, retries, inefficiencies. Cheap model for high-throughput pattern extraction.
  2. **Reduce phase** (Opus agent): NOT just aggregation - full agentic exploration (up to 50 turns) with Read/Glob/Grep tools over:
     - Haiku summaries (patterns across all apps)
     - Template source code (live inspection)
     - Tool definitions (extracted via JSON-RPC from running server)
     - Evaluation metrics (empirical data)
- **Key insight**: Context-first architecture. Agent receives all context upfront, then explores freely. Can focus on template issues, tool description problems, or root causes depending on what patterns emerge. Universal approach - not hardcoded to specific improvement types.
- Output: Actionable recommendations for template improvements, tool changes, root causes
- Asymmetric model strategy: cheap Haiku ($) for map, expensive Opus ($$$) for bounded synthesis
- Future direction: DSPy-style optimization for automatic prompt/tool tuning

**CAIS relevance**:
- Pillar 2 (System Optimization - automated pipeline improvement)
- Pillar 3 (MLOps - debugging/monitoring compound AI systems)
- Strong fit: This is exactly "debugging compound AI" - understanding why agent+tools fail together

### Pillar 3: AppEval - Composite Evaluation

**Thesis**: Novel evaluation framework that measures what matters for compound AI: not just "does code work" but "can agents operate it".

**Key points**:
- 9 objective metrics across 4 pillars (Reliability, SQL Quality, Web Quality, Agentic DevX)
- **Novel contribution - Agentic DevX metrics**:
  - Runability (0-5): Can another agent run the generated app locally?
  - Deployability (0-5): Can another agent deploy it to production?
  - This is NEW - existing benchmarks don't measure "agentic operability"
- Connection to DORA (industry DevOps standard): deployment frequency, lead time, change failure rate, MTTR
- AppEval-100 composite score with principled weighting
- Automated + objective: Docker builds, type checking, Playwright screenshots, VLM assessment
- Current results: 90% build success, 90% Databricks connectivity, type safety gap identified (5%)

**Why this matters for CAIS**:
- Pillar 4 (Evaluation & Benchmarking) - but goes beyond traditional evals
- Measures compound system quality, not just code correctness
- DORA mapping grounds it in industry practice
- Reproducibility: fully automated, no human annotation needed

**CAIS relevance**: Pillar 4 (Evaluation & Benchmarking) - strong fit, novel metrics

---

## Proposed Structure

### 1. Introduction (1 column)
- Problem: Building domain-specific apps with AI agents requires domain knowledge agents don't have
- Failed approach: Custom agents for each domain (doesn't scale, vendor lock-in)
- Our approach: Installable domain knowledge packages + systematic improvement via trajectory analysis
- Contributions:
  1. Installable domain knowledge architecture (implemented as MCP server, generalizes to Skills)
  2. Agentic trajectory analyzer for compound AI debugging
  3. AppEval evaluation framework

### 2. Background & Related Work (0.75 column)
- Agent tool protocols: MCP, Agent Skills (agentskills.io) - brief, protocol-agnostic framing
- SANER insight: environment > model (cite preprint, accepted SANER'26 Industrial)
- Gap: existing benchmarks evaluate agents OR tools, not the compound system

### 3. Installable Domain Knowledge (1.5 columns)
- Architecture: protocol-agnostic description of what gets packaged
- Core components:
  - Scaffolding with embedded guidance (CLAUDE.md pattern)
  - Validation pipeline (Docker + visual + state machine)
  - Deployment integration
  - Domain-specific exploration tools (Databricks: SQL, catalog)
- State machine: Scaffolded → Validated (checksum) → Deployed
- Agent compatibility: Claude SDK (primary), Cursor, Codex, LiteLLM/open-source

### 4. Agentic Trajectory Analyzer (1.5 columns)
- Motivation: When compound system fails, what to fix? Model? Tools? Template?
- Architecture (figure):
  - Map: Haiku parallel trajectory analysis (friction extraction)
  - Reduce: Opus agent with Read/Glob/Grep exploring:
    - Aggregated friction patterns
    - Live template source
    - Tool definitions (JSON-RPC extraction)
    - Evaluation metrics
- Key insight: Context-first, target-agnostic. Agent decides what to improve.
- Example: Concrete friction → fix (restore from git history if needed)
- Cost model: N×Haiku + bounded Opus = affordable at scale
- Future: DSPy-style automatic optimization

### 5. AppEval Framework (1 column)
- 9-metric framework across 4 pillars (table)
- **Agentic DevX novelty**: Runability + Deployability - "can another agent operate this?"
- DORA alignment: mapping to industry DevOps metrics
- AppEval-100 composite formula (brief)
- Automation: Docker, type checker, Playwright, VLM

### 6. Results (0.75 column)
- Generation: 90% build success, $0.74/app, 6-9 min
- Trajectory analyzer: before/after improvement example
- Type safety gap identified → demonstrates analyzer value

### 7. Discussion & Limitations (0.5 column)
- Limited to Databricks stack (but architecture generalizes)
- Claude-heavy validation (but LiteLLM shows portability)
- Future: more stacks, Skills migration, DSPy optimization

---

## Key Changes from Current Draft

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Framing** | "Agent-Agnostic Toolset" (MCP-specific) | "Installable Domain Knowledge" (protocol-agnostic) |
| **Main contributions** | AppEval-100 dominates | Three equal pillars: Domain Package + Trajectory Analyzer + AppEval |
| **Trajectory section** | 1 paragraph, "map-reduce" | 1.5 columns, emphasis on agentic reduce phase |
| **Evaluation section** | 2+ pages (verbose formulas) | 1 column (focused on DevX novelty + DORA) |
| **DORA** | Extensive mapping | Concise but present (important for industry grounding) |
| **Protocol** | MCP-centric | Protocol-agnostic (MCP now, Skills future) |
| **Benchmark design** | 100 prompts, 6 schemas, 5 domains | Minimal mention |

## Figures Needed

1. **Domain Package Architecture** - What gets installed, how agent uses it (protocol-agnostic)
2. **Trajectory Analyzer Pipeline** - Map (Haiku) → Reduce (Opus agent with tools) - THIS IS KEY FIGURE
3. **App Lifecycle State Machine** - Scaffolded → Validated → Deployed (simple)
4. **Evaluation Table** - Compact 9-metric summary

---

## Resolved Questions

1. ~~SANER paper status~~ → Accepted at SANER'26 Industrial Track, cite preprint
2. ~~Agent-agnostic claim~~ → Strong: Claude SDK + Cursor + Codex + LiteLLM/open-source
3. ~~MCP focus~~ → De-emphasize protocol, emphasize "installable domain knowledge" concept
4. ~~Trajectory before/after~~ → Restore from git commits

## Remaining Questions

1. Concrete friction→fix example: which commit(s) to showcase?
2. DSPy future direction: mention or save for future work?
3. Should we include cost breakdown for trajectory analysis itself?

---

## CAIS Fit Assessment

**Strong fit** (all four pillars covered):
- Pillar 1 (Architectural Patterns): Tool-augmented designs, installable domain packages
- Pillar 2 (System Optimization): Trajectory analyzer as automated pipeline improvement
- Pillar 3 (Engineering & Operations): MLOps for compound AI, production case study
- Pillar 4 (Evaluation): AppEval framework with DevX metrics

**Reproducibility badge potential**: Can release domain package + trajectory analyzer + evaluation harness

**Novel angle for CAIS**:
Most papers will optimize agents. We optimize what agents have access to. Compound AI = agent + tools + context. We systematically improve tools+context while keeping agent constant. Contrarian but evidence-backed (SANER).
