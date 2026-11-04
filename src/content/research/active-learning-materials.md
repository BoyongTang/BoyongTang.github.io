---
code: R-001
title: Active Learning for Materials Science
summary: Reproduce published active-learning work first, then turn it into one closed loop that can move to other material systems.
question: How few new labels does it take to learn a whole structure–property map, phase diagram or potential-energy surface?
status: ongoing
topic: ml
updatedAt: 2026-11-04
draft: true
---

## Question

In materials science every new label is a synthesis, a measurement or an expensive simulation. The question is how
few of them are needed to learn the *whole* mapping — a structure–property map, a phase diagram, a potential-energy
surface — and not just one good point on it.

## Motivation

Active-learning papers in materials science use different data, different surrogate models and different ways of
scoring success. Before any new method is worth proposing, the existing ones have to run, on their own data, under one
protocol. Reproduction is the first result, not a chore before the result.

## Approach

**Reproduce first, transfer second.** Run each method on its public paper, public data and the authors' code; then
distil what works into a general loop.

The loop has six steps:

1. **Representation** — how a material is turned into features.
2. **Surrogate** — a model of the property (GP, random forest, XGBoost, MLP or GNN).
3. **Mean and uncertainty** — the surrogate's prediction $\mu(x)$ and its uncertainty $\sigma(x)$.
4. **Query strategy** — which unlabelled candidates to label next.
5. **New labels** — from experiment or simulation.
6. **Retrain** — add the labels and go round again.

The simplest query strategy, uncertainty sampling, picks the candidate the model knows least about:

$$
x_{\text{next}} = \arg\max_{x \in \mathcal{U}} \ \sigma(x),
$$

where $\mathcal{U}$ is the unlabelled pool. The surrogate is a model, not a strategy: swapping a random forest for a
GNN changes $\mu$ and $\sigma$, not the rule that turns them into a choice.

## Evidence

Work in progress. Each reproduced paper gets an executable reproduction path, and the status of every path with its
run evidence is kept in a machine-readable manifest. That repository is not public yet; results will be linked here
when they can be shared.

## Limitations

A reproduction is only as faithful as the published data and code allow, and a gap can come from the original work or
from the re-run. A loop that works on public benchmarks is not yet evidence that it works on a new material system.

## Next

- Bring every reproduced method under the same loop and the same evaluation protocol.
- Transfer the loop to other material systems, such as adhesives.
