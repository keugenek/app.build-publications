#### 6.6 Ablation Studies: Impact of Validation Layers

To understand how each validation layer contributes to application quality, we conducted controlled ablations on the same 30-prompt cohort. Each ablation removes one validation component while keeping others intact.

**Baseline Performance** (all validation layers active):
- Viability: 73.3% (22/30 apps pass both AB-01 Boot and AB-02 Prompt)
- Mean Quality: 8.06 (among all 30 apps)
- Strong CRUD operations with AB-03 Create at 91.7% pass rate

**Finding 1: Removing Unit Tests Trades Quality for Viability**
- Viability: 80.0% (+6.7 pp) — fewer apps fail smoke tests
- Mean Quality: 7.78 (−0.28) — quality degrades despite higher viability
- Key degradations: AB-04 View/Edit drops from 90% to 60% pass rate (−30 pp)
- Interpretation: Backend tests catch critical CRUD errors. Without them, apps boot successfully but fail on data operations.
- Source: `analysis/ablation_study_unit_tests.py`, output in `analysis/ablation_study_unit_tests.out`

**Finding 2: Removing Linting Has Mixed Effects**
- Viability: 80.0% (+6.7 pp)
- Mean Quality: 8.25 (+0.19) — slight improvement
- Trade-offs: AB-03 Create drops 8.3 pp, AB-04 View/Edit drops 7.6 pp, but AB-07 Performance improves 4.1 pp
- Interpretation: ESLint catches legitimate issues but may also block valid patterns. The performance gain suggests some lint rules may be overly restrictive.
- Source: `analysis/ablation_study_no_lint.py`, detailed transitions in `analysis/ablation_no_lint_analysis/`

**Finding 3: Removing Playwright Tests Significantly Improves Outcomes**
- Viability: 90.0% (+16.7 pp) — highest among all configurations
- Mean Quality: 8.62 (+0.56) — meaningful quality improvement
- Broad improvements: AB-02 Prompt +11.8 pp, AB-06 Clickable +5.7 pp
- Interpretation: Playwright tests appear overly brittle for scaffolded apps. Many apps that fail E2E tests actually work correctly for users. The 36 improved vs 6 regressed cases for AB-02 support this interpretation.
- Source: `analysis/ablation_study_no_playwright.py`, case analysis in `analysis/ablation_no_playwright_analysis/`

#### 6.7 Synthesis: Optimal Validation Strategy

Our ablation results reveal clear trade-offs in validation design:

**Validation Layer Impact Summary:**
1. **Unit/Handler Tests**: Essential for data integrity. Removing them increases perceived viability but causes real functional regressions (especially AB-04 View/Edit).
2. **ESLint**: Provides modest value with some false positives. The small quality impact (+0.19) and mixed per-dimension effects suggest selective application.
3. **Playwright/E2E**: Currently causes more harm than good. The +16.7 pp viability gain and quality improvements indicate these tests reject too many working applications.

**Recommended Validation Architecture:**
Based on these findings, we recommend:
- **Keep**: Lightweight smoke tests (boot + primary route), backend unit tests for CRUD operations
- **Refine**: ESLint with curated rules focusing on actual errors vs style preferences
- **Replace**: Full E2E suite with targeted integration tests for critical paths only

This pragmatic approach balances catching real defects while avoiding false rejections of functional applications. The goal is maximizing developer value — catching bugs that matter while maintaining high throughput of viable applications.
