#!/bin/bash
# Analysis Reproduction Script
# Reruns the analysis from raw data and displays results

set -e

echo "=== SANER 2026 Paper - Analysis Reproduction Script ==="
echo ""
echo "Regenerating all results from raw dataset..."
echo ""

if [ ! -f "analyze_benchmark.py" ]; then
    echo "Error: analyze_benchmark.py not found"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: python3 not found"
    exit 1
fi

# Check if required Python packages are installed
echo "Checking dependencies..."
if ! python3 -c "import polars, ujson, fire" 2>/dev/null; then
    echo ""
    echo "Error: Missing required Python packages"
    echo "Please install dependencies from parent directory:"
    echo "  cd .."
    echo "  pip install polars ujson fire"
    echo ""
    exit 1
fi
echo "Dependencies OK"
echo ""

# Run the analysis
python3 analyze_benchmark.py

echo ""
echo "=== Analysis Complete ==="
echo ""
echo "Results regenerated in: results/"
echo "  - results/baseline/raw_results.csv (30 experiments)"
echo "  - results/openmodels/raw_results.csv (180 experiments)"
echo "  - results/no_lint/raw_results.csv (30 experiments)"
echo "  - results/no_playwright/raw_results.csv (30 experiments)"
echo "  - results/no_tests/raw_results.csv (30 experiments)"
echo "  - results/all_results.csv (300 experiments combined)"
echo ""
echo "Compare these CSV files with the paper tables."
echo ""
