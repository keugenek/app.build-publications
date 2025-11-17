# app.build Collaboration between Databricks Codegen team and THWS CAIRO Lab

This repository contains paper submissions and supporting materials for app.build prompt to application agent.

## Paper: Production Reliability at Scale: Scaffolding Systems for Agentic Prompt-to-App Generation

### About the Collaboration

This submission is a collaborative research effort between **Databricks - app.build team** and **THWS University of Applied Sciences Würzburg-Schweinfurt (CAIRO Lab)**, exploring how environment scaffolding transforms LLMs into production-ready software engineering agents. The research presents empirical evidence from the app.build platform - an open-source prompt-to-app generator that demonstrates systematic reliability improvements through structured environment design.

### Critical Finding: Template Detection Reveals Inflated Success Rates

Our evaluation uncovered a critical methodological issue affecting open-model benchmarking: **many "successful" apps that pass basic healthchecks are actually non-functional "Under Construction" templates**. This finding challenges reported success rates and highlights the importance of comprehensive validation beyond boot checks.

**GPT-OSS-120B Template Issue:**
- Reported healthcheck pass rate: 93.3% (84/90 apps boot successfully)
- **REAL success rate (excluding templates): 43.3% (39/90)**
- **Template failure rate: 53.6% - more than half its "successes" are fake!**
- **45 out of 84 "successful" runs were just templates with ZERO functionality**

**Qwen3-Coder-480B-A35B (for comparison):**
- Healthcheck pass rate: 88.9% (80/90 apps boot)
- **REAL success rate (excluding templates): 68.9% (62/90)**
- **Template failure rate: 22.5% (18/80 healthcheck-passing apps)**

**Key Insight:** Basic healthcheck validation (AB-01 Boot only) is insufficient for evaluating code generation quality. Template detection (AB-02 Prompt Correspondence) is essential to distinguish functional applications from placeholder scaffolding. This finding emphasizes why environment scaffolding must include multi-layered validation—not just compilation and boot checks, but also functional correctness verification.

### The app.build Tool

[app.build](https://app.build) is an open-source prompt-to-app generation platform (developed by  Databricks - app.build team) that enables reliable production deployment of AI-generated applications through:
- FSM-guided multi-agent orchestration
- Multi-layered validation pipelines
- Structured error recovery and feedback loops
- Production-grade quality gates

### Authors & Contributors

**app.build Team (Databricks - app.build team)**
- Evgenii Kniazev
- Arseny Kravchenko  
- Igor Rekun

**THWS CAIRO Lab**
- Prof. Dr. Ivan Yamshchikov
- Pranav Sah
- Pratik Nichite

Lab website: [https://www.thws.de/en/research/institutes/cairo](https://www.thws.de/en/research/institutes/cairo)

## Reproducing the Evaluation

### Prerequisites

1. **Install dependencies:**
   - [uv](https://docs.astral.sh/uv/getting-started/installation/) - Python package manager
   - [Docker](https://docs.docker.com/get-docker/) - Container runtime (must be running)

2. **API Keys:** Set the following environment variables:
   ```bash
   export ANTHROPIC_API_KEY=your-anthropic-key
   export GEMINI_API_KEY=your-gemini-key
   ```

### Step 1: Clone the Agent Repository

```bash
git clone https://github.com/neondatabase/appdotbuild-agent.git
cd appdotbuild-agent
```

### Step 2: Checkout the Evaluation Baseline

The evaluation was conducted using commit `e362615` (August 14, 2025):

```bash
git checkout e362615
```

### Step 3: Run the Benchmark

Navigate to the agent directory and run the benchmark script:

```bash
cd agent
uv run python benchmark.py matrix --concurrent=1 --resume=True
```

**Configuration:**
- `--concurrent=1`: Run experiments sequentially (use higher values for parallel execution)
- `--resume=True`: Skip already completed experiments if resuming an interrupted run

**What it does:**
- Generates applications for each prompt-template-model combination
- Validates each app with Docker health checks
- Captures telemetry (tokens, API calls, costs)
- Saves all artifacts to `benchmark_results/`

**Expected output structure:**
```
benchmark_results/
├── prompt-name_trpc-agent_claude_gemini/
│   ├── source_code/          # Generated application code
│   ├── telemetry.json         # Token usage and API calls
│   ├── status.json            # Success/failure, duration
│   ├── stdout.log             # Generation logs
│   └── stderr.log             # Error logs
└── summary.csv                # Aggregated results
```

### Step 4: Run a Single Test (Optional)

To test a single configuration:

```bash
cd agent
uv run python benchmark.py single \
  --prompt "A simple inventory management system" \
  --template-id "trpc_agent" \
  --output-dir "./test_run"
```

### Step 5: Reproduce Paper Results

The evaluation dataset and all analysis scripts are included in this repository. Follow these steps to reproduce the paper's tables and figures:

#### 5.1 Quick Verification (Recommended First Step)

Run the automated verification script to ensure all files are present:

```bash
cd analysis
bash verify_reproduction_setup.sh
```

**This checks:**
- ✓ All dataset directories (baseline, openmodels, ablations)
- ✓ Pre-computed results CSV files
- ✓ Analysis scripts and notebooks
- ✓ Documentation files
- ✓ Data integrity (300 total experiments)

**Expected output:** `✓ All checks passed!`

**Manual verification (alternative):**

```bash
cd analysis

# View the original evaluation dataset
ls dataset/baseline/        # 30 baseline experiments
ls dataset/openmodels/      # 180 open model experiments
ls dataset/ablations/       # Ablation study experiments

# Check pre-computed results
cat results/baseline/summary_stats.csv
cat results/openmodels/summary_stats.csv

# Verify data integrity
python3 -c "
import csv
for cohort in ['baseline', 'no_lint', 'no_playwright', 'no_tests']:
    with open(f'results/{cohort}/raw_results.csv') as f:
        count = len(list(csv.DictReader(f)))
    print(f'{cohort}: {count} experiments')
"
```

**Expected output:**
```
baseline: 30 experiments
no_lint: 30 experiments
no_playwright: 30 experiments
no_tests: 30 experiments
```

#### 5.2 Regenerate Results from Raw Data

To regenerate all results tables from the raw dataset:

```bash
cd analysis
bash run_analysis_and_compare.sh
```

This script will:
1. Process all experiments in dataset/baseline/, dataset/openmodels/, dataset/ablations/
2. Calculate success rates, costs, token usage
3. Generate results/*.csv files with summary statistics
4. Output can be compared with paper Table III

**Manual run (alternative):**
```bash
cd analysis
python analyze_benchmark.py
```

**Output location:** `results/` directory
- `results/baseline/raw_results.csv` - Per-experiment baseline data
- `results/openmodels/raw_results.csv` - Open model experiments
- `results/no_lint/`, `results/no_playwright/`, `results/no_tests/` - Ablation results
- `results/all_results.csv` - Combined dataset (300 experiments)

#### 5.3 Run Analysis Notebooks (Interactive)

For detailed analysis with visualizations:

```bash
cd analysis

# Install notebook dependencies
pip install -r requirements.txt

# Create symlinks for .out files (one-time setup)
ln -sf benchmark_baseline.out baseline.out
ln -sf benchmark_ablation_no_lint.out ablation_no_lint.out
ln -sf benchmark_ablation_no_playwright.out ablation_no_playwright.out
ln -sf benchmark_ablation_no_tests.out ablation_no_tests.out

# Launch Jupyter
jupyter notebook
```

**Available notebooks:**
1. **`automated_results_analysis.ipynb`** - Reproduces paper Table III (n=300)
   - Baseline vs open models comparison
   - Ablation study results
   - Token usage and cost analysis
   - Generates all automated metrics

2. **`experiments_baseline_ablation_analysis.ipynb`** - Human evaluation (n=30)
   - Viability rates (Table V)
   - Quality scores per check (Table VI)
   - Ablation impact on quality

**Reproduces these paper sections:**
- Table III: Large-Scale Automated Results
- Table IV: Resource Consumption Breakdown
- Table V: Aggregated Evaluation Results (n=30)
- Table VI: Check-Specific Outcomes

#### 5.4 Run Ablation Study Scripts

For statistical analysis of ablations:

```bash
cd analysis

# Ablation study: Impact of removing lint validation
python ablation_study_no_lint.py

# Ablation study: Impact of removing Playwright E2E tests
python ablation_study_no_playwright.py

# Ablation study: Impact of removing unit tests
python ablation_study_unit_tests.py
```

These scripts perform:
- Paired cohort comparisons (aligned by prompt)
- Viability rate analysis (AB-01, AB-02 gates)
- Per-check quality degradation analysis
- Statistical summaries (mean, median, effect sizes)

**Output:** Text summaries printed to stdout, matches paper Section III-G

#### 5.5 Files Needed for Reproduction

**Essential files (all included):**
```
analysis/
├── dataset/                       # Raw evaluation data (300 experiments)
│   ├── baseline/                  # 30 experiments with Claude Sonnet 4
│   ├── openmodels/                # 180 experiments with Qwen/GPT-OSS
│   └── ablations/                 # 90 ablation experiments
│       ├── benchmark_results_no_lint/
│       ├── benchmark_results_no_playwright/
│       └── benchmark_results_no_tests/
├── results/                       # Pre-computed analysis results
│   ├── baseline/raw_results.csv
│   ├── openmodels/raw_results.csv
│   ├── no_lint/raw_results.csv
│   ├── no_playwright/raw_results.csv
│   └── no_tests/raw_results.csv
├── analyze_benchmark.py           # Main analysis script
├── automated_results_analysis.ipynb
├── experiments_baseline_ablation_analysis.ipynb
├── ablation_study_no_lint.py
├── ablation_study_no_playwright.py
├── ablation_study_unit_tests.py
├── requirements.txt               # Python dependencies
└── verify_reproduction_setup.sh   # Automated verification script
```

**Dependencies:**
- Python 3.12+
- pandas, numpy, polars, ujson, fire (for scripts)
- jupyter, matplotlib, seaborn (for notebooks)

### Evaluation Timeline

The original evaluation was conducted on **August 19-20, 2025** using:
- **Framework version:** commit `e362615` (August 14, 2025)
- **30 prompts** across varying complexity levels
- **Multiple configurations:** baseline + ablation studies
- **Total experiments:** 300 end-to-end generation runs

### Data Availability

- **Evaluation dataset:** `analysis/dataset/` - Generated applications with full source code
- **Results:** `analysis/results/` - Experimental results and validation data
- **Analysis scripts:** `analysis/*.py` - Reproduction scripts
- **Human assessments:** See [Assessor Handbook](https://docs.google.com/spreadsheets/d/1hvx2IpySdcOP8VfibnWZr3unyDinJ79OhQ5lfqwWfp0/)

### Troubleshooting

**Docker not running:**
```
Error: Cannot connect to the Docker daemon
```
Solution: Start Docker Desktop or `dockerd` service

**Missing API keys:**
```
Error: ANTHROPIC_API_KEY not found
```
Solution: Export API keys as environment variables

**Port conflicts:**
The benchmark automatically allocates free ports, but if you encounter conflicts, ensure no other services are using ports 8080+

### Cost Estimates

Based on the original evaluation:
- **Per app (baseline):** ~$5 (Claude Sonnet 4 + Gemini Flash)
- **Full 30-prompt run:** ~$150
- **Complete 300-experiment matrix:** ~$1,500

Use smaller prompt sets or open-weights models to reduce costs.

