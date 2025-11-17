#!/bin/bash
# Reproduction Setup Verification Script
# Checks that all required files and data are present for reproducing paper results

set -e

echo "=== SANER 2026 Paper Reproduction Setup Verification ==="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((ERRORS++))
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        COUNT=$(find "$1" -maxdepth 1 -type f -o -type d | wc -l)
        echo -e "${GREEN}✓${NC} $1 ($((COUNT-1)) items)"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((ERRORS++))
        return 1
    fi
}

check_symlink() {
    if [ -L "$1" ]; then
        TARGET=$(readlink "$1")
        echo -e "${GREEN}✓${NC} $1 -> $TARGET"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $1 (symlink not created)"
        ((WARNINGS++))
        return 1
    fi
}

echo "1. Checking dataset directories..."
check_dir "dataset/baseline"
check_dir "dataset/openmodels"
check_dir "dataset/ablations"

echo ""
echo "2. Checking pre-computed results..."
check_dir "results/baseline"
check_dir "results/openmodels"
check_dir "results/no_lint"
check_dir "results/no_playwright"
check_dir "results/no_tests"
check_file "results/all_results.csv"

echo ""
echo "3. Checking analysis scripts..."
check_file "analyze_benchmark.py"
check_file "ablation_study_no_lint.py"
check_file "ablation_study_no_playwright.py"
check_file "ablation_study_unit_tests.py"

echo ""
echo "4. Checking notebooks..."
check_file "automated_results_analysis.ipynb"
check_file "experiments_baseline_ablation_analysis.ipynb"

echo ""
echo "5. Checking .out files..."
check_file "benchmark_baseline.out"
check_file "benchmark_ablation_no_lint.out"
check_file "benchmark_ablation_no_playwright.out"
check_file "benchmark_ablation_no_tests.out"

echo ""
echo "6. Checking symlinks (optional, for notebooks)..."
check_symlink "baseline.out"
check_symlink "ablation_no_lint.out"
check_symlink "ablation_no_playwright.out"
check_symlink "ablation_no_tests.out"

echo ""
echo "7. Checking documentation..."
check_file "requirements.txt"
check_file "../README.md"

echo ""
echo "8. Verifying data integrity..."
if command -v python3 &> /dev/null; then
    python3 << 'EOF'
import csv
from pathlib import Path

cohorts = ['baseline', 'no_lint', 'no_playwright', 'no_tests']
expected_counts = {'baseline': 30, 'no_lint': 30, 'no_playwright': 30, 'no_tests': 30}

all_good = True
for cohort in cohorts:
    csv_path = Path(f'results/{cohort}/raw_results.csv')
    if csv_path.exists():
        with open(csv_path) as f:
            count = len(list(csv.DictReader(f)))
        expected = expected_counts[cohort]
        if count == expected:
            print(f'\033[0;32m✓\033[0m {cohort}: {count} experiments')
        else:
            print(f'\033[0;31m✗\033[0m {cohort}: {count} experiments (expected {expected})')
            all_good = False
    else:
        print(f'\033[0;31m✗\033[0m {cohort}: CSV file missing')
        all_good = False

# Check openmodels
openmodels_csv = Path('results/openmodels/raw_results.csv')
if openmodels_csv.exists():
    with open(openmodels_csv) as f:
        count = len(list(csv.DictReader(f)))
    if count == 180:
        print(f'\033[0;32m✓\033[0m openmodels: {count} experiments')
    else:
        print(f'\033[0;31m✗\033[0m openmodels: {count} experiments (expected 180)')
        all_good = False
else:
    print(f'\033[0;31m✗\033[0m openmodels: CSV file missing')
    all_good = False

if not all_good:
    exit(1)
EOF
    if [ $? -eq 0 ]; then
        echo ""
    else
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Python3 not found, skipping data integrity check"
    ((WARNINGS++))
fi

echo ""
echo "=== SUMMARY ==="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Setup is complete. You can now:"
    echo "  1. Verify results: python3 -c \"import csv; ..."
    echo "  2. Regenerate results: python analyze_benchmark.py"
    echo "  3. Run notebooks: jupyter notebook"
    echo "  4. Run ablation studies: python ablation_study_*.py"
    echo ""
    echo "See ../README.md section 'Step 5: Reproduce Paper Results' for details."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Warnings are usually optional components (like symlinks)."
    echo "You can still reproduce the paper results."
    echo ""
    echo "To fix warnings, run:"
    echo "  ln -sf benchmark_baseline.out baseline.out"
    echo "  ln -sf benchmark_ablation_no_lint.out ablation_no_lint.out"
    echo "  ln -sf benchmark_ablation_no_playwright.out ablation_no_playwright.out"
    echo "  ln -sf benchmark_ablation_no_tests.out ablation_no_tests.out"
    exit 0
else
    echo -e "${RED}✗ Setup incomplete: $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please check the errors above and ensure all required files are present."
    echo "Refer to DATA_VERIFICATION.md and ../README.md for file structure details."
    exit 1
fi
