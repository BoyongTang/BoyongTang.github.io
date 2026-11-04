---
code: R-002
title: Faithful Explanations for Learned Models
summary: When does a feature attribution actually reflect what the model computes?
question: What makes an explanation faithful to the model rather than merely plausible to a reader?
status: exploring
topic: xai
methods: [m-attribution]
updatedAt: 2026-10-20
sample: true
---

## Question

Attribution maps are easy to produce and easy to believe. The open question is how to test whether an
explanation reflects the model's computation, not just our expectations.

## Approach

- Reading: gradient-based attributions, Shapley-value methods, concept-based explanations.
- Small, controlled models where the "true" mechanism is known by construction.
- Sanity checks: randomise the weights and see whether the explanation changes.

## Evidence

Exploring stage — reading notes and toy experiments only. Nothing here is a result yet.

## Limitations

Toy models with planted mechanisms may not transfer to realistic architectures.

## Next

Connect to R-001: can attributions on a surrogate model tell a scientist *why* an experiment was chosen?

> **Sample dossier.** Placeholder content showing an *Exploring* entry.
