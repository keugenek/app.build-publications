## Title
Production Reliability at Scale: Scaffolding Systems for Agentic Prompt-to-App Generation

### Authors and Affiliations
- Evgenii Kniazev [1]
- Arseny Kravchenko [1]
- Igor Rekun [1]
- Prof. Dr. Ivan Yamshchikov [2]
- Pranav Sah [2]
- Pratik Nichite [2]

[1] Databricks - app.build team
[2] THWS University of Applied Sciences Würzburg‑Schweinfurt (CAIRO)

Correspondence: <contact@your-domain.example>

Submission to: NeurIPS 2025 Workshop on Scaling Environments for Agents (SEA) — see website: [SEA Workshop @ NeurIPS 2025](https://sea-workshop.github.io/)

### Abstract
We present app.build, an open-source framework that improves LLM-based application generation through systematic validation and structured environments. Our approach combines multi-layered validation pipelines, stack-specific orchestration, and model-agnostic architecture, implemented across reference stacks (TypeScript/tRPC, Python/NiceGUI (beta), Php/Laravel (beta)). Through evaluation on 30 generation tasks, we demonstrate that comprehensive validation improves success rates by X%, with open-weights models achieving X% of closed-model performance when provided structured environments. The open-source framework has been adopted by the community, with over 3,000 applications generated to date. This work demonstrates that scaling reliable AI agents requires scaling environments, not just models - providing empirical insights and complete reference implementations for production-oriented agent systems.

### Keywords
AI agents; software environments; production systems; validation feedback; actor-critic architecture

# 1. Introduction

## 1.1 The Production Reliability Gap

While AI coding agents demonstrate impressive capabilities on standard benchmarks like HumanEval [1] and MBPP [2], relying on them to build production-ready applications without human supervision remains infeasible. Recent repository-level systems such as Devin [3] and SWE-agent [4] represent significant advances, yet their performance on real-world software engineering tasks reveals a substantial gap between research benchmarks and production requirements. (todo: proof of the claim)

This gap manifests across multiple dimensions. Function-level benchmarks like HumanEval evaluate isolated code generation but fail to capture system-level concerns including error handling, integration complexity, and production constraints [5]. Even state-of-the-art systems like AutoCodeRover, achieving 19% efficacy on SWE-bench at $0.43 per issue [6], demonstrate that raw model capability alone is insufficient for reliable automated software development.

The core challenge lies in treating LLMs as standalone systems rather than components requiring structured environments. Current approaches predominantly focus on making models "smarter" via either training or prompt engineering, but this paradigm fails to address fundamental reliability issues inherent in probabilistic generation.

## 1.2 Our Approach: Environment Scaffolding

We propose **environment scaffolding** as an environment-first approach complementing prompt engineering, focusing on action-space design and agent integration. Environment scaffolding provides structured constraints, contextual information, and deterministic validation feedback loops that enable consistent quality in LLM-generated applications through structured task formulation and validation infrastructure. Unlike approaches that attempt to improve model reasoning through prompting, our method creates safe environments where models can detect errors earlier and recover systematically with lesser risk of harming the host system and reducing the risk of unpredicted generated code behavior.

Our approach operates on three core principles. First, **structured environment design** provides explicit constraints and contextual information, reducing the generation search space while maintaining flexibility. Second, **multi-layered validation pipelines** implement deterministic quality gates with stack-specific checks, creating iterative validation cycles that catch errors early. Third, **model-agnostic architecture** decouples environment scaffolding from LLM choice, enabling consistent quality assurance across different foundation models.

We implement this approach through app.build, an open-source framework featuring multiple production stacks (TypeScript/tRPC and beta stacks Python/NiceGUI, Php/NiceGUI) with comprehensive validation pipelines. Our architecture combines BaseActor tool-calling patterns, AST-based anti-pattern detection, and finite state machine orchestration to ensure generated applications meet production standards.

## 1.3 Contributions

Our work contributes to scaling environments for agents through:

*Environment Infrastructure*: Open-source framework with reference web stacks demonstrating structured action-space design and tool integration for code generation agents.

*Empirical Evaluation*: Analysis of 30 generation tasks showing specific validation layers impact on success rates for our most mature stack TypeScript/tRPC, with ablation studies revealing environment scaffolding effects across model architectures.

*Methodological Insights*: We demonstrate that thoughtful environment design matters more than raw model capability for production reliability. Our findings challenge the dominant focus on model scaling and prompt engineering, suggesting that structured environments represent a more promising path to reliable AI-assisted software development.

*Community Adoption*: The framework has been adopted by the open-source community, validating the practical utility of environment-first design for AI agents, with over 3,000 applications generated by independent users.

# 2. Background and Related Work (to be edited by @arsenyinfo) (@igor - to add more relevant stuff )

## 2.1 Agentic Software Engineering

The evolution of AI coding agents has progressed from simple code completion to autonomous software engineering systems capable of repository-level modifications. **SWE-bench** [7] established the gold standard for evaluating repository-level understanding with 2,294 real GitHub issues from 12 Python projects. The accompanying **SWE-agent** [4] demonstrated that custom agent-computer interfaces significantly enhance performance, achieving 12.5% pass@1 through careful interface design rather than model improvements.

Repository-level agents have emerged as a distinct research direction. **RepoCoder** [8] introduced iterative retrieval-generation pipelines that improve baseline performance by over 10% through better context integration. **AutoCodeRover** [6] combines LLMs with spectrum-based fault localization, achieving 19% efficacy on SWE-bench at $0.43 per issue. More recently, **Agentless** [9] challenged complex agent architectures with a simple three-phase process (localization, repair, validation) achieving 32% on SWE-bench Lite at $0.70 cost, suggesting that sophisticated architectures may not always improve performance.

**Multi-agent systems** have consistently outperformed single-agent approaches. **AgentCoder** [10] employs a three-agent architecture (Programmer, Test Designer, Test Executor) achieving 96.3% pass@1 on HumanEval with GPT-4, compared to 71.3% for single-agent approaches. **MapCoder** [11] extends this with four specialized agents replicating human programming cycles, achieving 93.9% pass@1 on HumanEval and 22.0% on the challenging APPS benchmark. **MetaGPT** [12] demonstrates role-based agents communicating through structured documents, achieving 85.9% pass@1 on HumanEval with 100% task completion on software development tasks.

Our approach differs fundamentally from these repository-level and multi-agent systems. While they focus on modifying existing codebases or coordinating multiple specialized agents, we address the distinct challenge of generating and updating complete applications from natural language prompts with production-level quality assurance.

## 2.2 Production Quality in Generated Code

Ensuring production-ready AI-generated code requires validation approaches beyond simple correctness testing. **Static analysis integration** has shown promise, with intelligent code analysis agents [19] combining GPT-3/4 with traditional static analysis to reduce false-positive rates from 85% to 66%. However, token consumption costs remain prohibitive for widespread adoption.

**Testing frameworks** have evolved to address AI-specific challenges. **Test-driven approaches** like TiCoder [20] achieve 45.97% absolute improvement in pass@1 accuracy through interactive generation. Property-based testing frameworks [21] show 23.1-37.3% relative improvements over established TDD methods by generating tests that capture semantic properties rather than specific implementations.

**AST-based validation** provides structural correctness guarantees. **AST-T5** [22] leverages Abstract Syntax Trees for structure-aware analysis, outperforming CodeT5 by 2-3 points on various tasks. **iSMELL** [23] combines multiple code smell detection toolsets with LLMs in a Mixture of Experts architecture, achieving 75.17% average F1 score—a 35.05% increase over LLM baselines for classical code smells.

**Industry deployment** reveals gaps between offline performance and practical usage. **CodeAssist** [24] collected 2M completions from 1,200+ users over one year, revealing significant discrepancies between benchmark performance and real-world usage patterns. Platforms like SonarQube have implemented specialized quality gates for AI-generated code, integrating into CI/CD pipelines with customizable rules for different risk profiles.

Our work builds on these validation approaches but addresses a fundamental limitation: existing methods focus on individual code artifacts rather than complete application systems. We demonstrate that production readiness requires validation pipelines specifically designed for end-to-end application generation, not just code correctness.

#### 2.3. Tree search and test time and runtime isolation (todo: @igor)

**Tree search** enhances LLM-based solutions and serves as a way to increase compute budget beyond internal model reasoning token budget. The closest approach is used by Li et al in [https://arxiv.org/abs/2502.14382](S* Scaling) by combining iterative feedback with parallel branches taking different path towards solving the problem.

**Sampling** more trajectories increases success rate significantly which is evident by difference in pass@1 and pass@3 often by 30% or more, drawing more samples brought ARC success rate from 10 -> 35% [https://www.lesswrong.com/posts/Rdwui3wHxCeKb7feK/getting-50-sota-on-arc-agi-with-gpt-4o]

**Sandboxing** is cornerstone due to web applications require much more elaborate testing than running unit tests. It includes set up and teardown of databases and browser emulation. To run that in parallel we opted for dagger.io for it's caching capabilities and compatibility with docker.

## 3. Problem Setup and Method

### 3.1 Problem Formulation

LLM-based code generation enables rapid prototyping but often produces code that does not meet production standards. We present app.build, a framework addressing this through structured generation environments and systematic validation—demonstrating how careful environment design transforms probabilistic language models into reliable software engineering tools.

### 3.2 Approach (todo: reduce repated items)

Our framework exemplifies environment infrastructure design for software manipulation agents, implementing:

**Environment Scaffolding**: We provide structured environments with explicit constraints and contextual information for reliable code generation, demonstrated through web stack reference implementations.

**Multi-Layered Validation**: We implement deterministic quality gates with stack-specific validation pipelines, creating feedback loops that ensure generated code meets production standards.

**Model-Agnostic Architecture**: The framework decouples environment scaffolding from the underlying LLM, enabling integration with various language models while maintaining consistent quality assurance.

### 3.3 Architecture

#### 3.3.1 Meta-Components

We developed following universal components that are reused for both stacks in the agent:

**BaseActor**: A model-agnostic agent implementing core operations (file I/O, code editing, task completion) through tool calling. Stack-specific extensions augment functionality (e.g., dependency management via `uv add` for Python). The completion mechanism triggers stack-specific validation pipelines.

**Tree Search**: General data structure of nodes containing LLM completions, performed actions and evaluation results, such as type and lint checks, tests pass rate, browser emulation and playwright checks. Search policy selects nodes for further expansion with configurable search width and optional branching criteria until maximum depth is reached or solution is found

**Runtime Infrastructure**: Dagger engine is used to provide isolated sandboxes due to its caching mechanism naturally fitting tree searches since child node will share environment of the parent making backtracking essentially free. On top of sandbox workspaces we also use dagger to serve dependencies such as databases as well as run playwright tests.

**AST-based Validation**: We employ `ast-grep` for pattern-based code analysis, identifying common anti-patterns in generated code (e.g., silent failures, improper error propagation) that distinguish superficially correct code from production-ready implementations.

#### 3.3.2 Stack-Specific Components (todo: describe complete set of checks for reference in experiments, refererred to Configuration 3, Configuration 4 below, need diagram)

**Generation Flow**: Each stack implements a finite state machine orchestrating the generation process. The TypeScript/tRPC stack follows a sequential pipeline: data models → API interfaces → backend handlers and frontend. The Python/NiceGUI and Php/Laravel stacks employs two-phase approach: data models → API/UI implementation.

**Templates**: Stack-specific templates provide initial application scaffolding, reducing generation overhead while embedding universal smoke tests and health checks into the validation pipeline.

**Validation Pipeline**: Stack-specific validation implements hierarchical checks ordered by computational cost and diagnostic value. Compilation verification precedes integration testing; static analysis gates dynamic testing. This design minimizes computational overhead while maximizing error detection coverage.

### 4. Experimental Setup
#### 4.1 Evaluation Framework
- Dataset: 30 prompts spanning a complexity spectrum (low: static/single‑page UI; medium: single‑entity CRUD; high: multi‑entity/custom logic). Canonical texts are in Appendix A.1; complexity rubric in §6.5.
- Metrics:
  - Viability rate (V=1) and non-viability rate (V=0)
  - Perfect quality rate (Q=10) and quality distribution (mean/median for V=1 apps)
  - Validation pass rates by check (AB‑01, AB‑02, AB‑03, AB‑04, AB‑06, AB‑07)
  - Quality scores (Q, 0–10) using the rubric in §4.4
  - Model/cost comparisons where applicable (reported in §6.2)

NB: Check AB-04 has been removed from the dataset to avoid redundant checks.

#### 4.2 Experimental Configurations
We designed four experimental configurations to systematically evaluate factors affecting app generation success rates:

Configuration 1: Baseline. We generated baseline tRPC apps with default production setup and all checks ON to assess default generation success rate, cost and time.

Configuration 2: Model Architecture Analysis. Using the tRPC stack, we evaluated open versus closed foundation models. Claude Sonnet 4 served as the baseline coding model, compared against Qwen3-Coder-480B-A35B and GPT OSS 120B as open alternatives.

Configuration 3: Testing Framework Ablation. We conducted three ablation studies on the tRPC stack: (3a) disabled isolated Playwright UI smoke tests; (3b) additionally disabled ESLint checks; and (3c) further removed handlers tests, eliminating backend validation.

These configurations enable systematic analysis of technological, architectural, and validation factors influencing automated app generation performance.

#### 4.3 Prompt Dataset

The evaluation dataset comprises 30 prompts designed to assess system performance across diverse application development scenarios.

*Dataset Construction*. Evaluation prompts were generated through a blind testing protocol involving independent human contributors with no prior exposure to the app.build system architecture or generated outputs. Contributors developed tasks reflecting authentic development workflows from their professional experience, ensuring general validity while minimizing selection bias. To maintain feasibility within the experimental constraints, core framework developers subsequently filtered prompts requiring advanced integrations or AI capabilities beyond the system's scope. The filering was performed prior to the evaluation phase.

*Data Processing*. Raw prompts underwent automated post-processing using LLMs to anonymize sensitive information and standardize linguistic structure. This normalization process preserved semantic content and task complexity while ensuring consistent evaluation conditions across all test cases.

*Reproducibility*. The complete prompt dataset and associated benchmark harness are publicly available in the project repository.

#### 4.4 Assessor Protocol and Checks

*Human Evaluation Framework*. To systematically assess generated application quality, we implement a structured evaluation protocol comprising six standardized functional checks executed by human assessors. Each generated application undergoes comprehensive testing across core functionality dimensions, with results recorded using a four-tier classification system (PASS/WARN/FAIL/NA) documented in Appendix Table A2.

*Scoring Methodology*. The evaluation reports two independent outcomes: a binary viability indicator (V) and a 0–10 quality score (Q). Viability expresses “works/doesn’t work” for core smoke criteria, while Quality reflects how well the application meets user needs and software quality expectations.

Viability (binary):

V = 1 if AB-01 and AB-02 are not FAIL; otherwise V = 0.

Quality (0–10):

Q = 10 × ( ∑_{c∈A} w × s_c ) / ( ∑_{c∈A} w ),

where A is the set of applicable checks (excluding NA); all checks use equal weights prior to NA re‑normalization; and per‑check grades s_c are mapped as follows:
- AB‑01 (Boot): PASS = 1.0, WARN = 0.5, FAIL = 0.0
- AB‑02 (Prompt correspondence): PASS = 1.0, WARN = 0.5, FAIL = 0.0
- AB‑03, AB‑04, AB‑06 (Clickable Sweep): PASS = 1.0, WARN = 0.5, FAIL = 0.0
- AB‑07 (Performance): continuous metric normalized to [0,1] (see Appendix A.3)

**Table 1: Check Weights (Equal Share)**

| Check ID | Check Description | Weight (share) | Notes |
|----------|-------------------|----------------|-------|
| AB-01 | Boot & Home | 1/6 | Hard gate for Viability V |
| AB-02 | Prompt Correspondence | 1/6 | Hard gate for Viability V |
| AB-03 | Create Functionality | 1/6 | |
| AB-04 | View/Edit Operations | 1/6 | |
| AB-06 | Clickable Sweep | 1/6 | |
| AB-07 | Performance Metrics | 1/6 | Continuous (normalized); see Appendix A.3 |

Note: AB‑05 is not used in this release due to redundant AB-05 check removal. Identifiers AB‑06 (Clickable Sweep) and AB‑07 (Performance) follow the dataset column names for consistency.

Viability is determined solely by smoke tests (AB‑01, AB‑02). Quality is computed independently as a normalized weighted average across all checks. An application that achieves viability but fails all non-smoke checks would receive Q = 10 × (1.0 + 1.0 + 0 + 0 + 0 + 0)/6 ≈ 3.3, reflecting basic functionality without operational quality. The continuous performance mapping preserves sensitivity to runtime characteristics.

*Evaluation Criteria*. The assessment protocol implements domain-specific checks designed for comprehensive coverage while maintaining evaluation efficiency. Each check targets a specific functional aspect with stable identifiers to ensure reproducibility. The complete evaluation suite comprises the following criteria:

1. Application initialization and clean boot sequence (AB‑01)
2. Prompt-to-implementation correspondence and primary action availability (AB‑02)
3. Entity creation workflow functionality (AB‑03)
4. Entity viewing and editing capabilities (AB‑04)
5. Clickable element sweep for primary interactions (AB‑06)
6. Performance characteristics under initial load conditions (AB‑07)

Detailed evaluation procedures, pass/fail criteria, and reporting standards are specified in Appendix A.3, including environment preparation protocols (AB-00) and systematic testing methodology.

### 6. Results

#### 6.1 Environment Scaffolding Impact (tRPC only)

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

Smoke tests (AB‑01, AB‑02) determine viability. Among viable applications (V=1, n=21), quality averaged 8.78 with 77.3% achieving Q≥9. Non-viability (V=0) arises from smoke test failures or missing artifacts.

#### 6.2 Open vs Closed Model Performance

We evaluated Claude Sonnet 4 against two open-weights models using the TypeScript/tRPC stack with full validation pipelines. Claude achieved 86.7% success rate, establishing our closed-model baseline at $110.20 total cost. Qwen3-Coder-480B-A35B reached 70% success rate (80.8% relative performance) while GPT OSS 120B managed only 30% success rate. Both open models were accessed via OpenRouter, resulting in significantly lower costs: $12.68 for Qwen3 and $4.55 for GPT OSS.

The performance gap reveals that environment scaffolding alone cannot eliminate the need for capable foundation models. However, leading open-weights models like Qwen3 demonstrate that structured environments can enable production-viable performance at substantially reduced costs. The 9x cost reduction for 19% performance loss represents a viable tradeoff for cost-sensitive deployments. GPT OSS's poor performance highlights the significant variance in open-weights model capabilities. Important limitation: Our scaffolding system was originally developed and optimized using Claude models, which may introduce bias favoring Claude's architectural patterns and potentially understating open-weights model performance.

Operational characteristics differed notably between model types. Open models required more validation retries, evidenced by higher LLM call counts (4,359 for Qwen3, 4,922 for GPT OSS vs 3,413 for Claude). Healthcheck pass rates (86.7% for Qwen3 vs 96.7% for Claude) indicate that open models generate syntactically correct code but struggle more with integration-level correctness, emphasizing the importance of comprehensive validation pipelines for open-weights deployments.

#### 6.3 Automated Generation Quality

Automated outputs demonstrate strong quality once viability is established. Viable applications averaged Q≈8.78 (median 9.5), with 81% achieving Q≥9. Typical residual defects are localized rather than systemic:

- Minor UI wiring gaps (e.g., a single non‑responsive button)
- Light state/integration inconsistencies (e.g., refresh required after create)
- Occasional content‑security policy warnings for media/images

This profile indicates that current app.build solution with deterministic gates plus stack‑specific templates reliably produce maintainable, production‑style apps with occasional need of small, actionable fixes.

#### 6.4 Failure Mode Analysis (from assessor notes)

Observed failure modes in tRPC runs cluster into a small set of categories:

- Boot/Load failures: template placeholders or incomplete artifacts
- Prompt correspondence failures: generic template likely because of generation failure
- CSP/security policy restrictions: blocked images or media by default policies
- UI interaction defects: unbound handlers, non‑working controls
- State/integration defects: data not persisting across refresh; broken filters; login issues
- Component misuse: runtime exception due to incorrect component composition

These defects align with our layered pipeline design: early gates catch non‑viable builds, while later gates expose interaction/state issues before human evaluation.

#### 6.5 Prompt Complexity and Success Rate

We categorize prompts along a simple rubric and analyze success impacts:

- Low complexity: static or single‑page UI tasks (e.g., landing pages, counters)
- Medium complexity: single‑entity CRUD without advanced flows or auth
- High complexity: multi‑entity workflows, custom logic, or complex UI interactions

Empirically, medium‑complexity CRUD prompts achieve the highest quality (Q=9–10 typical), reflecting strong scaffolding for data models and handlers. Low‑complexity UI prompts are not uniformly "easy": several became non-viable (V=0) by failing prompt correspondence (AB‑02) with generic templates. High‑complexity prompts show lower viability rates due to interaction wiring and state‑consistency issues surfaced by AB‑04/05. This suggests that environment scaffolding is most mature for CRUD‑centric tasks, while additional guardrails and exemplars are needed for multi‑step workflows and rich UI behaviors. todo: However this analysis needs further data to be evaluated.

6.6 Analysis of the runs

Across 30 tRPC runs, automated generation achieved viability in 70% of cases (V=1), with strong quality scores once viability was established. Non-viability concentrated in smoke test failures (boot/prompt) while quality defects clustered in interaction/state issues:

- Viability gates: 9/30 runs were non-viable (V=0), traced to AB‑01/AB‑02 failures or missing artifacts/templates.
- Quality plateau: among viable runs (V=1, n=21), 77.3% achieved Q≥9; median quality was 9.5.
- Residual defects: interaction wiring (unbound buttons/links), minor state issues (refresh required, broken filters), and occasional CSP warnings for images/media.

Prompt complexity correlated with outcomes. Medium‑complexity CRUD prompts achieved the highest quality (Q=9–10 typical). Low‑complexity UI prompts sometimes became non-viable by failing AB‑02 with generic templates. High‑complexity prompts exhibited more interaction/state defects, reducing both viability and quality scores. This suggests scaffolding is most mature for CRUD‑centric tasks; richer workflows benefit from additional guardrails and exemplars.

### 7. Summary

7.1 Limitations
Our current framework is limited to CRUD-oriented data applications, focusing on structured workflows with well-defined input-output expectations. While effective for common web application patterns, it does not yet support complex systems or advanced integrations. The validation pipeline, though comprehensive, relies on domain-specific heuristics and expert-defined anti-patterns, which may not generalize to novel or edge-case designs and requires significant human input. Additionally, our human evaluation protocol, while rigorous, is poorly scalable and constrained by subjectivity in assessing maintainability and user experience nuances. We plan to address these challenges in future work.

7.2 Broader Impact
The AI agent boom is accelerating, but real industry deployments often fail silently. Without environment scaffolding, we risk massive overengineering of AI models while ignoring the real bottleneck. App.build represents a shift from model-centric to system-centric AI engineering — a critical step toward scaling reliable agent environments. As emphasized in Machine Learning System Design with end-to-end examples [25], production AI systems only become effective when development integrates not just model performance, but core software engineering principles. By open-sourcing both the framework and evaluation protocol, we provide a reproducible, transparent foundation for building and benchmarking agent environments at scale. The model-agnostic architecture enables consistent quality assurance across diverse LLMs, directly supporting the goal of scaling environments rather than models. As agent systems grow, their environments must evolve from ad hoc scaffolds to engineered, testable, and composable systems — a vision our work helps operationalize.

While our evaluation focuses on software generation environments, the principles of structured validation and environment scaffolding may generalize to other agent domains. The community-driven adoption (3,000+ applications generated without commercial incentives) suggests genuine utility for researchers and developers exploring agent-environment co-design.

7.3 Conclusion
Our results demonstrate that raw model capability alone cannot bridge the gap between AI potential and production reality. Through systematic environment scaffolding, multi-layered validation, and stack-specific orchestration, app.build transforms probabilistic language models into dependable software engineering agents. Ablation studies show that comprehensive validation layers improve success rates by up to X%, with open-weights models achieving X% of closed-model performance when provided structured environments — confirming that thoughtful environment design matters more than model scale. We conclude that the path to reliable, production-ready AI agents lies not in better prompts or bigger models, but in principled, scalable environment engineering.

### Acknowledgments
This submission is prepared in collaboration between app.build (Databricks - app.build team) and THWS University of Applied Sciences Würzburg‑Schweinfurt (CAIRO). We thank the app.build community for their contributions and feedback which have been invaluable in shaping this work. Special thanks to Databricks excutive team for supporting the open-source initiative and providing resources for this research.

### References (@pratik)
1. Agentic AI Software Engineers: Programming with Trust. arXiv:2502.13767, 2025.
3. Augmenting Software Engineering with AI. arXiv:2409.18048v3, 2024.
5. Evaluating Large Language Models in Class-Level Code Generation. ICSE 2024.
6. HumanEval: The Most Inhuman Benchmark for LLM Code Generation. Medium, 2024.
7. The Rise of AI Teammates in Software Engineering 3.0. arXiv:2507.15003v1, 2025.
10. Detecting AI-Generated Source Code. ICSE 2025 Research Track.
12. Security Analysis and Validation of Generative-AI-Produced Code. Medium, 2024.
13. Six Principles for Production AI Agents. Neon Blog, 2025.
14. app.build: An Open-Source AI Agent That Builds Full-Stack Apps. Neon Blog, 2025.
15. app.build Can Now Build Python Data Apps. Neon Blog, 2025.
16. The Open Source Advantage in Large Language Models. arXiv:2412.12004, 2024.
17-18. Finite State Machines for AI Systems. Various, 2024.
22. AgentCoder: Multi-Agent Code Generation. arXiv:2312.13010v3, 2024.
23. Design Decisions Behind app.build. Neon Blog, 2025.
25. MapCoder: Multi-Agent Code Generation for Competitive Problem Solving. GitHub, 2024.
26-28. AI Code Generation: Testing and Validation. Various, 2024-2025.
30. Context Engineering: A Guide With Examples. DataCamp, 2025.
32-33. Open Models by OpenAI. OpenAI/Azure Documentation, 2025.
34-35. tRPC: End-to-end Typesafe APIs. tRPC Documentation, 2025.
36. Comparing Human and LLM Generated Code. arXiv:2501.16857v1, 2025.
38. Rubric Evaluations for AI Systems. Labelbox/Snorkel, 2025.
40. Open Source AI in Production. GitHub Blog, 2025.
41. Sharp Tools: Developers and Agentic AI. arXiv:2506.12347v2, 2025.
42. Top Benchmarks for LLM Code Generation. Reddit/Community, 2025.

### Appendix
Add additional experiments, extended proofs, dataset cards, implementation details, and extra qualitative examples here.

#### A.1 Prompt Dataset (Full List)
The table below enumerates the full prompt set used in the benchmark, with short summaries and provenance/obfuscation notes. The canonical prompt texts and loader live in the repository (see
[Benchmark prompts (agent/benchmark.py:L71)](https://github.com/appdotbuild/agent/blob/0df56e8ca70a8fa669caf7710e5a387fe9e2feac/agent/benchmark.py#L71)).

| ID | Prompt (summary) |
| --- | --- |
| plant-care-tracker | A simple web app that lets users track the condition of their plants using fun plant moods based on custom rule-based logic. Avoid using AI, ML, or external APIs. |
| roommate-chore-wheel | An app that randomly assigns chores each week and tracks completion. |
| car-maintenance-dashboard | A dashboard to monitor car maintenance history and upcoming service dates. |
| city-trip-advisor | A simple web app that suggests if tomorrow's trip to a given city is a good idea, based on open-meteo API's weather forecast for that city. |
| currency-converter | A currency conversion app that takes an amount, source currency and target currency as input and converts it using the Frankfurter API. |
| book-library-manager | A web app for managing a book library where users can add, view, update, and remove books, each with details like title, author, genre, and reading status. Include user-friendly forms, list views, and the ability to search or filter books. |
| wellness-score-tracker | An app where users input hours of sleep, stress levels, caffeine/alcohol intake—then get a daily 'wellness score' with historical trends. |
| event-tracker | A basic event tracker that lets users add, view, and delete events with a title, date, and description. Use a clean, modern UI with minimal code in your preferred framework. |
| daily-pattern-visualizer | A dashboard where users log sleep, work hours, social time, screen time, and emotional energy. Visualize patterns and suggest when to take breaks. |
| pantry-inventory-app | An app where users can add and track pantry items, get expiry notifications, and, if possible, generate recipe suggestions using AI based on available ingredients. |
| home-lab-inventory | An application to catalog and manage home lab infrastructure. Users should be able to track hardware assets (servers, switches), software (VMs, containers), and manage IP address allocations. |
| basic-inventory-system | A web-based inventory management system for small businesses. Key features should include product management (tracking names, SKUs, and stock levels) and a system for recording stock-in and stock-out transactions. |
| pastel-blue-notes-app | A minimalist notes application with a pastel blue color scheme. It should allow users to create, edit, and organize notes into folders or categories, with user accounts for syncing across devices. |
| teacher-question-bank | A question bank system for teachers to create and manage questions by subject and topic. Must include a feature to automatically generate quizzes from the bank and export them to a printable format. |
| beer-counter-app | A simple, single-page web app to count beers. It should feature increment, decrement, and reset buttons, and use local storage to save the count without needing a login. |
| plumbing-business-landing-page | A professional, responsive landing page for a plumbing business designed for lead generation. It must include sections for services offered, customer testimonials, and a clear contact form. |
| kanji-flashcards | A Kanji learning app using a spaced repetition system (SRS). It should feature interactive flashcards with Kanji, meanings, and readings, allowing users to track progress across different JLPT levels. |
| bookmark-management-app | A bookmark management application that allows users to save, tag, and organize links into collections. The system should support user accounts for syncing and include a powerful search feature. |
| personal-expense-tracker | A personal expense tracking application for logging income and expenses. Users should be able to assign transactions to categories, set budgets, and view a dashboard with spending visualizations. |
| gym-crm | A CRM for a gym to manage class reservations. It should feature a class schedule calendar where members can book spots, and an admin interface for managing classes and attendance. GYM STYLE VISUALS PLEASE! |
| todo-list-with-mood | A daily journal application that combines a to-do list with a mood tracker. Users can manage tasks and log their daily mood, with a view to see the relationship over time. |
| birthday-wish-app | A simple, single-page static website to serve as a digital birthday card. It should feature a personalized message, a small photo gallery, and a simple celebratory animation. |
| pc-gaming-niche-site | A content-focused niche website featuring reviews of budget PC gaming peripherals. The site should be organized by product categories (mice, keyboards, etc.) and include a simple CMS for publishing articles. |
| tennis-enthusiast-platform | Hipster-looking social platform for tennis players to find partners. Users can create profiles with their skill level and location, and search for other players nearby to schedule matches. |
| engineering-job-board | A nerd-style niche job board for engineering positions. It should allow employers to post jobs and job seekers to search and filter listings by engineering discipline and location |
| indonesian-inventory-app | Buatkan aplikasi manajemen inventaris (stok barang) dalam Bahasa Indonesia. Fitur utama harus mencakup pengelolaan daftar barang (tambah, edit, hapus) serta pencatatan transaksi barang masuk dan barang keluar. |
| habit-tracker-app | A simple app to help users build and maintain positive habits. Users can define custom habits, track their daily progress with a simple check-in, and visualize their streaks over time to stay motivated. |
| recipe-sharing-platform | A warm community-based platform where users can post, browse, and save their favorite recipes. Each recipe includes ingredients, instructions, and categories, with a search feature to find new meals. |
| pomodoro-study-timer | Brutally minimalistic Pomodoro timer to boost productivity. It features customizable work and break intervals, audio alerts, and a simple log to track completed study sessions throughout the day. |
| cat-conspiracy-tracker | A humorous app for paranoid cat owners to log their pet's suspicious activities. The app uses a custom, non-scientific scoring system based on logged behaviors (like prolonged staring or 'gifts' of dead insects) to calculate a daily 'conspiracy level'. |

#### A.2 Assessor Checklist (Template)
Record PASS/FAIL/NA for each prompt and check. Use the Notes column for brief context or defect links.

ID	AB-00 Reset	AB-01 Boot	AB-02 Prompt	AB-03 Create	AB-04 View/Edit	AB‑06 Clickable Sweep	AB‑07 Performance (quick)	Notes	PASS#	WARN#	PTS
P-001										0	0	0

#### A.3 Assessor Protocol Details (app.build‑specific)
This appendix section provides atomic, app.build‑specific methods, pass criteria, and reporting rules for each check. Report PASS/FAIL/NA in Table A.2.

- Setup & Reset (≈1 minute)
  - Method: Quit Chrome. Relaunch with incognito mode. If present, run `./scripts/reset_env.sh` from the app `source_code` directory.
  - Notes: If you see common setup issues (Bind for 0.0.0.0:80 failed: port is already allocated; or The container name "/postgres" is already in use by container), re‑run the reset script once; do not report failure.

- AB‑01 Boot & Home
  - Method: Navigate to `http://localhost`.
  - Criteria: PASS if page renders and Console shows 0 errors; WARN if page renders with Console errors (attach first error); FAIL if page does not render.
  - Stop rule: If AB‑01 is FAIL, stop after recording AB‑01 - AB‑02 (smoke set). Mark remaining checks NA.

- AB‑02 Prompt to app correspondence
  - Method: Navigate to `http://localhost`, find and execute main action.
  - Criteria: PASS if app reflects user prompt; WARN if no way to find and execute primary action in 30s, FAIL if application is generic or template with no correspondence to user prompt.
  - Stop rule: If AB‑02 is FAIL, stop after recording AB‑01 - AB‑02 (smoke set). Mark remaining checks NA.

- AB‑03 Create
  - Method: From the main entity form, fill valid fields; submit.
  - Criteria: PASS if success toast/indicator appears; no Console errors; WARN if errors, NA if no such action; FAIL if action does not work - shows some user error and is not clickable or not updating the page.

- AB‑04 View/Edit
  - Method: Open detail/edit; change one field; save.
  - Criteria: PASS if success toast/indicator appears; no Console errors; WARN if errors, NA if no such action; FAIL if action does not work - shows some user error and is not clickable or not updating the page or if refresh cleans up the data.

- AB‑06 Clickable Sweep
  - Method: Systematically click all visible primary clickable elements across main pages (nav links, primary/secondary buttons, list rows, tabs). Avoid clearly destructive actions; if confirmation appears, confirm once.
  - Criteria: PASS -no navigation errors; no 404/5xx on route changes; target routes/components render, WARN if unhandled Console errors or one or two out of 10 minor buttons/elements dont work, FAIL if >30% of elements not clickable or brokens

- AB‑07 Performance (quick)
  - Method: Run Lighthouse once on home (Mobile). Note Performance and Best Practices.
  - Criteria: Record performance score in notes, PASS >75, 30>WARN>75, FAIL<30


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




[1] Chen, M., Tworek, J., Jun, H., Yuan, Q., Pinto, H. P. D. O., Kaplan, J., ... & Zaremba, W. (2021). Evaluating large language models trained on code. arXiv preprint arXiv:2107.03374.

[2] Austin, J., Odena, A., Nye, M., Bosma, M., Michalewski, H., Dohan, D., ... & Sutton, C. (2021). Program synthesis with large language models. arXiv preprint arXiv:2108.07732.

[3] Cognition Labs. (2024). SWE-bench Technical Report. https://cognition.ai/blog/swe-bench-technical-report

[4] Yang, J., Prabhakar, A., Karthik, N., Narasimhan, K., & Yao, S. (2024). SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering. *Advances in Neural Information Processing Systems*, 37.

[5] Liu, J., Xia, C. S., Wang, Y., & Zhang, L. (2023). Is your code generated by chatgpt really correct? rigorous evaluation of large language models for code generation. *Advances in Neural Information Processing Systems*, 36.

[6] Zhang, Y., Wang, Y., Yu, K., Wang, Z., Zhu, Y., Shi, H., ... & Ernst, M. D. (2024). AutoCodeRover: Autonomous Program Improvement. In *Proceedings of the 33rd ACM SIGSOFT International Symposium on Software Testing and Analysis* (pp. 127-139).

[7] Jimenez, C., Yang, J., Wettig, A., Yao, S., Pei, K., Press, O., & Narasimhan, K. (2024). SWE-bench: Can Language Models Resolve Real-World GitHub Issues?. In *The Twelfth International Conference on Learning Representations*.

[8] Zhang, F., Chen, B., Zhang, Y., Liu, J., Zan, D., Mao, Y., ... & Lyu, M. R. (2023). RepoCoder: Repository-Level Code Completion Through Iterative Retrieval and Generation. In *Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing* (pp. 2471-2484).

[9] Xia, C. S., Deng, Y., Dunn, S., & Zhang, L. (2024). Agentless: Demystifying LLM-based Software Engineering Agents. arXiv preprint arXiv:2407.01489.

[10] Huang, D., Jia, Q., Fan, Q., Tan, H., Chen, J., & An, L. (2024). AgentCoder: Multi-Agent-based Code Generation with Iterative Testing and Optimisation. In *Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics* (Volume 1: Long Papers) (pp. 4424-4446).

[11] Islam, M. A., Santos, J., Rahman, R., & Karim, M. R. (2024). MapCoder: Multi-Agent Code Generation for Competitive Problem Solving. In *Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics* (Volume 1: Long Papers) (pp. 4406-4423).

[12] Hong, S., Zheng, X., Chen, J., Cheng, Y., Zhang, C., Wang, Z., ... & Wang, J. (2023). MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework. arXiv preprint arXiv:2308.00352.

[13] Liu, J., Xia, C. S., Wang, Y., & Zhang, L. (2023). Is your code generated by chatgpt really correct? rigorous evaluation of large language models for code generation. *Advances in Neural Information Processing Systems*, 36.

[14] Du, X., Wen, M., Wei, B., Wang, Z., Kim, D., & Menzies, T. (2024). ClassEval: A Manually-Crafted Benchmark for Evaluating LLMs on Class-level Code Generation. In *Proceedings of the IEEE/ACM 46th International Conference on Software Engineering* (pp. 1-13).

[15] Zhuo, T. Y., Huang, M., Cui, Y., Han, S., Wang, Y., & Zhou, C. (2024). BigCodeBench: Benchmarking Code Generation with Diverse Function Calls and Complex Instructions. arXiv preprint arXiv:2406.15877.

[16] Zhou, S., Xu, F. F., Zhu, H., Zhou, X., Lo, R., Sridhar, A., ... & Kembhavi, A. (2024). WebArena: A Realistic Web Environment for Building Autonomous Agents. In *The Twelfth International Conference on Learning Representations*.

[17] Tong, Y., & Zhang, J. (2024). CodeJudge: Evaluating Code Generation with Large Language Models. In *Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing* (pp. 3531-3546).

[18] Wang, Z., & Zhu, H. (2024). Validating LLM-Generated Programs with Metamorphic Prompt Testing. arXiv preprint arXiv:2406.06864.

[19] Fan, Z. (2023). Static Code Analysis in the AI Era: An In-depth Exploration of the Concept, Function, and Potential of Intelligent Code Analysis Agents. arXiv preprint arXiv:2310.08837.

[20] Fakhoury, S., Mechtaev, S., Shi, P., Chakraborty, S., & Sridharan, M. (2024). LLM-Based Test-Driven Interactive Code Generation: User Study and Empirical Evaluation. arXiv preprint arXiv:2404.10100.

[21] Anonymous. (2024). Use Property-Based Testing to Bridge LLM Code Generation and Validation. arXiv preprint arXiv:2506.18315.

[22] Gong, S., Chen, Y., Ke, P., & Liu, Z. (2024). AST-T5: Structure-Aware Pretraining for Code Generation and Understanding. arXiv preprint arXiv:2401.03003.

[23] Wu, J., Zhang, Y., Chen, L., Li, Y., Yang, H., Chen, X., ... & Luo, Z. (2024). iSMELL: Assembling LLMs with Expert Toolsets for Code Smell Detection and Refactoring. In *Proceedings of the 39th IEEE/ACM International Conference on Automated Software Engineering* (pp. 1943-1955).

[24] Izadi, M., Grichi, I., Van Tonder, R., Spinellis, D., Pradel, M., & Bacchelli, A. (2024). Language Models for Code Completion: A Practical Evaluation. In *Proceedings of the IEEE/ACM 46th International Conference on Software Engineering* (pp. 1-13).
