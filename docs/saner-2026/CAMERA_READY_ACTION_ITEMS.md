# SANER 2026 Camera-Ready Action Items

**Paper:** app.build: A Production Framework for Scaling Agentic Prompt-to-App Generation with Environment Scaffolding
**Submission ID:** 424
**Status:** Accepted (Strong Accept: 1, Weak Accept: 2)
**Deadline:** TBD (awaiting camera-ready instructions)

---

## Review Summary

| Reviewer | Score | Verdict |
|----------|-------|---------|
| Reviewer 1 | 3 | Strong Accept |
| Reviewer 2 | 1 | Weak Accept |
| Reviewer 3 | 1 | Weak Accept |

---

## Action Items

### Critical (Must Fix Before Submission)

- [x] **#1: Add Section I Introduction Header**
  - **Location:** `paper.tex:75`
  - **Issue:** Paper lacks proper "Introduction" section header. Content starts with `\subsection{The Production Reliability Gap}` without a parent section.
  - **Reviewer:** R2, R3
  - **Fix:** Add `\section{Introduction}` before line 75
  - **Assignee:** _unassigned_

- [x] **#2: Restructure Front Matter**
  - **Location:** `paper.tex:75-160`
  - **Issue:** Current structure makes it harder to get cohesive overview of problem, research questions, approach, and paper roadmap.
  - **Reviewer:** R3
  - **Fix:** Restructure as:
    ```latex
    \section{Introduction}
      \subsection{The Production Reliability Gap}
      \subsection{Our Approach: Environment Scaffolding}
      \subsection{Contributions}
    \section{Related Work}  % Move from \subsection
    \section{Industrial Context \& System}  % Renumber
    ```
  - **Assignee:** _unassigned_

- [ ] **#3: Enlarge Figure Fonts**
  - **Location:** `diagrams/es-vs-model.png`, `diagrams/appbuild-arch.png`
  - **Issue:** Fonts in figures 1-2 are too small, especially legend text, validator list, and edge labels ("context", "schema", "accepted").
  - **Reviewer:** R1
  - **Fix:** Regenerate figures with minimum 8pt font when printed at column width
  - **Assignee:** _unassigned_

- [x] **#4: Define All Acronyms on First Use**
  - **Location:** Throughout `paper.tex`
  - **Issue:** Most acronyms are not explained.
  - **Reviewer:** R1
  - **Fix:** Add definitions for the following on first use:
    - [x] LLM - Large Language Model
    - [x] CRUD - Create, Read, Update, Delete
    - [ ] FSM - Finite State Machine (in table, may need table note)
    - [x] API - Application Programming Interface
    - [x] UI - User Interface
    - [x] E2E - End-to-End
    - [x] CI/CD - Continuous Integration/Continuous Deployment
    - [x] CSP - Content Security Policy
    - [x] DOM - Document Object Model
    - [x] XSS - Cross-Site Scripting
    - [x] CSRF - Cross-Site Request Forgery
    - [x] WCAG - Web Content Accessibility Guidelines
    - [x] SRS - Spaced Repetition System (in prompt dataset table)
    - [ ] tRPC - Clarify it's a TypeScript RPC framework (library name)
  - **Assignee:** _unassigned_

---

### Important (Should Fix)

- [x] **#5: Remove Verbatim Repetitions**
  - **Location:** Abstract (line 55-56) and Section text (line 77)
  - **Issue:** Some statements repeated essentially verbatim multiple times.
  - **Reviewer:** R1
  - **Examples:**
    - "Engineering teams increasingly experiment with LLM agents to synthesize full-stack web applications" appears in both abstract and body
  - **Fix:** Rephrase one instance or consolidate
  - **Assignee:** _unassigned_

- [ ] **#6: Add Human Evaluation Protocol Details**
  - **Location:** `paper.tex` Section 2.4 (Assessor Protocol and Scoring)
  - **Issue:** Human evaluation process lacks details about assessor count, training, and inter-rater reliability.
  - **Reviewer:** R3
  - **Fix:** Add paragraph specifying:
    - Number of assessors
    - Assessor qualifications/training
    - Inter-rater agreement metrics (Cohen's kappa or similar)
  - **Assignee:** _unassigned_

- [ ] **#7: Add Provenance Discussion**
  - **Location:** `paper.tex` Section II (Architecture)
  - **Issue:** Paper would benefit from more details regarding provenance in agentic pipelines and its role in quality improvements.
  - **Reviewer:** R1
  - **Fix:** Add brief discussion of artifact provenance tracking
  - **Assignee:** _unassigned_

---

### Recommended (Nice to Have)

- [ ] **#8: Acknowledge Domain Scope in Introduction**
  - **Issue:** Framework is explicitly limited to CRUD web applications; generalizability to other domains unclear.
  - **Reviewer:** R2, R3
  - **Current State:** Already addressed in Threats to Validity (line 475-480)
  - **Optional Fix:** Add explicit scope acknowledgment in Introduction
  - **Assignee:** _unassigned_

- [ ] **#9: Discuss Baseline Comparison Limitations**
  - **Issue:** No head-to-head evaluation against other prompt-to-app frameworks or generic agent frameworks.
  - **Reviewer:** R2
  - **Current State:** Addressed in Benchmark Applicability paragraph (line 480)
  - **Optional Fix:** Could strengthen future work section
  - **Assignee:** _unassigned_

---

## Format Compliance Checklist

- [x] IEEE format (`\documentclass[10pt,conference]{IEEEtran}`)
- [ ] Page limit verification (10 pages + 2 for references)
- [x] English language
- [ ] IEEE Copyright form (pending camera-ready instructions)
- [ ] Final PDF validation with IEEE PDF eXpress

---

## How to Contribute

1. Pick an unassigned item and assign yourself
2. Create a branch: `fix/camera-ready-item-N`
3. Make changes and test compilation: `pdflatex paper.tex && bibtex paper && pdflatex paper.tex && pdflatex paper.tex`
4. Create PR referencing this file and the item number
5. Request review from paper authors

---

## References

- [SANER 2026 Industrial Track CFP](https://conf.researchr.org/track/saner-2026/saner-2026-industrial-track)
- [IEEE Conference Template](https://www.ieee.org/conferences/publishing/templates.html)
- Original reviews: See submission system

---

_Last updated: 2026-01-08 (fixes #1, #2, #4, #5 applied)_
