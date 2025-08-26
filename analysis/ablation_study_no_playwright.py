"""
# Ablation Study: Impact of Removing Playwright (E2E) on LLM-Generated Application Quality

## Focus
This script focuses on viability analysis and complementary quality summaries for the
Playwright ablation (no_playwright) compared to the baseline condition.

We emphasize effect sizes and observed deltas rather than strict significance claims,
mirroring the paper-friendly framing.
"""

# %% [markdown]
# ## 1. Data Loading

# %%
import pandas as pd
import numpy as np
from pathlib import Path
from scipy import stats

# Load human evaluation data
analysis_dir = Path("/Users/evgenii.kniazev/projects/app.build-neurips25/analysis")

baseline_df = pd.read_csv(analysis_dir / "app.build-neurips25 - baseline.csv")
no_playwright_df = pd.read_csv(analysis_dir / "app.build-neurips25 - ablations_no_playwright.csv")

# Clean column names
baseline_df.columns = baseline_df.columns.str.strip()
no_playwright_df.columns = no_playwright_df.columns.str.strip()

print("Dataset loaded: baseline vs no_playwright")
print(f"Rows: baseline={len(baseline_df)}, no_playwright={len(no_playwright_df)}")

# %% [markdown]
# ## 2. Viability Analysis
#
# Viability is defined as not failing critical gates:
# - AB-01 Boot != FAIL
# - AB-02 Prompt != FAIL

# %%
def compute_viability_flags(df: pd.DataFrame) -> pd.Series:
    return ~((df["AB-01 Boot"].astype(str) == "FAIL") | (df["AB-02 Prompt"].astype(str) == "FAIL"))

base_viable = compute_viability_flags(baseline_df)
npw_viable = compute_viability_flags(no_playwright_df)

base_v_rate = base_viable.mean()
npw_v_rate = npw_viable.mean()
v_delta_pp = (npw_v_rate - base_v_rate) * 100.0

print("\n=== Viability (critical gates AB-01 & AB-02) ===")
print(f"Baseline viability:      {base_v_rate:.1%} ({int(base_viable.sum())}/{len(baseline_df)})")
print(f"No Playwright viability: {npw_v_rate:.1%} ({int(npw_viable.sum())}/{len(no_playwright_df)})")
print(f"Δ Viability:             {v_delta_pp:+.1f} pp")

# Optional chi-square for reference (avoid strict language in paper text)
contingency = np.array([
    [int(base_viable.sum()), int(len(baseline_df) - base_viable.sum())],
    [int(npw_viable.sum()), int(len(no_playwright_df) - npw_viable.sum())],
])
chi2, p_val = stats.chi2_contingency(contingency)[:2]
print(f"(chi2={chi2:.3f}, p={p_val:.4f}; provided for reference)")

# Breakdown of gate failures
def count_fail(df: pd.DataFrame, col: str) -> int:
    return int((df[col].astype(str) == "FAIL").sum())

print("\nCritical gate fails (counts):")
print(f"AB-01 Boot   FAIL: baseline={count_fail(baseline_df, 'AB-01 Boot')}  no_playwright={count_fail(no_playwright_df, 'AB-01 Boot')}")
print(f"AB-02 Prompt FAIL: baseline={count_fail(baseline_df, 'AB-02 Prompt')}  no_playwright={count_fail(no_playwright_df, 'AB-02 Prompt')}")

# %% [markdown]
# ## 3. Complementary Quality Summary (Optional)
# A simple aggregate quality score for context:
# PASS=1, WARN=0.5, FAIL=0; NA excluded per-dimension.

# %%
AB_COLUMNS = [
    "AB-01 Boot",
    "AB-02 Prompt",
    "AB-03 Create",
    "AB-04 View/Edit",
    "AB‑06 Clickable Sweep",
    "AB‑07 Performance >75",
]

def quality_score_row(row: pd.Series, cols: list[str]) -> float | None:
    scores = []
    for c in cols:
        val = str(row.get(c, "NA"))
        if val == "PASS":
            scores.append(1.0)
        elif val == "WARN":
            scores.append(0.5)
        elif val == "FAIL":
            scores.append(0.0)
        else:
            # NA or missing -> skip
            continue
    return (sum(scores) / len(scores) * 10.0) if scores else None

baseline_df["quality_score"] = baseline_df.apply(lambda r: quality_score_row(r, AB_COLUMNS), axis=1)
no_playwright_df["quality_score"] = no_playwright_df.apply(lambda r: quality_score_row(r, AB_COLUMNS), axis=1)

base_q = float(pd.to_numeric(baseline_df["quality_score"]).mean())
npw_q = float(pd.to_numeric(no_playwright_df["quality_score"]).mean())
q_delta = npw_q - base_q

print("\n=== Aggregate Quality (0-10) ===")
print(f"Baseline mean quality:      {base_q:.2f}")
print(f"No Playwright mean quality: {npw_q:.2f}")
print(f"Δ Quality:                  {q_delta:+.2f}")

# %% [markdown]
# ## 4. Dimension Pass-Rate Deltas (Non-NA denominators)

# %%
def pass_rate_non_na(df: pd.DataFrame, col: str) -> tuple[float, int]:
    non_na = df[col].astype(str).isin(["PASS", "WARN", "FAIL"]).sum()
    if non_na == 0:
        return 0.0, 0
    passed = (df[col].astype(str) == "PASS").sum()
    return passed / non_na, non_na

print("\n=== Per-Dimension Pass Rates (Baseline vs No Playwright) ===")
for col in AB_COLUMNS:
    b_rate, b_n = pass_rate_non_na(baseline_df, col)
    n_rate, n_n = pass_rate_non_na(no_playwright_df, col)
    delta_pp = (n_rate - b_rate) * 100.0
    print(f"{col}: Baseline={b_rate*100:.1f}%  NoPlay={n_rate*100:.1f}%  Δ={delta_pp:+.1f}pp (non-NA: {b_n} vs {n_n})")

# %% [markdown]
# ## 5. Notes for Paper Framing
# - Report observed deltas and effect sizes; avoid binary significance claims.
# - Use viability deltas and AB-02/AB-04 deltas to characterize trends.


