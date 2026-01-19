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

## Summary of Action Items

| Priority | Comment | Action Required |
|----------|---------|-----------------|
| High | #4 | Clarify "installable domain knowledge" definition |
| High | #13 | Add code examples for context layers |
| High | #16 | Explain checksum mechanism technically |
| High | #17 | Fill in [PLACEHOLDER] in table |
| Medium | #3 | Expand evals/regression suite in feedback loop |
| Medium | #7 | Address agent step inefficiency concern |
| Medium | #8 | Support or acknowledge vendor lock-in opinion |
| Medium | #14 | Clarify CLI vs tool calling differences |
| Medium | #19 | Add "repetitions" to trajectory signals |
| Low | #1 | Clarify vanilla baseline |
| Low | #2 | Add benchmark reference |
| Low | #9 | Clarify data web apps scope |
| Low | #10 | Consider LoC metrics |
| Low | #11 | Emphasize pluggable templates |
| Low | #12 | Elaborate on multi-part context assembly |
| Low | #15 | Clarify design choice framing |
| Low | #18 | Keep/expand examples (positive feedback) |

---

## Notes

- These comments appear to be from an internal review session
- Several comments seek more concrete examples and technical details
- The "in our opinion" note suggests some claims need stronger evidence
- Positive feedback on the trajectory examples (Comment #18)
