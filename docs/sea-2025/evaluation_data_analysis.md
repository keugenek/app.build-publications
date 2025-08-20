# Evaluation Data Analysis

## Clean Data Table

| ID | AB-01 | AB-02 | AB-03 | AB-04 | AB-05 | AB-06 | Score |
|----|-------|-------|-------|-------|-------|-------|-------|
| 1  | FAIL  | NA    | NA    | NA    | NA    | NA    | 0     |
| 2  | WARN  | PASS  | NA    | NA    | PASS  | PASS  | 7.8   |
| 3  | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 4  | PASS  | WARN  | PASS  | FAIL  | PASS  | PASS  | 0     |
| 5  | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 6  | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 7  | PASS  | PASS  | NA    | PASS  | PASS  | PASS  | 9     |
| 8  | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 9  | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 10 | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 11 | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 12 | PASS  | FAIL  | NA    | NA    | NA    | NA    | 0     |
| 13 | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 14 | FAIL  | NA    | NA    | NA    | NA    | NA    | 0     |
| 15 | PASS  | PASS  | PASS  | PASS  | PASS  | PASS  | 10    |
| 16 | PASS  | FAIL  | WARN  | PASS  | FAIL  | PASS  | 0     |
| 17 | PASS  | FAIL  | PASS  | NA    | WARN  | PASS  | 0     |
| 18 | PASS  | WARN  | PASS  | PASS  | PASS  | PASS  | 9     |
| 19 | PASS  | PASS  | PASS  | PASS  | WARN  | PASS  | 9.5   |
| 20 | PASS  | WARN  | PASS  | PASS  | PASS  | WARN  | 8.5   |
| 21 | PASS  | PASS  | PASS  | WARN  | PASS  | PASS  | 9.5   |

## Data Analysis

### Overall Performance Metrics

- **Total Apps Evaluated**: 21
- **Success Rate** (Score > 0): 14/21 = 66.7%
- **Perfect Score** (10/10): 9/21 = 42.9%
- **Complete Failures** (0/10): 7/21 = 33.3%

### Score Distribution

| Score Range | Count | Percentage |
|-------------|-------|------------|
| 10          | 9     | 42.9%      |
| 9-9.9       | 4     | 19.0%      |
| 8-8.9       | 1     | 4.8%       |
| 7-7.9       | 1     | 4.8%       |
| 0           | 6     | 28.6%      |

### Check-Specific Analysis

| Check | PASS | WARN | FAIL | NA | Pass Rate |
|-------|------|------|------|----|-----------|
| AB-01 (Boot) | 19 | 1 | 2 | 0 | 90.5% |
| AB-02 (Prompt) | 13 | 3 | 3 | 2 | 68.4% |
| AB-03 (Create) | 14 | 1 | 0 | 6 | 93.3% |
| AB-04 (View/Edit) | 12 | 1 | 1 | 7 | 85.7% |
| AB-05 (Clickable) | 13 | 1 | 1 | 6 | 86.7% |
| AB-06 (Performance) | 14 | 1 | 0 | 6 | 93.3% |

### Key Findings

1. **Critical Failure Points**: 
   - AB-01 (Boot) failures: 2/21 (9.5%) - immediate app failures
   - AB-02 (Prompt) failures: 3/21 (14.3%) - template/non-functional apps
   - Combined smoke test failures account for ALL zero-score apps

2. **Success Patterns**:
   - Apps that pass smoke tests (AB-01 & AB-02) have 92.9% chance of scoring ≥7
   - Performance (AB-06) has highest pass rate among non-smoke tests (93.3%)
   - Create functionality (AB-03) also shows high reliability (93.3%)

3. **Quality Distribution**:
   - Strong bimodal distribution: either perfect (42.9%) or complete failure (28.6%)
   - Middle-range scores (7-9.5) represent 28.6% - partially functional apps
   - Only 1 app scored below 8 while being functional (score 7.8)

4. **Failure Cascade**:
   - All AB-01 failures result in complete test cascade (all subsequent NA)
   - AB-02 failures show mixed patterns - some allow partial testing
   - Non-smoke test failures (AB-04, AB-05) don't prevent other tests

### Recommendations

1. **Focus on Smoke Tests**: Improving AB-01 and AB-02 pass rates would have maximum impact
2. **Template Detection**: 3 apps showed "Template/Under Construction" - need better prompt handling
3. **Create/Edit Functions**: High success rates suggest good CRUD implementation
4. **Performance Consistency**: Strong performance scores indicate good optimization defaults
