---
name: to-testbook
description: "Turn a spec, tickets, or the current conversation into a self-contained HTML testbook: a manual end-to-end verification run whose results export as agent-ready Markdown."
disable-model-invocation: true
---

# To Testbook

A **testbook** is one self-contained HTML file that walks a human through verifying a feature end to end, and exports what they found as Markdown another agent can act on: `/to-testbook` → run it by hand → paste the export into `/to-tickets` or `/diagnosing-bugs`. It serves two readers at once, so it is also the brief an agent writes real e2e tests from.

[template.html](template.html) already solves the page: rendering, pass/fail/blocked/skipped state, notes, `localStorage`, keyboard shortcuts, and the Markdown export. **Your job is to produce the testbook JSON and splice it in.** Everything above the `TESTBOOK DATA` marker is the shell, identical in every testbook; leave it exactly as it is.

A testbook is ephemeral, like a wizard: built to verify one piece of work, deleted once the e2e tests exist. Write it beside its source, and leave it uncommitted.

## Process

### 1. Resolve the source

The argument may be a path to a spec, a directory or glob of tickets, an issue reference, or nothing at all (then the source is this conversation). Read every source in full, including issue comments. Several tickets produce **one** testbook, grouped by ticket, so a flow crossing tickets has somewhere to live.

**Done when:** every source is read, and you can name the feature in one line.

### 2. Normalise to criteria

Write the numbered list of **criteria** this testbook verifies: one observable behaviour per line, `C1`, `C2`, .... Draw them from user stories, acceptance criteria, or the decisions reached in conversation, and note each one's origin. All three source kinds collapse to this one list, which becomes the coverage spine every scenario points back at and keeps the testbook legible after the source is deleted.

**Done when:** every promise the source makes appears as exactly one criterion.

### 3. Discovery sweep

Dispatch one `Explore` sub-agent to ground the testbook in this repo. Nothing about the repo's shape is known in advance; the sweep is how you learn it. Ask it for:

- **Routes** and how the app is navigated
- **User-visible labels**: templates, i18n catalogues, component text
- **API surface**: route registrations, controllers, handlers, and their paths
- **Fixtures, seeds, factories**: the data a scenario can assume
- **Existing e2e tests**: the harness this repo already drives the app with
- **Run instructions**: README, `package.json` scripts, `Makefile`, `docker-compose*`, `.env.example`, CI workflows

Have it return an inventory of what it found, quoting the source of each item.

**Done when:** every item above is either inventoried with its source, or reported absent.

### 4. Propose the scenario list

Show the user the grounded scenario titles, grouped, marking which are **derived** (step 5). Ask whether the granularity is right, whether anything is missing, and whether any scenario should be merged, split, or dropped. Iterate until they approve.

**Done when:** the user approves the list.

### 5. Write the testbook

Build the JSON per **Testbook JSON** below and splice it into a copy of `template.html`. Write it to `.scratch/<feature-slug>/testbook.html` when that directory already exists, otherwise `testbook-<slug>.html` in the current directory.

Cover the source's own promises first, then add **derived** scenarios for the paths a spec leaves unspoken and a manual tester finds bugs in: empty state, permission denied, validation failure, concurrent edit, network error. Flag each derived scenario so the unflagged ones read as exactly what was promised.

Where a criterion has no manual path at all, list it under `unverifiable` with the reason, rather than writing a scenario nobody can run.

**Done when:** every criterion is either covered by a scenario or listed in `unverifiable`, and the file opens from `file://` with the scenario count you intended.

### 6. Hand off

Report the path and its `file://` URL, plus a one-line coverage summary: scenario count, derived count, and the number of criteria with no manual path. Then tell the user the loop: run it, then either paste the copied results back into a session or point an agent at the downloaded `.md`, and `/to-tickets` turns the failures into work.

**Done when:** the user has the URL and both routes for the export.

## Anchors

An **anchor** is a concrete, user-visible specific that makes a step executable: a route, a button's exact label, a seeded record, an API path, the command that starts the app. Anchors are what separate a testbook from a checklist, and they come only from the sweep.

**An anchor appears in a step only when the sweep produced it.** Otherwise the step names the thing descriptively: "open the study list", not an invented URL. A grounded testbook and a thin one then differ in precision and never in truthfulness, which is the property that lets the reader trust every anchor they see.

Anchors stay at the surface the reader touches. Source file paths, CSS selectors, and code snippets rot fastest and belong to the e2e tests, not the testbook; API request bodies go in as shape, not as copy-paste fixtures.

The same rule governs `environment`: it carries only run instructions the sweep actually found, quoted with their source. Found nothing? Leave `environment` empty and the section disappears, and scenarios begin from a running app.

## Scenario shape

One scenario is one journey a human takes in one sitting.

- **id**: `TB-<NN>-<slug>`, sequential across the whole testbook. This id is what the export reports and what a generated e2e test is named after, so it is the thread from testbook to test to bug report.
- **surface**: `ui`, `api`, or `data`. A behaviour with no pixel still gets a scenario — an endpoint's validation, a role's 403, a write that must land — and the tag tells an agent which harness to reach for.
- **preconditions**: only what differs from the `environment` baseline, such as which role you are signed in as.
- **steps**: an action plus what it should produce. One action per step, imperative enough that Given/When/Then falls out of it mechanically.
- **covers**: the criterion ids this scenario discharges.

## Testbook JSON

Replace the placeholder inside `<script type="application/json" id="testbook">`. `criteria`, `environment`, `groups`, and `unverifiable` are all required keys; an empty array simply hides its section.

```json
{
  "title": "Study review queue",
  "slug": "study-review-queue",
  "sourceKind": "spec | tickets | conversation",
  "sourceRef": ".scratch/study-review-queue/spec.md",
  "generated": "2026-09-18",
  "criteria": [
    { "id": "C1", "text": "A reviewer sees only studies assigned to them", "origin": "story 4" }
  ],
  "environment": [
    { "what": "Start the API", "how": "npm run start:api", "source": "package.json scripts" }
  ],
  "groups": [
    {
      "title": "Reviewer queue",
      "note": "Optional one-line orientation for the group.",
      "scenarios": [
        {
          "id": "TB-01-queue-shows-only-assigned",
          "title": "Queue shows only the reviewer's own studies",
          "surface": "ui",
          "derived": false,
          "covers": ["C1"],
          "preconditions": ["Signed in as a reviewer with two assigned studies"],
          "steps": [
            { "do": "Open Review queue from the sidebar", "expect": "Exactly the two assigned studies, newest first" }
          ]
        }
      ]
    }
  ],
  "unverifiable": [
    { "covers": ["C9"], "why": "Only reproduces at production data volumes" }
  ]
}
```
