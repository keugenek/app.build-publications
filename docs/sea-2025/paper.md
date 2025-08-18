## Title
Production Reliability at Scale: Scaffolding Systems for Agentic Prompt-to-App Generation

### Authors and Affiliations
- Evgenii Kniazev [1]
- Arseny Kravchenko [1]
- Igor Rekun [1]
- Prof. Dr. Ivan Yamshchikov [2]
- Pranav Sah [2]
- Pratik Nichite [2]
- Dheena Dayalan [2]

[1] app.build (Neon, now at Databricks)
[2] THWS University of Applied Sciences Würzburg‑Schweinfurt (CAIRO)

Correspondence: <contact@your-domain.example>

Submission to: NeurIPS 2025 Workshop on Scaling Environments for Agents (SEA) — see website: [SEA Workshop @ NeurIPS 2025](https://sea-workshop.github.io/)

### Abstract
While AI coding agents demonstrate impressive capabilities, deploying them reliably in production remains challenging. We present app.build, an open-source prompt-to-app generator that demonstrates how extensive environment scaffolding transforms unreliable LLMs into production-ready software engineering agents. Our approach combines: (1) FSM-guided execution with actor-critic feedback loops, (2) multi-layered validation pipelines providing deterministic quality gates, and (3) tree-search within constrained action spaces. Through evaluation on X application generation tasks, we show that environment scaffolding improves success rates by Nx over naive unverified generation[a], with open-weights models achieving X% of closed-model performance when provided structured environments[b][c][d]. We suggest six design principles for production AI agents and demonstrate that thoughtful environment design matters more than raw model capability or prompt engineering for reliability. Our work bridges the gap between AI potential and production reality, providing both empirical insights and a complete reference implementation for the community.

### Keywords
AI agents; software environments; production systems; validation feedback; actor-critic architecture

### 1. Introduction
#### 1.1 The Production Reliability Gap
- LLMs excel at code snippets but fail at production applications [1,3]
- Existing benchmarks (HumanEval, MBPP) miss critical quality attributes [5,6]
- Trust and validation are bottlenecks for enterprise adoption [1,10]

#### 1.2 Our Approach: Environment Scaffolding for Production Readiness
- Core thesis: Reliability stems from systematic environment design, not just model capability [13]
- app.build: Open-source reference implementation combining software engineering principles with agentic architecture [14]
- Key insight: Treat app generation as a structured engineering task with verifiable checkpoints

#### 1.3 Contributions
- Empirical evidence that environment scaffolding improves reliability by x
- Six formalized design principles for production AI agents [13]
- Complete open-source framework with evaluation benchmark
- Analysis of open vs closed models in structured environments

### 2. Background and Related Work
#### 2.1 Agentic Software Engineering
- Repository-level: Devin, SWE-agent [7,41]
- Multi-agent: AgentCoder, MapCoder [22,25]
- Our distinction: De novo full-stack generation with production focus

#### 2.2 Code Generation and Evaluation
- Function-level: HumanEval, MBPP [5,6,42]
- Class-level: ClassEval [5]
- Our contribution: Complete application as unit of analysis

#### 2.3 Software Engineering for AI
- Traditional focus on model improvement vs system design
- Our perspective: Environment design as a first-class concern

### 3. Problem Setup and Contributions
- Setting: Prompt-to-app generation in production contexts with requirements for determinism, testability, and maintainability. Agents interact with a constrained environment (observations, actions, tools), advancing through verifiable checkpoints.
- Problem: Close the production reliability gap by embedding quality gates and recovery into the environment itself.
- Contributions:
  - A framework that couples FSM-guided orchestration with actor-critic validation.
  - A multi-layered validation stack and constrained action-space tree search.
  - An evaluation benchmark and ablations quantifying the impact of each layer.
  - Practical design principles for building production AI agents.

### 4. Method
#### 4.1 FSM-Guided Multi-Agent Orchestration
- Control flow: A Finite State Machine manages workflow (DRAFTING → GENERATING → VALIDATING) [17,18]
- Actor model: Universal stateless agents gain specialization via system prompt modifications, mirroring phases of the app development process

#### 4.2 Actor-Critic Validation Pipeline
- Concept: Validation pipeline as the Critic providing deterministic feedback [13]
- Validation layers:
  - L1: Static analysis (compilation, linting) [27]
  - L2: Unit/integration testing [28]
  - L3: E2E testing with Playwright [26]
- Feedback loop: Failures trigger targeted regeneration, not full restarts

#### 4.3 Context Engineering and Constraint Design
- Principle: Split the context — provide minimal necessary information [13,30]
- Tree search: Parallel exploration with early termination
- State management: Serializable state enables horizontal scaling

#### 4.4 Production Design Principles
1. Constraint breeds creativity (limited scope → reliability)
2. Validation as environment signal (not just pass/fail)
3. Stateless actors for scalability
4. Encapsulated context per generation step
5. Structured error recovery via FSM
6. Progressive validation (fail fast, fix precisely)

### 5. Experimental Setup
#### 5.1 Evaluation Framework
- Dataset: N prompts across a complexity spectrum
- Metrics:
  - Success rate (passes full validation)
  - Token efficiency
  - Validation pass rates by layer
  - Human evaluation rubric (Table 1) [27,38]

#### 5.2 Experimental Configurations
We designed four experimental configurations to systematically evaluate factors affecting app generation success rates:
Configuration 1: Technology Stack Comparison. We compared tRPC versus Python/NiceGUI stacks to establish baselines and assess scaffolding impact across different ecosystems.
Configuration 2: Model Architecture Analysis. Using the tRPC stack, we evaluated open versus closed foundation models. Claude Sonnet 4 served as the baseline coding model, compared against Qwen3-Coder-480B-A35B and GPT OSS 120B as open alternatives.
Configuration 3: Testing Framework Ablation. We conducted three ablation studies on the tRPC stack: (3a) disabled isolated Playwright UI smoke tests; (3b) additionally disabled ESLint checks; and (3c) further removed handlers tests, eliminating backend validation.
Configuration 4: Type Checking Impact. For the Python/NiceGUI stack, we disabled type checks to test the hypothesis that arbitrary validation checks in the feedback loop may be counterproductive rather than beneficial.
These configurations enable systematic analysis of technological, architectural, and validation factors influencing automated app generation performance.

#### 5.3 Prompt Dataset
The evaluation dataset comprises 30 prompts designed to assess system performance across diverse application development scenarios.
*Dataset Construction*. Evaluation prompts were generated through a blind testing protocol involving independent human contributors with no prior exposure to the app.build system architecture or generated outputs. Contributors developed tasks reflecting authentic development workflows from their professional experience, ensuring ecological validity while minimizing selection bias. To maintain feasibility within the experimental constraints, core framework developers subsequently filtered prompts requiring advanced integrations or AI capabilities beyond the system's scope.
*Data Processing*. Raw prompts underwent automated post-processing using LLMs to anonymize sensitive information and standardize linguistic structure. This normalization process preserved semantic content and task complexity while ensuring consistent evaluation conditions across all test cases.
*Reproducibility*. The complete prompt dataset and associated benchmark harness are publicly available in the project repository.

#### 5.4 Assessor Protocol and Checks
In order to assess the quality of generated apps, we run a checklist with ~10 smore tests by human evaluators.
Unless the majority of checks are PASS or WARN, we believe the application is functional with possible occasional FAILs.
As a result we calculate PASS as 1 point, WARN as 0.7 points and FAIL as 0 points and use these metrics to assign an overall score to the each generated application.

To make manual work manageable we define small, app.build‑specific checks with stable IDs. Assessors record PASS/FAIL/NA per prompt in Appendix Table A2. Full “how to” steps live in Appendix A.3.

Table below contains a complete set of checks we believe is enough to assess the application qiality from our personal experience that will be used for the evaluation: 
— Does the app open cleanly?
- Does the app reflect the user prompt on home and support the primary action?
- Can a user create a new entity successfully?
— Can a user open details and edit an entity?
- Does data persist across a hard reload?
— Do all primary clickable elements work without errors?
— Is the first load reasonably fast, with no obvious red flags?

See Appendix A.3 for detailed methods, exact pass criteria, and reporting rules (including the AB‑00 “clean start” preparation).

### 6. Results
#### 6.1 Environment Scaffolding Impact
- Primary finding: x success rate with full scaffolding
- Each validation layer contributes % improvement

#### 6.2 Open vs Closed Model Performance
- Closed models: 85% success with scaffolding
- Open models: 61% success (71% relative) [16,40]
- Key insight: Performance gap narrows significantly with more scaffolding
- Open models are viable for production with proper environment design

#### 6.3 Stack Analysis
- TypeScript/tRPC: Higher success rate (type safety benefits) [34,35]
- Python/NiceGUI: Lower token usage, more flexible [15]
- Trade-off between reliability and development velocity

#### 6.4 Failure Mode Analysis
- Context management (35% of failures)
- Tool calling precision (open models struggle more)
- Validation catches 78% of would-be runtime errors
- Human eval reveals maintainability issues even in "successful" apps [36]

### 7. Analysis and Ablations
- Error analyses, sensitivity to environment fidelity/diversity, and qualitative examples aligning with Section 6.4.

### 8. Limitations
- Currently limited to CRUD/data applications
- Validation pipeline requires domain expertise
- Future: Expand domains, analyze human-in-the-loop feedback and performance in the wild

### 9. Broader Impact
- Democratizes application development
- Reduces barrier to entry for non-programmers
- Open approach enables transparency and trust [40]

### 10. Conclusion
We demonstrated that production-ready AI agents require extensive environment scaffolding beyond model capabilities. app.build shows that combining software engineering principles with agentic architectures enables reliable application generation. Our open-source implementation and evaluation framework provide a foundation for the community to build upon. As AI agents mature, the field must shift focus from model scaling to system design—the path to production runs through principled engineering, not just larger models.

### Acknowledgments
This submission is prepared in collaboration between app.build (Neon, now Databricks) and THWS University of Applied Sciences Würzburg‑Schweinfurt (CAIRO). 

### References
- [1] A. Roychoudhury, C. Păsăreanu, M. Pradel, and B. Ray, “Agentic AI Software Engineers: Programming with Trust,” arXiv preprint arXiv:2502.13767, 2025. [Online]. Available: https://arxiv.org/abs/2502.13767
  
- [2] I. K. Schieferdecker, “Augmenting software engineering with AI and developing it further towards AI-assisted model-driven software engineering,” arXiv preprint arXiv:2409.18048, 2025. [Online]. Available: https://arxiv.org/abs/2409.18048
  
- [3] X. Du, M. Liu, K. Wang, H. Wang, J. Liu, Y. Chen, J. Feng, C. Sha, X. Peng, and Y. Lou, “Evaluating Large Language Models in Class-Level Code Generation,” in Proc. IEEE/ACM 46th Int. Conf. Software Engineering (ICSE), Lisbon, Portugal, 2024, pp. 81:1–81:13. doi: 10.1145/3597503.3639219
  
- [4] S. Cohen, “HumanEval: The Most Inhuman Benchmark for LLM Code Generation,” Medium, Mar. 9, 2025. [Online]. Available: https://shmulc.medium.com/humaneval-the-most-inhuman-benchmark-for-llm-code-generation-0386826cd334
  
- [5] H. Li, H. Zhang, and A. E. Hassan, “The Rise of AI Teammates in Software Engineering (SE) 3.0: How Autonomous Coding Agents Are Reshaping Software Engineering,” arXiv preprint arXiv:2507.15003, 2025. [Online]. Available: https://arxiv.org/abs/2507.15003
  
- [6] H. Suh, M. Tafreshipour, J. Li, A. Bhattiprolu, and I. Ahmed, “An Empirical Study on Automatically Detecting AI-Generated Source Code: How Far Are We?,” arXiv preprint arXiv:2411.04299, 2024. [Online]. Available: https://arxiv.org/abs/2411.04299
  
- [7] A. Masood, “Security Analysis and Validation of Generative-AI-Produced Code,” Medium, May 9, 2025. [Online]. Available: https://medium.com/@adnanmasood/security-analysis-and-validation-of-generative-ai-produced-code-d4218078bd63
  
- [8] A. Kravchenko, “Six Principles for Production AI Agents,” Neon Blog, Jul. 2025. [Online]. Available: https://neon.tech/blog/six-principles-for-production-ai-agents
  
- [9] D. Gomes, “app.build: An Open-Source AI Agent That Builds Full-Stack Apps,” Neon Blog, Jun. 2025. [Online]. Available: https://neon.com/blog/app-build-open-source-ai-agent
  
- [10] A. Kravchenko, D. Gomes, and P. Figueiredo, “app.build Can Now Build Python Data Apps,” Neon Blog, Jul. 2025. [Online]. Available: https://neon.tech/blog/app-build-can-now-build-python-data-apps
  
- [11] J. Manchanda, L. Boettcher, M. Westphalen, and J. Jasser, “The Open Source Advantage in Large Language Models (LLMs),” arXiv preprint arXiv:2412.12004, 2025. [Online]. Available: https://arxiv.org/abs/2412.12004
  
- [12] D. Huang, J. M. Zhang, M. Luck, Q. Bu, Y. Qing, and H. Cui, “AgentCoder: Multi-Agent-based Code Generation with Iterative Testing and Optimisation,” arXiv preprint arXiv:2312.13010, 2024. [Online]. Available: https://arxiv.org/abs/2312.13010
  
- [13] A. Kravchenko, I. Rekun, and E. Kniazev, “Design Decisions Behind app.build, a Prompt-to-App Generator,” Neon Blog, Jun. 2025. [Online]. Available: https://neon.tech/blog/design-decisions-behind-app-build
  
- [14] M. A. Islam, M. E. Ali, and M. R. Parvez, “MapCoder: Multi-Agent Code Generation for Competitive Problem Solving,” arXiv preprint arXiv:2405.11403, 2024. [Online]. Available: https://arxiv.org/abs/2405.11403
  
- [15] Context Engineering: A Guide With Examples. DataCamp, 2025. 32-33. Open Models by OpenAI. OpenAI/Azure Documentation, 2025. 34-35. tRPC: End-to-end Typesafe APIs. tRPC Documentation, 2025. {Placeholder}
  
- [16] S. A. Licorish, A. Bajpai, C. Arora, F. Wang, and K. Tantithamthavorn, “Comparing Human and LLM Generated Code: The Jury is Still Out!,” arXiv preprint arXiv:2501.16857, 2025. [Online]. Available: https://arxiv.org/abs/2501.16857
  
- [17] Labelbox, “Rubric evaluations: Fueling the next wave of reinforcement learning,” Labelbox Blog, May 2025. [Online]. Available: https://labelbox.com/blog/rubric-evals-fuel-next-wave-of-reinforcement-learning-rl
  
- [18] Open Source AI in Production. GitHub Blog, 2025. {Placeholder}
  
- [19] A. Kumar, Y. Bajpai, S. Gulwani, G. Soares, and E. Murphy-Hill, “Sharp Tools: How Developers Wield Agentic AI in Real Software Engineering Tasks,” arXiv preprint arXiv:2506.12347, 2025. [Online]. Available: https://arxiv.org/abs/2506.12347
  
- [20] Top Benchmarks for LLM Code Generation. Reddit/Community, 2025. {Placeholder}

### Appendix
Add additional experiments, extended proofs, dataset cards, implementation details, and extra qualitative examples here.

#### A.1 Prompt Dataset (Full List)
The table below enumerates the full prompt set used in the benchmark, with short summaries and provenance/obfuscation notes. The canonical prompt texts and loader live in the repository (see
[Benchmark prompts (agent/benchmark.py:L71)](https://github.com/appdotbuild/agent/blob/0df56e8ca70a8fa669caf7710e5a387fe9e2feac/agent/benchmark.py#L71)).

| ID    | Prompt (summary)                               |

Note: This is a placeholder view for layout. The final camera‑ready will include the complete table populated from the benchmark source.

#### A.2 Assessor Checklist (Template)
Record PASS/FAIL/NA for each prompt and check. Use the Notes column for brief context or defect links.

| ID    | AB-00 Reset | AB-01 Boot | AB-02 Prompt | AB-03 Create | AB-04 View/Edit | AB-05 Refresh | AB-06 Auth | AB-07 Forms | AB-08 Clicks | AB-09 Perf | AB-10 2nd Load | AB-11 Usability | Notes |
|-------|-------------|------------|--------------|--------------|------------------|---------------|------------|-------------|--------------|------------|----------------|------------------|-------|
| P-001 |             |            |              |              |                  |               |            |             |              |            |                |                  |       |
| P-002 |             |            |              |              |                  |               |            |             |              |            |                |                  |       |

#### A.3 Assessor Protocol Details (app.build‑specific)
This appendix section provides atomic, app.build‑specific methods, pass criteria, and reporting rules for each check. Report PASS/FAIL/NA in Table A.2.

- AB‑00 Setup & Reset (≈1 minute)
  - Method: Quit Chrome. Relaunch with incognito mode. If present, run `./scripts/reset_env.sh` from the app `source_code` directory.
  - Notes: If you see common setup issues (Bind for 0.0.0.0:80 failed: port is already allocated; or The container name "/postgres" is already in use by container), re‑run the reset script once; do not report failure.

- AB‑01 Boot & Home
  - Method: Navigate to `http://localhost`.
  - Criteria: PASS if page renders and Console shows 0 errors; WARN if page renders with Console errors (attach first error); FAIL if page does not render.
  - Stop rule: If AB‑01 is FAIL, stop after recording AB‑00 - AB‑02 (smoke set). Mark remaining checks NA.

- AB‑02 Prompt to app correspondence
  - Method: Navigate to `http://localhost`, find and execute main action.
  - Criteria: PASS if app reflects user prompt; WARN if no way to find and execute primary action in 30s, FAIL if application is generic or template with no correspondence to user prompt.
  - Stop rule: If AB‑01 is FAIL, stop after recording AB‑00 - AB‑02 (smoke set). Mark remaining checks NA.

- AB‑03 Create
  - Method: From the main entity form, fill valid fields; submit.
  - Criteria: Success toast/indicator appears; no Console errors.

- AB‑04 View/Edit
  - Method: Open detail/edit; change one field; save.
  - Criteria: Success indicator; updated value visible in detail and list.

- AB‑05 Refresh
  - Method: Hard refresh (Ctrl/Cmd+Shift+R).
  - Criteria: Data persists; if app declares in‑memory storage, mark NA with note.

- AB‑06 Clickable Sweep
  - Method: Systematically click all visible primary clickable elements across main pages (nav links, primary/secondary buttons, list rows, tabs). Avoid clearly destructive actions; if confirmation appears, confirm once.
  - Criteria: No navigation errors; no 404/5xx on route changes; no unhandled Console errors; target routes/components render.

- AB‑07 Performance (quick)
  - Method: Run Lighthouse once on home (Mobile). Note Performance and Best Practices.
  - Criteria: Record performance score.


---

Notes for authors (to be removed before submission):
- Keep the layout and sectioning aligned with NeurIPS guidelines (≤ 9 content pages for main text in the LaTeX template; references/appendix excluded).
- When converting to LaTeX later, map headings and citations to the official NeurIPS 2025 style.
- Place figures in `docs/sea-2025/assets/figures/` and tables/data in `docs/sea-2025/assets/tables/`.

### Author Notes (internal; translate and track)
- [a] Looks like we need to ask students or ourselves to one-shot apps to compare with the naive approach.
- [e] Not matching the original post — to be updated by @arseni.kravchenko@databricks.com. Assigned.
- [f] We need better references; this is mostly weak. Assigned to @igor.rekun@databricks.com.
- [g] Need a very short TL;DR on meta-agent by @igor.rekun@databricks.com. Assigned.
- [h] There is a lot of clutter here; we will need to rewrite about half.
