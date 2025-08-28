# Scaling Environments for Code Generation Agents: A Production Framework for Agentic Prompt-to-App Generation

## Abstract

We present app.build, an open-source framework that improves LLM-based application generation through systematic validation and structured environments. Our approach combines multi-layered validation pipelines, stack-specific orchestration, and model-agnostic architecture, implemented across reference stacks (TypeScript/tRPC, Python/NiceGUI (beta), PHP/Laravel (beta)). Through evaluation on 30 generation tasks, we demonstrate that comprehensive validation achieves 70% viability rate with 30% reaching perfect quality scores, while open-weights models achieve 80.8% of closed-model performance when provided structured environments. The open-source framework has been adopted by the community, with over 3,000 applications generated to date. This work demonstrates that scaling reliable AI agents requires scaling environments, not just models—providing empirical insights and complete reference implementations for production-oriented agent systems.

**Keywords**: AI agents; software environments; production systems; validation feedback; actor-critic architecture

## 1. Introduction

### 1.1 The Production Reliability Gap
While AI coding agents demonstrate impressive capabilities on standard benchmarks of isolated tasks like HumanEval [20] and MBPP [21], relying on them to build production-ready applications without human supervision remains infeasible. Recent repository-level systems such as Devin [3] and SWE-agent [4] represent significant advances, yet their performance on real-world software engineering tasks reveals a substantial gap between research benchmarks and production requirements.

This gap manifests across multiple dimensions. Function-level benchmarks like HumanEval evaluate isolated code generation but fail to capture system-level concerns including error handling, integration complexity, and production constraints [5]. Even state-of-the-art systems like AutoCodeRover, achieving 19% efficacy on SWE-bench at $0.43 per issue [6], demonstrate that raw model capability alone is insufficient for reliable automated software development.

The core challenge lies in treating LLMs as standalone systems rather than components requiring structured environments. Current approaches predominantly focus on making models "smarter" via either training or prompt engineering, but this paradigm fails to address fundamental reliability issues inherent in probabilistic generation. As noted in recent comprehensive surveys [7,8], the field requires a shift in perspective from model-centric to environment-centric design.

### 1.2 Our Approach: Environment Scaffolding

We propose **environment scaffolding** as an environment-first approach complementing prompt engineering, focusing on action-space design and agent integration. Environment scaffolding provides structured constraints, contextual information, and deterministic validation feedback loops that enable consistent quality in LLM-generated applications through structured task formulation and validation infrastructure. Unlike approaches that attempt to improve model reasoning through prompting, our method creates safe environments where models can detect errors earlier and recover systematically with lesser risk of harming the host system and reducing the risk of unpredicted generated code behavior.

Our approach operates on three core principles. First, **structured environment design** provides explicit constraints and contextual information, reducing the generation search space while maintaining flexibility. Second, **multi-layered validation pipelines** implement deterministic quality gates with stack-specific checks, creating iterative validation cycles that catch errors early. Third, **model-agnostic architecture** decouples environment scaffolding from LLM choice, enabling consistent quality assurance across different foundation models.

We implement this approach through app.build, an open-source framework featuring multiple production stacks (TypeScript/tRPC and beta stacks Python/NiceGUI, PHP/Laravel) with comprehensive validation pipelines. Our architecture combines BaseActor tool-calling patterns, AST-based anti-pattern detection, and finite state machine orchestration to ensure generated applications meet production standards. While our current implementation focuses on CRUD-oriented web applications, the environment scaffolding approach demonstrates that structured validation pipelines can be adapted to diverse programming paradigms and frameworks with reasonable effort.

### 1.3 Contributions

Our work contributes to scaling environments for agents through:

- **Environment Infrastructure**: Open-source framework with reference web stacks demonstrating structured action-space design and tool integration for code generation agents.
- **Empirical Evaluation**: Analysis of 30 generation tasks showing specific validation layers' impact on success rates, with ablation studies revealing environment scaffolding effects across model architectures.
- **Methodological Insights**: We demonstrate that thoughtful environment design matters more than raw model capability for production reliability.
- **Community Adoption**: The framework has been adopted by the open-source community, validating the practical utility of environment-first design for AI agents, with over 3,000 applications generated by independent users.

## 2. Background and Related Work

### 2.1 Agentic Software Engineering

The evolution of AI coding agents has progressed from simple code completion to autonomous software engineering systems capable of repository-level modifications. **SWE-bench** [9] established the gold standard for evaluating repository-level understanding with 2,294 real GitHub issues from 12 Python projects. The accompanying **SWE-agent** [4] demonstrated that custom agent-computer interfaces significantly enhance performance, achieving 12.5% pass@1 through careful interface design rather than model improvements.

Repository-level agents have emerged as a distinct research direction. **WebArena** [1] revealed that even GPT-4 achieves only 14.41% success versus 78.24% human performance in realistic environments, demonstrating that environment design matters more than model capability. **GAIA** [10] reinforces this with 92% human versus 15% GPT-4 performance on practical tasks. **AutoCodeRover** [6] combines LLMs with spectrum-based fault localization, achieving 19% efficacy on SWE-bench at $0.43 per issue. More recently, **Agentless** [11] challenged complex agent architectures with a simple three-phase process (localization, repair, validation) achieving 32% on SWE-bench Lite at $0.70 cost, suggesting that sophisticated architectures may not always improve performance.

**Multi-agent systems** have consistently outperformed single-agent approaches. **AgentCoder** [12] employs a three-agent architecture (Programmer, Test Designer, Test Executor) achieving 96.3% pass@1 on HumanEval with GPT-4, compared to 71.3% for single-agent approaches. **MapCoder** [13] extends this with four specialized agents replicating human programming cycles, achieving 93.9% pass@1 on HumanEval and 22.0% on the challenging APPS benchmark. **MetaGPT** [14] demonstrates role-based agents communicating through structured documents, achieving 85.9% pass@1 on HumanEval with 100% task completion on software development tasks.

### 2.2 Production Quality in Generated Code

Ensuring production-ready AI-generated code requires validation approaches beyond simple correctness testing. **Static analysis integration** has shown promise, with intelligent code analysis agents combining GPT-3/4 with traditional static analysis to reduce false-positive rates from 85% to 66%. **Testing frameworks** have evolved to address AI-specific challenges. Test-driven approaches like TiCoder achieve 45.97% absolute improvement in pass@1 accuracy through interactive generation. Property-based testing frameworks show 23.1-37.3% relative improvements over established TDD methods by generating tests that capture semantic properties rather than specific implementations.

**AST-based validation** provides structural correctness guarantees. AST-T5 leverages Abstract Syntax Trees for structure-aware analysis, outperforming CodeT5 by 2-3 points on various tasks. Industry deployment reveals gaps between offline performance and practical usage. CodeAssist collected 2M completions from 1,200+ users over one year, revealing significant discrepancies between benchmark performance and real-world usage patterns.

### 2.3 Tree Search and Runtime Isolation

Tree search enhances LLM-based solutions and serves as a way to increase compute budget beyond internal model reasoning token budget. The closest approach is used by Li et al. in S* Scaling [15] by combining iterative feedback with parallel branches taking different paths toward solving the problem. Sampling more trajectories increases success rate significantly, which is evident by difference in pass@1 and pass@3 often by 30% or more.

Sandboxing is cornerstone due to web applications requiring much more elaborate testing than running unit tests. It includes setup and teardown of databases and browser emulation. To run that in parallel we opted for Dagger.io for its caching capabilities and compatibility with Docker.

## 3. Problem Setup and Method

### 3.1 Problem Formulation

LLM-based code generation enables rapid prototyping but often produces code that does not meet production standards. We formalize this as an environment design problem where success depends not just on model capability but on the structured constraints and validation feedback provided by the generation environment.

### 3.2 Architecture

#### 3.2.1 Meta-Components

**BaseActor**: A model-agnostic agent implementing core operations (file I/O, code editing, task completion) through tool calling. Stack-specific extensions augment functionality (e.g., dependency management via `uv add` for Python). The completion mechanism triggers stack-specific validation pipelines. Following R-tuning principles [17], our system prompts explicitly address parametric knowledge gaps in stack-specific domains, enabling appropriate uncertainty handling rather than hallucinated patterns.

**Tree Search**: General data structure enabling autonomous error recovery through environment feedback. Nodes contain LLM completions, performed actions, and evaluation results from validation checks. When validation fails, agents can backtrack and explore alternative generation paths, learning from environment feedback rather than requiring human intervention. This creates a feedback loop where validation results guide autonomous exploration, representing a step toward fully autonomous coding agents that improve through environmental interaction rather than static prompting.

**Runtime Infrastructure**: Dagger engine is used to provide isolated sandboxes due to its caching mechanism naturally fitting tree searches since child node will share environment of the parent making backtracking essentially free. On top of sandbox workspaces we also use dagger to serve dependencies such as databases as well as run playwright tests.

**AST-based Validation**: We employ `ast-grep` for pattern-based code analysis, identifying common anti-patterns in generated code (e.g., silent failures, improper error propagation) that distinguish superficially correct code from production-ready implementations.

#### 3.2.2 Stack-Specific Components

**Generation Flow**: Each stack implements a finite state machine orchestrating the generation process. The TypeScript/tRPC stack follows a sequential pipeline: data models → API interfaces → backend handlers → frontend components. The Python/NiceGUI and PHP/Laravel stacks employ two-phase approach: data models → API/UI implementation.

**Templates**: Stack-specific templates provide initial application scaffolding, reducing generation overhead while embedding universal smoke tests and health checks into the validation pipeline.

**Validation Pipeline**: Stack-specific validation implements hierarchical checks ordered by computational cost and diagnostic value. Compilation verification precedes integration testing; static analysis gates dynamic testing. This design minimizes computational overhead while maximizing error detection coverage.

## 4. Experimental Setup

### 4.1 Evaluation Framework

- **Dataset**: 30 prompts spanning a complexity spectrum (low: static/single-page UI; medium: single-entity CRUD; high: multi-entity/custom logic).
- **Metrics**:
  - Viability rate (V=1) and non-viability rate (V=0)
  - Perfect quality rate (Q=10) and quality distribution (mean/median for V=1 apps)
  - Validation pass rates by check (AB-01, AB-02, AB-03, AB-04, AB-06, AB-07)
  - Quality scores (Q, 0–10) using the rubric in §4.4
  - Model/cost comparisons where applicable

### 4.2 Experimental Configurations

We designed three experimental configurations to systematically evaluate factors affecting app generation success rates:

**Configuration 1: Baseline**. We generated baseline tRPC apps with default production setup and all checks ON to assess default generation success rate, cost and time.

**Configuration 2: Model Architecture Analysis**. Using the tRPC stack, we evaluated open versus closed foundation models. Claude Sonnet 4 served as the baseline coding model, compared against Qwen3-Coder-480B-A35B [16] and GPT OSS 120B [17] as open alternatives.

**Configuration 3: Testing Framework Ablation**. We conducted three ablation studies on the tRPC stack: (3a) disabled isolated Playwright UI smoke tests; (3b) additionally disabled ESLint checks; and (3c) further removed handlers tests, eliminating backend validation.

### 4.3 Prompt Dataset

The evaluation dataset comprises 30 prompts designed to assess system performance across diverse application development scenarios. Evaluation prompts were generated through a blind testing protocol involving independent human contributors with no prior exposure to the app.build system architecture. Contributors developed tasks reflecting authentic development workflows from their professional experience. Raw prompts underwent automated post-processing using LLMs to anonymize sensitive information and standardize linguistic structure.

### 4.4 Assessor Protocol and Scoring

To systematically assess generated application quality, we implement a structured evaluation protocol comprising six standardized functional checks executed by human assessors. The evaluation reports two independent outcomes: a binary viability indicator (V) and a 0–10 quality score (Q).

**Viability (binary)**:
```
V = 1 if AB-01 and AB-02 are not FAIL; otherwise V = 0
```

**Quality (0–10)**:
```
Q = 10 × (∑_{c∈A} w × s_c) / (∑_{c∈A} w)
```

where A is the set of applicable checks (excluding NA); all checks use equal weights prior to NA re-normalization; and per-check grades s_c are mapped as follows:
- AB-01 (Boot): PASS = 1.0, WARN = 0.5, FAIL = 0.0
- AB-02 (Prompt correspondence): PASS = 1.0, WARN = 0.5, FAIL = 0.0
- AB-03, AB-04, AB-06 (Clickable Sweep): PASS = 1.0, WARN = 0.5, FAIL = 0.0
- AB-07 (Performance): continuous metric normalized to [0,1]

**Table 1: Check Weights (Equal Share)**

| Check ID | Check Description | Weight (share) | Notes |
|----------|-------------------|----------------|-------|
| AB-01 | Boot & Home | 1/6 | Hard gate for Viability V |
| AB-02 | Prompt Correspondence | 1/6 | Hard gate for Viability V |
| AB-03 | Create Functionality | 1/6 | |
| AB-04 | View/Edit Operations | 1/6 | |
| AB-06 | Clickable Sweep | 1/6 | |
| AB-07 | Performance Metrics | 1/6 | Continuous (normalized) |

## 5. Results

### 5.1 Environment Scaffolding Impact (tRPC only)

Evaluating 30 TypeScript/tRPC applications, we observe that 70.0% (21/30) achieved viability (V=1), with 30.0% attaining perfect quality (Q=10) and 30.0% non-viable (V=0). Once viability criteria are met, generated applications exhibit consistently high quality.

**Table 2: Aggregated Evaluation Results (tRPC)**

| Metric | Value | Key Insight |
|--------|-------|-------------|
| Total Applications | 30 | TypeScript/tRPC stack only |
| Viability Rate (V=1) | 70.0% | 21/30 viable applications |
| Perfect Quality (Q=10) | 30.0% | 9/30 fully compliant applications |
| Non-viable (V=0) | 30.0% | 9/30 failed smoke tests |
| Mean Quality (V=1 apps) | ≈ 8.78 | High quality when viable |

**Table 3: Check-Specific Pass Rates (tRPC)**

| Check | Pass | Warn | Fail | NA | Pass Rate (excl. NA) |
|-------|------|------|------|----|-----------------------|
| AB-01 (Boot) | 25 | 2 | 3 | 0 | 83.3% |
| AB-02 (Prompt) | 19 | 3 | 5 | 3 | 70.4% |
| AB-03 (Create) | 22 | 2 | 0 | 6 | 91.7% |
| AB-04 (View/Edit) | 17 | 1 | 1 | 11 | 89.5% |
| AB-06 (Clickable Sweep) | 20 | 4 | 1 | 5 | 80.0% |
| AB-07 (Performance) | 23 | 3 | 0 | 4 | 88.5% |

Smoke tests (AB-01, AB-02) determine viability. Among viable applications (V=1, n=21), quality averaged 8.78 with 77.3% achieving Q≥9. Non-viability (V=0) arises from smoke test failures or missing artifacts.

### 5.2 Open vs Closed Model Performance

We evaluated Claude Sonnet 4 against two open-weights models using the TypeScript/tRPC stack with full validation pipelines. Claude achieved 86.7% success rate, establishing our closed-model baseline at $110.20 total cost. Qwen3-Coder-480B-A35B reached 70% success rate (80.8% relative performance) while GPT OSS 120B managed only 30% success rate. Both open models were accessed via OpenRouter, resulting in significantly lower costs: $12.68 for Qwen3 and $4.55 for GPT OSS.

The performance gap reveals that environment scaffolding alone cannot eliminate the need for capable foundation models. However, leading open-weights models like Qwen3 demonstrate that structured environments can enable production-viable performance at substantially reduced costs. The 9x cost reduction for 19% performance loss represents a viable tradeoff for cost-sensitive deployments.

Operational characteristics differed notably between model types. Open models required more validation retries, evidenced by higher LLM call counts (4,359 for Qwen3, 4,922 for GPT OSS vs 3,413 for Claude). Healthcheck pass rates (86.7% for Qwen3 vs 96.7% for Claude) indicate that open models generate syntactically correct code but struggle more with integration-level correctness, emphasizing the importance of comprehensive validation pipelines for open-weights deployments.

### 5.3 Ablation Studies: Impact of Validation Layers

To understand how each validation layer contributes to application quality, we conducted controlled ablations on the same 30-prompt cohort. Each ablation removes one validation component while keeping others intact.

**Baseline Performance** (all validation layers active):
- Viability: 73.3% (22/30 apps pass both AB-01 Boot and AB-02 Prompt)
- Mean Quality: 8.06 (among all 30 apps)

**Finding 1: Removing Unit Tests Trades Quality for Viability**
- Viability: 80.0% (+6.7 pp) — fewer apps fail smoke tests
- Mean Quality: 7.78 (−0.28) — quality degrades despite higher viability
- Key degradations: AB-04 View/Edit drops from 90% to 60% pass rate (−30 pp)
- Interpretation: Backend tests catch critical CRUD errors. Without them, apps boot successfully but fail on data operations.

**Finding 2: Removing Linting Has Mixed Effects**
- Viability: 80.0% (+6.7 pp)
- Mean Quality: 8.25 (+0.19) — slight improvement
- Trade-offs: AB-03 Create drops 8.3 pp, AB-04 View/Edit drops 7.6 pp
- Interpretation: ESLint catches legitimate issues but may also block valid patterns. The performance gain suggests some lint rules may be overly restrictive.

**Finding 3: Removing Playwright Tests Significantly Improves Outcomes**
- Viability: 90.0% (+16.7 pp) — highest among all configurations
- Mean Quality: 8.62 (+0.56) — meaningful quality improvement
- Broad improvements: AB-02 Prompt +11.8 pp, AB-06 Clickable +5.7 pp
- Interpretation: Playwright tests appear overly brittle for scaffolded apps. Many apps that fail E2E tests actually work correctly for users. The 36 improved vs 6 regressed cases for AB-02 support this interpretation.

### 5.4 Synthesis: Optimal Validation Strategy

Our ablation results reveal clear trade-offs in validation design:

**Validation Layer Impact Summary**:
1. **Unit/Handler Tests**: Essential for data integrity. Removing them increases perceived viability but causes real functional regressions (especially AB-04 View/Edit).
2. **ESLint**: Provides modest value with some false positives. The small quality impact (+0.19) and mixed per-dimension effects suggest selective application.
3. **Playwright/E2E**: Currently causes more harm than good. The +16.7 pp viability gain and quality improvements indicate these tests reject too many working applications.

**Recommended Validation Architecture**:
Based on these findings, we recommend:
- **Keep**: Lightweight smoke tests (boot + primary route), backend unit tests for CRUD operations
- **Refine**: ESLint with curated rules focusing on actual errors vs style preferences
- **Replace**: Full E2E suite with targeted integration tests for critical paths only

This pragmatic approach balances catching real defects while avoiding false rejections of functional applications. Importantly, when quality is paramount and compute budget less constrained (our experimental budget was capped), comprehensive validation including strict E2E tests remains a viable strategy—trading lower success rates for guaranteed production quality.

### 5.5 Failure Mode Analysis

Observed failure modes in tRPC runs cluster into categories:

- **Boot/Load failures**: template placeholders or incomplete artifacts
- **Prompt correspondence failures**: generic template likely because of generation failure
- **CSP/security policy restrictions**: blocked images or media by default policies
- **UI interaction defects**: unbound handlers, non-working controls
- **State/integration defects**: data not persisting across refresh; broken filters; login issues
- **Component misuse**: runtime exception due to incorrect component composition

These defects align with our layered pipeline design: early gates catch non-viable builds, while later gates expose interaction/state issues before human evaluation.

### 5.6 Prompt Complexity and Success Rate

We categorize prompts along a simple rubric and analyze success impacts:

- **Low complexity**: static or single-page UI tasks (e.g., landing pages, counters)
- **Medium complexity**: single-entity CRUD without advanced flows or auth
- **High complexity**: multi-entity workflows, custom logic, or complex UI interactions

Empirically, medium-complexity CRUD prompts achieve the highest quality (Q=9–10 typical), reflecting strong scaffolding for data models and handlers. Low-complexity UI prompts are not uniformly "easy": several became non-viable (V=0) by failing prompt correspondence (AB-02) with generic templates. High-complexity prompts show lower viability rates due to interaction wiring and state-consistency issues surfaced by AB-04/AB-06.

## 6. Discussion

### 6.1 Limitations

Our current framework is limited to CRUD-oriented data applications, focusing on structured workflows with well-defined input-output expectations. While effective for common web application patterns, it does not yet support complex systems or advanced integrations. The validation pipeline, though comprehensive, relies on domain-specific heuristics and expert-defined anti-patterns, which may not generalize to novel or edge-case designs. Additionally, our human evaluation protocol, while rigorous, is poorly scalable and constrained by subjectivity in assessing maintainability and user experience nuances.

### 6.2 Broader Impact

The AI agent boom is accelerating, but real industry deployments often fail silently. Without environment scaffolding, we risk massive overengineering of AI models while ignoring the real bottleneck. App.build represents a shift from model-centric to system-centric AI engineering—a critical step toward scaling reliable agent environments. As emphasized in Machine Learning System Design with End-to-End Examples [18], production AI systems only become effective when development integrates not just model performance, but core software engineering principles. By open-sourcing both the framework and evaluation protocol, we provide a reproducible, transparent foundation for building and benchmarking agent environments at scale.

## 7. Conclusion

Our results demonstrate that raw model capability alone cannot bridge the gap between AI potential and production reality. Through systematic environment scaffolding, multi-layered validation, and stack-specific orchestration, app.build transforms probabilistic language models into dependable software engineering agents.

Ablations indicate clear trade-offs across validation layers: removing unit/handlers tests increases apparent viability but reduces CRUD/view-edit correctness; removing linting yields small viability/performance gains with modest quality regressions; removing Playwright smoke improves viability and observed quality, likely by eliminating flaky UI checks for scaffolded apps. Together, these results support a pragmatic stance: retain minimal, targeted smoke to guarantee boot and primary flows; keep structural checks (lint) to preserve UI/code consistency; and scope E2E to a "golden path" to avoid false negatives while still catching session/flow breakage.

We conclude that the path to reliable, production-ready AI agents lies not in better prompts or bigger models, but in principled, scalable environment engineering, with validation layers tuned to maximize developer-visible value while minimizing brittleness.

## Acknowledgments

This submission is prepared in collaboration between app.build (Databricks - app.build team) and THWS University of Applied Sciences Würzburg-Schweinfurt (CAIRO). We thank the app.build community for their contributions and feedback. Special thanks to Databricks executive team for supporting the open-source initiative.

## References

[1] Zhou, S., et al. (2024). WebArena: A Realistic Web Environment for Building Autonomous Agents. ICLR.

[2] Merrill, M., et al. (2024). Terminal-Bench: A Benchmark for AI Agents in Terminal Environments.

[3] Cognition Labs. (2024). SWE-bench Technical Report. https://cognition.ai/blog/swe-bench-technical-report

[4] Yang, J., et al. (2024). SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering. arXiv:2405.15793

[5] Liu, J., et al. (2023). Is Your Code Generated by ChatGPT Really Correct? Rigorous Evaluation of Large Language Models for Code Generation. arXiv:2305.01210

[6] Zhang, Y., et al. (2024). AutoCodeRover: Autonomous Program Improvement. arXiv:2404.05427

[7] Jiang, J., et al. (2024). A Survey on Large Language Models for Code Generation. arXiv:2406.00515.

[8] Paul, D. et al. (2024). Benchmarks and Metrics for Evaluations of Code Generation: A Critical Review. arXiv:2406.12655

[9] Jimenez, C., et al. (2024). SWE-bench: Can Language Models Resolve Real-World GitHub Issues? arXiv:2310.06770.

[10] Mialon, G., et al. (2023). GAIA: A Benchmark for General AI Assistants. ICLR.

[11] Xia, C. S., et al. (2024). Agentless: Demystifying LLM-based Software Engineering Agents. arXiv:2407.01489.

[12] Huang, D., et al. (2023). AgentCoder: Multi-Agent-based Code Generation with Iterative Testing and Optimisation. arXiv:2312.13010

[13] Islam, M. A., et al. (2024). MapCoder: Multi-Agent Code Generation for Competitive Problem Solving. arXiv:2405.11403.

[14] Hong, S., et al. (2023). MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework. arXiv:2308.00352.

[15] Li, et al. (2025). S*: Test Time Scaling for Code Generation. arXiv:2502.14382.

[16] Qwen Team. (2025) Qwen3 Technical Report. arXiv:2505.09388.

[17] OpenAI. (2025). gpt-oss-120b & gpt-oss-20b Model Card. arXiv:2508.10925.

[18] Babushkin, V. & Kravchenko, A. (2025). Machine Learning System Design with End-to-End Examples. Manning Publications. ISBN: 9781633438750.

[19] Zhang, R., et al. (2023). R-Tuning: Instructing Large Language Models to Say 'I Don't Know'. arXiv:2311.09677.

[20] Chen, M., et al. (2021). Evaluating Large Language Models Trained on Code. arXiv:2107.03374.

[21] Austin, J., et al. (2021). Program synthesis with large language models. arXiv:2108.07732.


## Appendix

### A.1 Prompt Dataset (Full List)

| ID | Prompt (summary) | Complexity |
| --- | --- | --- |
| plant-care-tracker | Track plant conditions using moods with custom rule-based logic. No AI/ML/APIs. | Medium |
| roommate-chore-wheel | Randomly assigns chores weekly and tracks completion. | Medium |
| car-maintenance-dashboard | Monitor car maintenance history and upcoming service dates. | Medium |
| city-trip-advisor | Suggest tomorrow's trip viability based on weather forecast API. | High |
| currency-converter | Convert currency amounts using Frankfurter API. | Low |
| book-library-manager | Manage book library with CRUD operations, search, and filters. | Medium |
| wellness-score-tracker | Input health metrics, get daily wellness score with trends. | High |
| event-tracker | Basic event tracker with add, view, delete functionality. | Low |
| daily-pattern-visualizer | Log and visualize daily patterns (sleep, work, social time). | High |
| pantry-inventory-app | Track pantry items, expiry notifications, AI recipe suggestions. | High |
| home-lab-inventory | Catalog home lab infrastructure (hardware, VMs, IP allocations). | High |
| basic-inventory-system | Small business inventory with stock in/out transactions. | Medium |
| pastel-blue-notes-app | Notes app with pastel theme, folders, user accounts. | Medium |
| teacher-question-bank | Question bank with quiz generation and export features. | High |
| beer-counter-app | Single-page beer counter with local storage. | Low |
| plumbing-business-landing-page | Professional landing page for lead generation. | Low |
| kanji-flashcards | Kanji learning with SRS, progress tracking, JLPT levels. | High |
| bookmark-management-app | Save, tag, organize links with search and sync. | Medium |
| personal-expense-tracker | Log expenses, categories, budgets, spending visualization. | Medium |
| gym-crm | Gym CRM for class reservations with admin interface. | High |
| todo-list-with-mood | To-do list combined with mood tracker. | Medium |
| birthday-wish-app | Static birthday card with message and animation. | Low |
| pc-gaming-niche-site | Budget gaming peripherals review site with CMS. | Medium |
| tennis-enthusiast-platform | Social platform for finding tennis partners. | High |
| engineering-job-board | Niche job board for engineering positions. | High |
| indonesian-inventory-app | Inventory management app in Indonesian language. | Medium |
| habit-tracker-app | Track habits, daily progress, visualize streaks. | Medium |
| recipe-sharing-platform | Community platform for sharing recipes. | High |
| pomodoro-study-timer | Minimalistic Pomodoro timer with session logging. | Low |
| cat-conspiracy-tracker | Humorous app tracking cat suspicious activities. | Low |

### A.2 Assessor Protocol Details

**Setup & Reset (≈1 minute)**
- Method: Quit Chrome. Relaunch with incognito mode. Run `./scripts/reset_env.sh` from the app `source_code` directory.
- Notes: If you see bind errors or container name conflicts, re-run the reset script once.

**AB-01 Boot & Home**
- Method: Navigate to `http://localhost`
- Criteria: PASS if page renders and Console shows 0 errors; WARN if page renders with Console errors; FAIL if page does not render
- Stop rule: If AB-01 is FAIL, mark remaining checks NA

**AB-02 Prompt to app correspondence**
- Method: Navigate to `http://localhost`, find and execute main action
- Criteria: PASS if app reflects user prompt; WARN if no way to find primary action in 30s; FAIL if generic template
- Stop rule: If AB-02 is FAIL, mark remaining checks NA

**AB-03 Create**
- Method: From the main entity form, fill valid fields; submit
- Criteria: PASS if success indicator appears with no Console errors; WARN if errors; FAIL if action doesn't work

**AB-04 View/Edit**
- Method: Open detail/edit; change one field; save
- Criteria: PASS if success indicator appears with no Console errors; WARN if errors; FAIL if data doesn't persist

**AB-06 Clickable Sweep**
- Method: Systematically click all visible primary elements across main pages
- Criteria: PASS if no navigation errors; WARN if minor issues (<30%); FAIL if >30% elements broken

**AB-07 Performance (quick)**
- Method: Run Lighthouse once on home (Mobile)
- Criteria: PASS >75, 30<WARN<75, FAIL<30

### A.3 Evaluation Results Summary

Record PASS/FAIL/NA for each prompt and check. Complete results available in the repository at `analysis/evaluation_results.csv`.
