---
code: N-002
title: A Checklist for Leakage-free Comparisons
summary: What has to be fixed before two strategies, or two models, can be compared at all.
date: 2026-11-04
topic: evaluation
lang: en
draft: true
---

**Question.** When a result says "strategy A beats random sampling", what exactly was compared — and would it survive
a clean re-run?

**Checklist.**

1. **Split before anything else.** The test set is fixed before any model or strategy is tuned, and nothing about it
   leaks into feature engineering or hyperparameter search.
2. **Same start.** Every strategy begins from the same initial labelled pool.
3. **Same budget unit.** The budget is counted the same way for every strategy — labels, batches or experiments.
4. **Many seeds.** Curves are averaged over several random seeds and show their spread, not one lucky run.
5. **Right metric for the goal.** Learning a map is scored with error and calibration; finding an optimum is scored
   with best-so-far and regret (see N-001).
6. **A model card.** Data, split, metric and known limits are written down next to the number.

**Open ends.** Most benchmarks reward finding *a* good candidate; real campaigns often need several diverse ones, and
the checklist above does not yet say how to score that.
