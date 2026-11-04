---
code: N-001
title: Why 1/L? Notes on the Descent Lemma
summary: The one inequality behind most gradient-descent proofs, derived slowly.
date: 2026-09-12
topic: math
lang: en
sample: true
---

**Question.** Why is $1/L$ the "safe" step size for an $L$-smooth function?

**Key idea.** If $\nabla f$ is $L$-Lipschitz, then for all $x, y$

$$
f(y) \le f(x) + \langle \nabla f(x),\, y - x\rangle + \frac{L}{2}\lVert y - x\rVert^2 .
$$

Put $y = x - \eta \nabla f(x)$:

$$
f(y) \le f(x) - \eta\Big(1 - \frac{L\eta}{2}\Big)\lVert \nabla f(x)\rVert^2 .
$$

The bracket is positive for $0 < \eta < 2/L$ and the guaranteed decrease is largest at $\eta = 1/L$, where
$f(y) \le f(x) - \tfrac{1}{2L}\lVert\nabla f(x)\rVert^2$.

**Open ends.** The bound is tight for quadratics but loose almost everywhere else — which is why line
search and adaptive methods exist.

> **Sample note.** Placeholder showing how a mathematics note renders, formulas included.
