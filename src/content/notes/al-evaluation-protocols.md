---
code: N-002
title: Reading Log — Evaluation Protocols in Active Learning
summary: How papers compare acquisition strategies, and the ways a comparison can quietly go wrong.
date: 2026-10-08
topic: discovery
lang: en
sample: true
---

**Question.** When a paper says "strategy A beats random sampling", what exactly was compared?

**What to check.**

1. Was the test set fixed *before* any strategy was tuned?
2. Is the initial labelled pool the same across strategies and seeds?
3. Is the budget counted in experiments, batches, or wall-clock time?
4. Are curves averaged over enough seeds to show their spread?

**Open ends.** Most benchmarks reward finding *a* good candidate; real campaigns often need several diverse ones.

> **Sample note.** Placeholder reading log.
