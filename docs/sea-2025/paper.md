## Title
Production Reliability at Scale: Scaffolding Systems for Agentic Prompt-to-App Generation

### Authors and Affiliations
- Evgenii Kniazev [1]
- Arseny Kravchenko [1]
- Igor Rekun [1]
- Prof. Dr. Ivan Yamshchikov [2]
- Pranav Sah [2]
- Pratik [2]
- Dheena Dayalan [2]

[1] app.build (Neon, now at Databricks)
[2] THWS University of Applied Sciences Würzburg‑Schweinfurt (CAIRO)

Correspondence: <contact@your-domain.example>

Submission to: NeurIPS 2025 Workshop on Scaling Environments for Agents (SEA) — see website: [SEA Workshop @ NeurIPS 2025](https://sea-workshop.github.io/)

### Abstract
While AI coding agents demonstrate impressive capabilities, relying on them on building even simple production-ready application without human supervision is not possible yet. We present app.build, an open-source prompt-to-app generator that demonstrates how extensive environment scaffolding transforms unreliable LLMs into production-ready software engineering agents. Our approach combines: .... Through evaluation on 30 application generation tasks, we show that environment scaffolding is crucial for , with even open-weights models achieving X% of closed-model performance when provided structured environments. We demonstrate that thoughtful environment design matters more than raw model capability or prompt engineering for reliability. Our work bridges the gap between AI potential and production reality, providing both empirical insights and a complete reference implementation for the community.

### Keywords
AI agents; software environments; production systems; validation feedback; actor-critic architecture

### 1. Introduction
#### 1.1 The Production Reliability Gap
- LLMs excel at code snippets but fail at production applications
- Existing benchmarks (HumanEval, MBPP) miss critical quality attributes
- Trust and validation are bottlenecks for enterprise adoption

#### 1.2 Our Approach: Environment Scaffolding for Production Readiness
- Core thesis: Reliability stems from systematic environment design, not just model capability [13]
- app.build: Open-source reference implementation combining software engineering principles with agentic architecture [14]
- Key insight: Treat app generation as a structured engineering task with verifiable checkpoints

#### 1.3 Contributions
- Empirical evidence that environment scaffolding improves reliability
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
- Github Copilot, CodeWhisperer [1,2]

#### 2.3 Software Engineering for AI
- Traditional focus on model improvement vs system design
- Our perspective: Environment design as a first-class concern

## 3. Problem Setup and Method

### 3.1 Problem Formulation

While LLM-based code generation offers rapid prototyping, its outputs often fail production standards. We address this gap through app.build, an open-source framework that bridges AI-driven generation and production requirements via systematic environment scaffolding and multi-layered validation.

### 3.2 Approach

Our framework operates on three core principles:

**Environment Scaffolding**: We provide structured environments with explicit constraints and contextual information for reliable code generation, demonstrated through two reference implementations (TypeScript/tRPC and Python/NiceGUI).

**Multi-Layered Validation**: We implement deterministic quality gates with stack-specific validation pipelines, creating feedback loops that ensure generated code meets production standards.

**Model-Agnostic Architecture**: The framework decouples environment scaffolding from the underlying LLM, enabling integration with various language models while maintaining consistent quality assurance.

### 3.3 Architecture

#### 3.3.1 Universal Components

**BaseActor**: A model-agnostic agent implementing core operations (file I/O, code editing, task completion) through tool calling. Stack-specific extensions augment functionality (e.g., dependency management via `uv add` for Python). The completion mechanism triggers stack-specific validation pipelines.

**Tree Search**: [Placeholder - to be added by Igor]

**Runtime Infrastructure**: [Placeholder - to be added by Igor]

**AST-based Validation**: We employ `ast-grep` for pattern-based code analysis, identifying common anti-patterns in generated code (e.g., silent failures, improper error propagation) that distinguish superficially correct code from production-ready implementations.

#### 3.3.2 Stack-Specific Components

**Generation Flow**: Each stack implements a finite state machine orchestrating the generation process. The TypeScript/tRPC stack follows a sequential pipeline: data models → API interfaces → frontend → backend handlers. The Python/NiceGUI stack employs a two-phase approach: data models → API/UI implementation.

**Templates**: Stack-specific templates provide initial application scaffolding, reducing generation overhead while embedding universal smoke tests and health checks into the validation pipeline.

**Validation Pipeline**: Stack-specific validation implements hierarchical checks ordered by computational cost and diagnostic value. Compilation verification precedes integration testing; static analysis gates dynamic testing. This design minimizes computational overhead while maximizing error detection coverage.

### 5. Experimental Setup
#### 5.1 Evaluation Framework  (todo @eugenek)
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
In order to assess the quality of generated apps, we run a checklist with 7 smoke tests checks run by human evaluators.
Assessors record PASS/WARN/FAIL/NA per prompt in Appendix Table A2. Full "how to" steps live in Appendix A.3.

Unless the majority of checks are PASS or WARN, we believe the application is functional with possible occasional FAILs.
As a result we calculate PASS as 1 point, WARN as 0.75 points and FAIL as -1 points and use these metrics to assign an overall score to the each generated application. In case there was a critical failure in the 00-03 we assigned a score -10 to the application score.

Table below contains a complete set of checks we believe is enough to assess the application qiality from our personal experience that will be used for the evaluation: 
— Does the app open cleanly?
- Does the app reflect the user prompt on home and support the primary action?
- Can a user create a new entity successfully?
— Can a user open details and edit an entity? 
— Do all primary clickable elements work without errors?
— Is the first load reasonably fast, with no obvious red flags?

See Appendix A.3 for detailed methods, exact pass criteria, and reporting rules (including the AB‑00 “clean start” preparation).

### 6. Results (@keugenek)
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

6.5 Analysis of the runs ^

### 7. Summary (todo @eugenek)

### 7.1 Limitations
- Currently limited to CRUD/data applications
- Validation pipeline requires domain expertise
- Future: Expand domains, analyze human-in-the-loop feedback and performance in the wild

### 7.2 Broader Impact
- Democratizes application development
- Reduces barrier to entry for non-programmers
- Open approach enables transparency and trust [40]

### 7.3. Conclusion
We demonstrated that production-ready AI agents require extensive environment scaffolding beyond model capabilities. app.build shows that combining software engineering principles with agentic architectures enables reliable application generation. Our open-source implementation and evaluation framework provide a foundation for the community to build upon. As AI agents mature, the field must shift focus from model scaling to system design—the path to production runs through principled engineering, not just larger models.

### Acknowledgments (@keugenek DONE)
This submission is prepared in collaboration between app.build (Neon, now Databricks) and THWS University of Applied Sciences Würzburg‑Schweinfurt (CAIRO).

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

ID	AB-00 Reset	AB-01 Boot	AB-02 Prompt	AB-03 Create	AB-04 View/Edit	AB-05 Refresh	AB‑06 Clickable Sweep	AB‑07 Performance (quick)	Notes	PASS#	WARN#	PTS
P-001										0	0	0

#### A.3 Assessor Protocol Details (app.build‑specific)
This appendix section provides atomic, app.build‑specific methods, pass criteria, and reporting rules for each check. Report PASS/FAIL/NA in Table A.2.

- Setup & Reset (≈1 minute)
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
  - Criteria: PASS if success toast/indicator appears; no Console errors; WARN if errors, NA if no such action; FAIL if action does not work - shows some user error and is not clickable or not updating the page.

- AB‑04 View/Edit
  - Method: Open detail/edit; change one field; save.
  - Criteria: PASS if success toast/indicator appears; no Console errors; WARN if errors, NA if no such action; FAIL if action does not work - shows some user error and is not clickable or not updating the page or if refresh cleans up the data.

--
- AB‑05 Refresh --- REMOVED
  - Method: Hard refresh (Ctrl/Cmd+Shift+R).
  - Criteria: Data persists; if app declares in‑memory storage, mark NA with note.
--

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
