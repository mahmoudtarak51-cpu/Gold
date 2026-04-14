<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template Principle 1 -> I. Source Transparency & Freshness
- Template Principle 2 -> II. Currency and Unit Integrity
- Template Principle 3 -> III. Resilient Read-Only UX
- Template Principle 4 -> IV. Testable Data Contracts
- Template Principle 5 -> V. Simplicity, Observability, and Safe Claims
Added sections:
- Product Guardrails
- Delivery Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- updated .specify/templates/plan-template.md
- updated .specify/templates/spec-template.md
- updated .specify/templates/tasks-template.md
- pending .specify/templates/commands/*.md (directory not present in this repo)
Follow-up TODOs:
- None
-->
# Gold Price Reporter Constitution

## Core Principles

### I. Source Transparency & Freshness
Every user-visible gold price, exchange rate, or derived currency amount MUST be
tied to a named upstream source and a captured retrieval timestamp. UI surfaces
MUST show when data was last updated and MUST mark stale, delayed, or fallback
data explicitly rather than presenting it as live. If live refresh is
unavailable, the product MUST prefer last-known-good data with a warning over
silent blanks or invented replacements.

Rationale: Trust in a market-data product depends on users knowing where numbers
came from and how current they are.

### II. Currency and Unit Integrity
The system MUST preserve canonical source units and document every conversion
path used for USD, EGP, ounces, grams, or local market units. Conversion
formulas, rounding rules, and exchange-rate sourcing MUST be centralized,
deterministic, and covered by automated tests. The application MUST never mix
spot prices, local premiums, or manually entered values without a visible label
explaining the distinction.

Rationale: Currency or unit mistakes immediately destroy credibility and can
mislead users making time-sensitive decisions.

### III. Resilient Read-Only UX
The initial product MUST be a fast, mobile-friendly, read-only web app that
prioritizes the core pricing journey over account systems or speculative
platform features. Every primary view MUST handle loading, empty, stale, and
provider-error states gracefully and remain usable on common mobile breakpoints.
Accessibility basics such as semantic structure, sufficient contrast, keyboard
reachability for interactive controls, and descriptive labels are release
requirements.

Rationale: Public market-data sites are judged on clarity and reliability under
imperfect network conditions.

### IV. Testable Data Contracts
All provider adapters, parsers, normalization steps, and currency conversion
modules MUST have automated tests using fixed fixtures or mocked upstream
responses. Schema changes or selector changes from upstream providers MUST fail
loudly through tests or validation rather than degrading silently in production.
Integration tests MUST cover the highest-value user journey: viewing the current
global gold price in USD and seeing the corresponding EGP value.

Rationale: External data contracts drift often, so contract safety is a product
requirement, not a backend detail.

### V. Simplicity, Observability, and Safe Claims
Architecture MUST stay simple enough for a small team to understand end to end:
separate source ingestion, normalization, presentation, and caching concerns
without premature service sprawl. The app MUST emit actionable logs or
telemetry for fetch failures, stale-data threshold breaches, and conversion
errors, and diagnostics MUST make those failures understandable. Product copy
MUST state that prices are informational and not investment advice, and any
unsupported forecast or recommendation MUST remain out of scope unless a later
spec explicitly approves it.

Rationale: This product succeeds by reliable reporting, not by complexity or
ambiguous financial claims.

## Product Guardrails

- V1 scope is a public web application for viewing global gold prices and
  related USD and EGP conversions; trading, checkout, portfolio management, and
  personalized alerts are out of scope unless explicitly added by a later spec.
- Plans MUST name the primary gold-price source, the exchange-rate source for
  EGP conversion, the expected refresh cadence, and the user-visible stale-data
  threshold.
- When multiple providers are used, one provider MUST be declared canonical for
  each displayed metric, and fallback ordering MUST be documented.
- Historical charts, local market premiums, and metal comparisons are allowed
  only when their sourcing and units are as explicit as the primary spot price.

## Delivery Workflow & Quality Gates

- Every feature spec MUST define the user journey, upstream data dependencies,
  freshness expectations, failure behavior, and measurable success criteria
  before implementation begins.
- Every implementation plan MUST pass a Constitution Check covering source
  transparency, conversion integrity, stale and error states, accessibility
  basics, and observability.
- Every task list for data-affecting work MUST include test coverage for parsing
  or conversion changes, plus verification of timestamps, labels, and
  degraded-state UX.
- Code review and release review MUST reject changes that obscure data
  provenance, bypass shared conversion logic, or remove user-facing trust
  signals.
- Complexity exceptions require a written justification in the plan and a
  simpler alternative that was considered and rejected.

## Governance

This constitution overrides conflicting local habits or undocumented preferences
for the Gold Price Reporter project. Amendments require a documented rationale,
a summary of impacted templates or workflows, and an explicit semantic version
decision recorded in the Sync Impact Report. MAJOR versions indicate removed or
redefined principles, MINOR versions indicate new principles or materially
expanded governance, and PATCH versions indicate clarifications that do not
change team obligations. Compliance is reviewed during specification, planning,
task generation, code review, and release readiness checks; work that fails a
non-negotiable principle MUST be corrected before merge.

**Version**: 1.0.0 | **Ratified**: 2026-04-13 | **Last Amended**: 2026-04-13
