---
code: R-003
title: Convergence of First-Order Methods
summary: A careful study of when gradient methods converge, how fast, and what the constants mean.
question: Which assumptions are really needed for gradient descent to converge at a given rate?
status: exploring
topic: math
methods: [m-optimization]
updatedAt: 2026-09-12
sample: true
---

## Question

Textbook rates for gradient descent come with assumptions — smoothness, convexity, strong convexity. Which
of them are doing the work, and what happens to the rate when one is relaxed?

## Approach

Work through the proofs by hand, then check each bound numerically on quadratic and logistic objectives.
For an $L$-smooth convex $f$ with step size $1/L$:

$$
f(x_k) - f(x^\star) \le \frac{L\,\lVert x_0 - x^\star\rVert^2}{2k}.
$$

## Evidence

Proof notes and numerical checks are collected in the field notes (N-001).

## Limitations

A study project, not new research: the value is in understanding, and it is labelled as such.

> **Sample dossier.** Placeholder content showing a mathematics study entry.
