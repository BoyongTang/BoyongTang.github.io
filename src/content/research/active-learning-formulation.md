---
code: R-001
title: Active Learning for Formulation Discovery
summary: Choosing the next experiment when good candidates are rare and every measurement is expensive.
question: Which experiment should be run next, when high-performing candidates are rare?
status: ongoing
topic: discovery
methods: [m-acquisition, m-uq]
updatedAt: 2026-11-04
sample: true
---

## Question

What makes a sample-selection strategy effective when high-performing candidates are rare? In formulation
problems every measurement costs time and material, so the order in which experiments are run matters as
much as the model that suggests them.

## Motivation

A good surrogate model is not enough on its own. If the model is confident in the wrong places, it keeps
proposing variations of what is already known. The interesting part is the *policy* — how uncertainty is
turned into a decision.

## Approach

- A structured surrogate model over the formulation space.
- Uncertainty-aware acquisition: expected improvement, upper confidence bound, and a batch variant.
- A locked evaluation protocol fixed before the comparison is run.

The acquisition rule used as the baseline is the expected improvement over the incumbent $f^\*$:

$$
\mathrm{EI}(x) = \mathbb{E}\big[\max(0,\ f(x) - f^\*)\big].
$$

## Evidence

The study measures discovery efficiency — how many evaluations are needed to find a candidate above a
threshold — under the pre-specified protocol. Results will be added here when they can be shared.

## Limitations

Results depend on data availability, protocol choices, and how well the surrogate's uncertainty is
calibrated. A simulated benchmark is not the same as a laboratory campaign.

## Next

- Compare calibration methods for the surrogate's predictive variance.
- Test whether batch acquisition keeps its advantage at small budgets.

> **Sample dossier.** This page shows the layout and voice of a research entry. Replace it with your own
> work before publishing; public artefacts are linked only when they exist.
