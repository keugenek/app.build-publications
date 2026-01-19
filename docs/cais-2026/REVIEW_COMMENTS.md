# CAIS 2026 Paper Review Comments

Extracted from handwritten review notes on printed draft.

---

## Page 1 - Abstract and Introduction

### Comment 1: "Vanilla" (Introduction, paragraph 1)
**Location:** First paragraph of Introduction
**Comment:** "Vanilla"
**Context:** Near "AI agents can generate functional software, but they lack domain-specific knowledge required for production applications. The conventional response is building better agents. We take a different approach: improve what agents have access to."
**Interpretation:** Consider clarifying the "vanilla" baseline or conventional approach being contrasted.

### Comment 2: "benchmark" (Introduction, numbered list)
**Location:** Near item 2 in the feedback loop list
**Comment:** "benchmark"
**Context:** "2. Identifies friction points and root causes (analysis)"
**Action:** Consider adding benchmark/comparison to analysis component.

---

## Page 2 - Figure 1 and Component Descriptions

### Comment 3: "add evals / regression suite" (Figure 1)
**Location:** Near "Trajectories (+ evals)" box in Figure 1
**Comment:** "add evals / regression suite"
**Action:** Expand on evaluation and regression testing capabilities in the trajectory feedback loop.

### Comment 4: "what exactly?" (Section 2 - Installable Domain Knowledge)
**Location:** Description of Installable Domain Knowledge component
**Comment:** "what exactly?"
**Action:** Clarify what "installable domain knowledge" concretely means - provide more specific examples or definition.

### Comment 5: "prints" / "friMs" (Section 3 - Agentic Trajectory Analyzer)
**Location:** Near Agentic Trajectory Analyzer description
**Comment:** Appears to say "prints" or "friMs"
**Action:** Review - may relate to output/printing of analysis results.

### Comment 6: "+ app Stories" and "eff Score" (Section 4 - Agentic DevX Metrics)
**Location:** Near Agentic DevX Metrics description
**Comment:** "+ app Stories" and "eff Score"
**Action:** Consider adding app stories/scenarios to the metrics. Reference efficiency score metric.

### Comment 7: "However they often have spent too many steps on fixing issues" (Section 2.1)
**Location:** Margin near Section 2.1 Motivation
**Comment:** "However they often have spent too many steps on fixing issues"
**Context:** Discussion of capable agents like Claude Code, Cursor, Codex
**Action:** Address the inefficiency concern - agents may spend excessive steps on issue resolution despite being capable.

### Comment 8: "in our opinion" (Section 2.1)
**Location:** Near "creates vendor lock-in" paragraph
**Comment:** "in our opinion"
**Action:** Either explicitly acknowledge this as an opinion or provide evidence/citations to support the vendor lock-in claim.

### Comment 9: "Scope: data web apps" (Page 2 bottom)
**Location:** Bottom of page 2
**Comment:** "Scope: data web apps"
**Action:** Clarify scope is specifically data web applications, not all applications.

---

## Page 3 - Architecture (Section 2.2) and Context Layers (Section 2.3)

### Comment 10: "loC for agentic scaffolding" (Architecture diagram)
**Location:** Right margin near architecture diagram
**Comment:** "loC for agentic scaffolding"
**Action:** Consider adding Lines of Code (LoC) metrics or measurements for the agentic scaffolding components.

### Comment 11: "Pluggable templates" (Architecture diagram)
**Location:** Right margin near architecture diagram
**Comment:** "Pluggable templates"
**Action:** Emphasize the pluggable/modular nature of templates in the architecture.

### Comment 12: "especially if context is assembled from multiple parts" (Section 2.3)
**Location:** Bottom of page 3, near Context Layers section
**Comment:** "especially if context is assembled from multiple parts"
**Context:** Discussion of progressive context injection
**Action:** Elaborate on how context assembled from multiple parts creates complexity and how the layered approach addresses this.

---

## Page 4 - Context Layers Table, Tools (Section 2.4), and State Machine (Section 2.5)

### Comment 13: "need an explainer or code" (Context Layers table)
**Location:** Top of page, near L2/L3 context layer descriptions
**Comment:** "need an explainer or code"
**Action:** Add code examples or detailed explanations for context layer injection mechanism.

### Comment 14: "cli different" (Section 2.4 Tools)
**Location:** Near Tools section discussing CLI commands
**Comment:** "cli different"
**Context:** Discussion of CLI commands pattern referenced from Cloudflare and Anthropic
**Action:** Clarify how CLI approach differs from direct tool calling.

### Comment 15: "in our design" (Section 2.5 State Machine)
**Location:** Near State Machine section
**Comment:** "in our design"
**Action:** Clarify this is a design choice specific to this implementation, not a universal requirement.

### Comment 16: "hows?" (State Machine checksum explanation)
**Location:** Near checksum explanation
**Comment:** "hows?"
**Context:** "The checksum captures state at validation time. Any change after validation requires re-validation."
**Action:** Explain HOW the checksum mechanism works technically.

### Comment 17: "?" (Agent Compatibility table - PLACEHOLDER)
**Location:** Near [PLACEHOLDER] in the backend compatibility table
**Comment:** "?"
**Action:** Fill in the placeholder with actual model/backend name for LiteLLM integration.

---

## Page 5 - Section 3: Agentic Trajectory Analyzer

### Comment 18: "examples" (Section 3.2 - Why Trajectories)
**Location:** Near trajectory explanation paragraph
**Comment:** "examples" with checkmark
**Context:** "Trajectories--the sequence of reasoning, tool calls, and results--show where things went wrong. An agent retrying the same malformed SQL five times reveals a missing example. An agent calling N tools for N tables reveals a missing batch operation."
**Action:** Good examples provided - keep and possibly expand with more concrete examples.

### Comment 19: "repetitions" (Two-Phase Architecture diagram)
**Location:** Near Map Phase diagram showing extraction of errors/retries/confusion/inefficiency
**Comment:** "repetitions"
**Action:** Explicitly include "repetitions" as a signal type in the Map Phase extraction, alongside errors/retries/confusion/inefficiency.

---

## Page 6 - Figure 3: Two-Phase Trajectory Analyzer

### Comment 20: "examples" and "traces" (Figure 3 - Agentic Synthesis Phase)
**Location:** Near the Agentic Synthesis Phase diagram
**Comment:** "examples" with arrow pointing down, "traces"
**Action:** Provide concrete examples of traces flowing through the synthesis phase.

### Comment 21: "recommendations" (Progressive context discovery box)
**Location:** Near "Up to 50 turns of exploration / Progressive context discovery" box
**Comment:** "recommendations"
**Action:** Clarify how recommendations are generated from the exploration process.

### Comment 22: "explain" (Agentic synthesis phase paragraph)
**Location:** Margin near the agentic synthesis phase description
**Comment:** "explain"
**Context:** "Agentic synthesis phase. Aggregated patterns go to a reasoning model (we use Claude Opus) with read-only access to: Template and CLI tools source code (via Read/Glob/Grep) - Tool definitions (extracted from MCP server) - Evaluation metrics (per-app scores, optional)"
**Action:** Provide more detailed explanation of the synthesis phase process.

---

## Page 7 - Sections 3.4-3.6 and Section 4.1-4.2

### Comment 23: "unclear - expand or mention briefly" (Section 3.4 Concrete Improvements)
**Location:** Top of page near section 3.4 title
**Comment:** "unclear - expand or mention briefly"
**Context:** Table showing Pattern Observed → Diagnosis → Fix Applied
**Action:** Either expand the concrete improvements section with more detail, or mention it more briefly. Current level of detail may be awkward middle ground.

### Comment 24: "which?" (Section 3.6 Future Direction)
**Location:** Margin near discussion of production tooling
**Comment:** "which?"
**Context:** "Recent work on reflective prompt evolution (GEPA) shows prompts can be automatically optimized through self-reflection."
**Action:** Clarify which specific production tooling or techniques are being referenced.

### Comment 25: "Can sometimes but slow" (Section 4.2 Motivation)
**Location:** Bottom of page, near agent capability discussion
**Comment:** "Can sometimes but slow"
**Context:** "An agent cannot. It needs explicit .env.example files, documented commands, health endpoints for verification."
**Action:** Nuance the claim - agents CAN sometimes figure things out, but it's slow/inefficient. The point is about efficiency, not impossibility.

---

## Page 8 - Sections 4.3-4.6 (Runability and Deployability)

No additional handwritten comments identified on this page.

---

## Page 9 - Figure 4 and Section 4.7 DORA Alignment

### Comment 26: Checkmark (Section 5. Results)
**Location:** Left margin near Section 5. Results header
**Comment:** Checkmark (✓)
**Interpretation:** Positive feedback - Results section is good.

---

## Page 10 - Sections 5.2-5.3 and Section 6 Related Work

### Comment 27: Bracket/Checkmark (Section 6 - Evaluation gap paragraph)
**Location:** Left margin near "Evaluation gap" paragraph
**Comment:** Bracket or checkmark marking the paragraph
**Context:** "Evaluation gap. Existing benchmarks evaluate code correctness (HumanEval, SWE-bench), task completion (WebArena, GAIA), or SQL quality (BIRD, Spider). None ask whether generated code can be operated by other agents—a critical question for compound AI systems where one agent's output becomes another's input."
**Interpretation:** Positive feedback - this paragraph effectively articulates the evaluation gap contribution.

---

## Summary of Action Items

| Priority | Comment | Action Required | Status | Evidence/Link |
|----------|---------|-----------------|--------|---------------|
| High | #4 | Clarify "installable domain knowledge" definition | **DONE** | Added Section 2 with `.mdc` rule files explanation, code example from `database-queries.mdc` |
| High | #13 | Add code examples for context layers | **DONE** | Added `lstlisting` code block showing Drizzle ORM patterns |
| High | #16 | Explain checksum mechanism technically | **DONE** | Explained MD5 hash mechanism, referenced `check_template_failed()` in `analysis/analyze_benchmark.py:37-56` |
| High | #17 | Fill in [PLACEHOLDER] in table | **DONE** | Replaced with "LiteLLM + Qwen3" with production validation data (70% success at $0.61/app) |
| High | #22 | Explain agentic synthesis phase in more detail | **DONE** | Added detailed subsection with 50-turn exploration, example trace through synthesis |
| High | #23 | Expand or condense Section 3.4 Concrete Improvements | **DONE** | Expanded with Table 3 showing Pattern → Diagnosis → Fix with evidence |
| Medium | #3 | Expand evals/regression suite in feedback loop | **DONE** | Added "Regression Suite" to feedback loop diagram |
| Medium | #7 | Address agent step inefficiency concern | **DONE** | Added to Section 2.1 Motivation: "capable agents often spend excessive steps on fixing issues" |
| Medium | #8 | Support or acknowledge vendor lock-in opinion | **DONE** | Changed to "in our view" and explained practical advantage |
| Medium | #14 | Clarify CLI vs tool calling differences | **DONE** | Added Cloudflare/Anthropic citations explaining CLI pattern effectiveness |
| Medium | #19 | Add "repetitions" to trajectory signals | **DONE** | Added "**Repetitions** (same action attempted multiple times)" to Map Phase |
| Medium | #20 | Add concrete examples of traces in synthesis phase | **DONE** | Added "Example trace through synthesis" with QUALIFY syntax scenario |
| Medium | #21 | Clarify recommendation generation process | **DONE** | Explained 50-turn exploration with Read/Glob/Grep access |
| Medium | #24 | Clarify which production tooling/GEPA reference | **DONE** | Added GEPA and DSPy citations with explanation of applicability |
| Medium | #25 | Nuance agent capability claim (can but slow) | **DONE** | Added "An agent *can sometimes* do this too, but it's slow and inefficient" |
| Low | #1 | Clarify vanilla baseline | N/A | Paper structure differs from images |
| Low | #2 | Add benchmark reference | N/A | Paper already has benchmark comparisons |
| Low | #9 | Clarify data web apps scope | **DONE** | Added "**Scope:** Our current implementation targets data-centric web applications" |
| Low | #10 | Consider LoC metrics | **DONE** | Added "Lines of code for the complete scaffolding: ~2,400 across 14 rule files" |
| Low | #11 | Emphasize pluggable templates | **DONE** | Added "Templates are *pluggable*—users can swap template sets" |
| Low | #12 | Elaborate on multi-part context assembly | **DONE** | Added "especially important when context is assembled from multiple parts" |
| Low | #15 | Clarify design choice framing | **DONE** | Added "In our design" prefix to state machine section |
| Low | #18 | Keep/expand examples (positive feedback) | **DONE** | Kept and expanded with additional examples |
| N/A | #26 | Results section is good (positive) | - | No action needed |
| N/A | #27 | Evaluation gap paragraph is good (positive) | - | No action needed |

---

## Notes

- These comments appear to be from an internal review session
- Several comments seek more concrete examples and technical details
- The "in our opinion" note suggests some claims need stronger evidence
- Positive feedback on:
  - Trajectory examples (Comment #18)
  - Results section (Comment #26)
  - Evaluation gap articulation (Comment #27)
- Key themes:
  - Need more explanation of technical mechanisms (checksum, synthesis phase)
  - Claims about agent capabilities should be nuanced
  - Section 3.4 needs to be either expanded or condensed

---

## Changes Made (2026-01-19)

### Paper Edits (`paper.tex`)

1. **Added new Section 2: Installable Domain Knowledge**
   - Subsection 2.1: Motivation (addresses #7, #8, #9)
   - Subsection 2.2: Architecture with Context Layers, Tools, State Machine
   - Code example from `database-queries.mdc` (addresses #13)
   - Checksum explanation with MD5 implementation reference (addresses #16)
   - Subsection 2.3: Agent Compatibility table with Qwen3 data (addresses #17)

2. **Expanded Section: Agentic Trajectory Analyzer**
   - Added "Repetitions" to Map Phase signals (addresses #19)
   - Added example trace through synthesis (addresses #20, #21)
   - Expanded Concrete Improvements with implementation table (addresses #23)
   - Added Cost Model subsection
   - Added Future Direction with GEPA/DSPy references (addresses #24)
   - Added regression suite to feedback loop (addresses #3)

3. **Updated Agentic DevX Section**
   - Nuanced agent capability claim (addresses #25)
   - Added "Why This Matters" explanation

4. **Framework section updates**
   - Emphasized pluggable templates (addresses #11)

### Bibliography Edits (`references.bib`)

Added citations:
- `gepa2024` - GEPA prompt optimization
- `khattab2023dspy` - DSPy
- `cloudflare2024codemode` - Cloudflare CLI pattern
- `anthropic2024tools` - Anthropic tool use
- `jiang2024survey` - Code generation survey
- `paul2024benchmarks` - AI coding assistants survey
- `wang2024openhands` - OpenHands

### Evidence Sources Used

1. **Codebase analysis:**
   - `/analysis/analyze_benchmark.py:37-56` - checksum mechanism
   - `/analysis/dataset/openmodels/*/source_code/server/.cursor/rules/` - context layer implementation
   - `database-queries.mdc` - Drizzle ORM patterns example

2. **Results data:**
   - Qwen3-Coder-480B: 70% success at $0.61/app
   - Claude Sonnet 4: 86.7% success at $5.01/app
   - Template detection via MD5 hash `eeb92b801087f89346a7ad3c1baa5163`

3. **Prior work:**
   - SANER 2026 paper for production metrics (650+ stars, 3000+ apps)
   - EACL 2026 paper for ablation study details
