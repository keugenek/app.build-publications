"""
# Ablation Study: Impact of Unit Tests on LLM-Generated Application Quality

## Abstract
We investigate the effect of removing unit tests from the development process on the quality 
of LLM-generated web applications. Through human evaluation of 30 applications across two 
conditions (with/without unit tests), we analyze multiple quality dimensions including 
functionality, UI interactions, and overall viability.

## 1. Introduction

Modern LLMs can generate complete web applications, but the role of software engineering 
practices like unit testing in this context remains unclear. We examine whether unit tests 
meaningfully impact application quality when code is AI-generated rather than human-written.

**Research Question**: Do unit tests improve the quality of LLM-generated applications, 
and if so, which aspects are most affected?
"""

# %% [markdown]
# ## 2. Data and Methods

# %%
import pandas as pd
import numpy as np
from pathlib import Path
import seaborn as sns
import matplotlib.pyplot as plt
from scipy import stats

# Load human evaluation data
analysis_dir = Path("/Users/evgenii.kniazev/projects/app.build-neurips25/analysis")

baseline_df = pd.read_csv(analysis_dir / "app.build-neurips25 - baseline.csv")
no_tests_df = pd.read_csv(analysis_dir / "app.build-neurips25 - ablations_no_tests.csv")

# Clean column names
baseline_df.columns = baseline_df.columns.str.strip()
no_tests_df.columns = no_tests_df.columns.str.strip()

print(f"Dataset: {len(baseline_df)} applications evaluated in each condition")
print(f"Evaluation dimensions: Boot, Prompt, Create, View/Edit, Clickable Sweep, Performance")

# %% [markdown]
"""
### 2.1 Evaluation Metrics

Human evaluators assessed each application across six dimensions:
- **AB-01 Boot**: Application starts successfully
- **AB-02 Prompt**: Follows the prompt requirements
- **AB-03 Create**: Create functionality works
- **AB-04 View/Edit**: View and edit operations function correctly
- **AB-06 Clickable Sweep**: UI elements are interactive
- **AB-07 Performance**: Performance score exceeds 75%

Each dimension is rated as PASS, WARN, FAIL, or NA.
"""

# %% [markdown]
# ## 3. Results

# %% [markdown]
# ### 3.1 Overall Quality Metrics

# %%
# Define evaluation dimensions
ab_columns = [
    "AB-01 Boot",
    "AB-02 Prompt", 
    "AB-03 Create",
    "AB-04 View/Edit",
    "AB‑06 Clickable Sweep",
    "AB‑07 Performance >75"
]

# Calculate viability (apps that boot and follow prompt)
baseline_viable = ~((baseline_df["AB-01 Boot"] == "FAIL") | (baseline_df["AB-02 Prompt"] == "FAIL"))
no_tests_viable = ~((no_tests_df["AB-01 Boot"] == "FAIL") | (no_tests_df["AB-02 Prompt"] == "FAIL"))

# Calculate quality scores
def calculate_quality_score(row, columns):
    scores = []
    for col in columns:
        if col in row and pd.notna(row[col]) and row[col] != "NA":
            if row[col] == "PASS":
                scores.append(1.0)
            elif row[col] == "WARN":
                scores.append(0.5)
            elif row[col] == "FAIL":
                scores.append(0.0)
    return sum(scores) / len(scores) * 10 if scores else None

baseline_df['quality_score'] = baseline_df.apply(lambda r: calculate_quality_score(r, ab_columns), axis=1)
no_tests_df['quality_score'] = no_tests_df.apply(lambda r: calculate_quality_score(r, ab_columns), axis=1)

# Summary statistics
results = pd.DataFrame({
    'Condition': ['With Tests', 'Without Tests'],
    'Viability Rate': [baseline_viable.mean(), no_tests_viable.mean()],
    'Quality Score': [baseline_df['quality_score'].mean(), no_tests_df['quality_score'].mean()],
    'Quality (Viable Only)': [
        baseline_df[baseline_viable]['quality_score'].mean(),
        no_tests_df[no_tests_viable]['quality_score'].mean()
    ]
})

print("\nTable 1: Overall Quality Metrics")
print(results.round(2))

# Calculate effect sizes
viability_diff = (no_tests_viable.mean() - baseline_viable.mean()) * 100
quality_diff = no_tests_df['quality_score'].mean() - baseline_df['quality_score'].mean()

print(f"\nObserved Changes:")
print(f"• Viability: {viability_diff:+.1f} percentage points")
print(f"• Quality Score: {quality_diff:+.2f} points (on 0-10 scale)")

# %% [markdown]
# ### 3.2 Dimension-Specific Analysis

# %%
# Analyze each dimension
dimension_results = []

for col in ab_columns:
    if col in baseline_df.columns and col in no_tests_df.columns:
        # Calculate pass rates
        baseline_pass = (baseline_df[col] == "PASS").mean()
        no_tests_pass = (no_tests_df[col] == "PASS").mean()
        
        # Calculate effect size (Cohen's h for proportions)
        h = 2 * (np.arcsin(np.sqrt(baseline_pass)) - np.arcsin(np.sqrt(no_tests_pass)))
        
        # Chi-square test
        baseline_pass_count = (baseline_df[col] == "PASS").sum()
        baseline_total = (baseline_df[col] != "NA").sum()
        no_tests_pass_count = (no_tests_df[col] == "PASS").sum()
        no_tests_total = (no_tests_df[col] != "NA").sum()
        
        if baseline_total > 0 and no_tests_total > 0:
            contingency = np.array([
                [baseline_pass_count, baseline_total - baseline_pass_count],
                [no_tests_pass_count, no_tests_total - no_tests_pass_count]
            ])
            chi2, p_value = stats.chi2_contingency(contingency)[:2]
        else:
            p_value = np.nan
        
        dimension_results.append({
            'Dimension': col.replace('AB-', '').replace(' >75', ''),
            'Baseline Pass Rate': f"{baseline_pass:.1%}",
            'No Tests Pass Rate': f"{no_tests_pass:.1%}",
            'Δ Pass Rate': f"{(no_tests_pass - baseline_pass)*100:+.1f}pp",
            'Effect Size (Cohen\'s h)': f"{abs(h):.2f}",
            'p-value': f"{p_value:.3f}" if not np.isnan(p_value) else "N/A"
        })

dimension_df = pd.DataFrame(dimension_results)
print("\nTable 2: Dimension-Specific Pass Rates and Effect Sizes")
print(dimension_df.to_string(index=False))

# %% [markdown]
# ### 3.3 Focus on AB-04 View/Edit

# %%
# Detailed analysis of AB-04 View/Edit
baseline_ab04 = baseline_df["AB-04 View/Edit"].value_counts()
no_tests_ab04 = no_tests_df["AB-04 View/Edit"].value_counts()

print(f"\nAB-04 View/Edit Distribution:")
print(f"With Tests: {dict(baseline_ab04)}")
print(f"Without Tests: {dict(no_tests_ab04)}")

# Pass rate analysis
baseline_pass_rate = (baseline_df["AB-04 View/Edit"] == "PASS").mean()
no_tests_pass_rate = (no_tests_df["AB-04 View/Edit"] == "PASS").mean()
baseline_n = (baseline_df["AB-04 View/Edit"] != "NA").sum()
no_tests_n = (no_tests_df["AB-04 View/Edit"] != "NA").sum()

# Wilson confidence intervals
def wilson_ci(p, n, z=1.96):
    denominator = 1 + z**2/n
    centre = (p + z**2/(2*n))/denominator
    offset = z * np.sqrt(p*(1-p)/n + z**2/(4*n**2))/denominator
    return centre - offset, centre + offset

baseline_ci = wilson_ci(baseline_pass_rate, baseline_n)
no_tests_ci = wilson_ci(no_tests_pass_rate, no_tests_n)

print(f"\nAB-04 View/Edit Analysis:")
print(f"• With Tests: {baseline_pass_rate:.1%} pass rate (95% CI: [{baseline_ci[0]:.1%}, {baseline_ci[1]:.1%}])")
print(f"• Without Tests: {no_tests_pass_rate:.1%} pass rate (95% CI: [{no_tests_ci[0]:.1%}, {no_tests_ci[1]:.1%}])")
print(f"• Observed difference: {(baseline_pass_rate - no_tests_pass_rate)*100:.0f} percentage points")
print(f"• Effect size (Cohen's h): {abs(2 * (np.arcsin(np.sqrt(baseline_pass_rate)) - np.arcsin(np.sqrt(no_tests_pass_rate)))):.2f}")

# %% [markdown]
# ### 3.4 Effect Size Interpretation

# %%
# Cohen's d for quality scores
baseline_quality = baseline_df['quality_score'].dropna()
no_tests_quality = no_tests_df['quality_score'].dropna()

pooled_std = np.sqrt(((len(baseline_quality)-1)*baseline_quality.std()**2 + 
                      (len(no_tests_quality)-1)*no_tests_quality.std()**2) / 
                     (len(baseline_quality) + len(no_tests_quality) - 2))
cohens_d = (baseline_quality.mean() - no_tests_quality.mean()) / pooled_std

print("\nEffect Size Summary:")
print(f"• Overall Quality (Cohen's d): {cohens_d:.2f} - {'Small' if abs(cohens_d) < 0.5 else 'Medium' if abs(cohens_d) < 0.8 else 'Large'} effect")
print(f"• AB-04 View/Edit (Cohen's h): 0.73 - Medium to large effect")
print(f"\nInterpretation: While overall quality shows minimal change, the AB-04 View/Edit dimension")
print(f"exhibits a substantial effect, suggesting unit tests primarily impact UI interaction correctness.")

# %% [markdown]
"""
## 4. Discussion

### Key Findings

1. **Viability Paradox**: Applications generated without unit tests show a slight *increase* 
   in viability (+6.7pp), suggesting tests may introduce complexity that occasionally 
   prevents basic functionality.

2. **Targeted Impact**: The most substantial effect appears in AB-04 View/Edit functionality, 
   with a 30 percentage point decrease in pass rate when tests are removed. This represents 
   a medium-to-large effect size (Cohen's h = 0.73).

3. **Overall Quality**: The aggregate quality score shows minimal change (-0.32 points on 
   a 10-point scale), with a small effect size (Cohen's d = 0.18).

### Implications

These results suggest that unit tests in LLM-generated applications serve a specific role: 
ensuring correct UI interactions and edit functionality. The LLM appears capable of generating 
fundamentally sound applications without tests, but subtle interaction bugs emerge that tests 
would typically catch.

### Limitations

- Sample size (n=30) provides limited statistical power
- Results specific to the evaluated application types
- Human evaluation may introduce subjective variation

## 5. Conclusions

Our ablation study reveals that unit tests have a **nuanced impact** on LLM-generated 
application quality:

- **Minimal effect** on overall application viability and aggregate quality scores
- **Substantial effect** on UI interaction correctness (AB-04 View/Edit)
- Effect sizes range from small (overall quality) to medium-large (specific functionality)

These findings suggest that while LLMs can generate working applications without tests, 
unit tests remain valuable for ensuring correct interactive behavior—a dimension that may 
be particularly challenging for current models to guarantee through generation alone.

**Future Work**: Larger-scale studies could provide more precise effect estimates and 
explore whether this pattern holds across different application types and LLM architectures.
"""
