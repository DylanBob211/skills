---
name: to-testbook
description: "Turn a spec, tickets, or the current conversation into a self-contained HTML testbook: a manual end-to-end verification run whose exported results are settled in grilling rounds."
disable-model-invocation: true
---

# To Testbook

A **testbook** is one self-contained HTML file that walks a human through verifying a feature end to end, and exports what they found as Markdown: `/to-testbook` → run it by hand → paste the export back into this session. Every failure and note in it becomes an **open point**, settled in grilling rounds; only the points the human decides to build later reach `/to-tickets`. It serves two readers at once, so it is also the brief an agent writes real e2e tests from.

[template.html](template.html) already solves the page: rendering, pass/fail/blocked/skipped state, notes, `localStorage`, keyboard shortcuts, and the Markdown export. **Your job is to produce the testbook JSON and splice it in.** Everything above the `TESTBOOK DATA` marker is the shell, identical in every testbook; leave it exactly as it is.

A testbook is ephemeral, like a wizard: built to verify one piece of work, deleted once the e2e tests exist. Write it beside its source, and leave it uncommitted.

## Pick the branch

If the repo has a `.sandcastle/` directory, the tickets ran through sandfactory: read [SANDFACTORY.md](SANDFACTORY.md) first. It says where an existing testbook lives, which tickets a new one covers, and where fixes are committed.

- **Results**: the target already has a testbook (by default `.scratch/<feature>/testbook.html`). Read its `testbook` JSON block, then the sources its `sourceRef` names, as step 1 says. Then go to step 7 when the human has already pasted an export, otherwise to step 6.
- **Generate**: otherwise, steps 1–8.

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

Report the path and its `file://` URL, plus a one-line coverage summary: scenario count, derived count, and the number of criteria with no manual path. Then tell the user the loop: run it, then paste the copied results back into this session, or point it at the downloaded `.md`. Stay in the session: the results are settled here.

**Done when:** the user has the URL and both routes for the export.

### 7. Settle the results

Collect the open points from the export, then grill them per **Results** below.

**Done when:** every open point in `open-points.md` has an outcome, and the human has no more to raise.

### 8. Close out

Summarise `open-points.md` by outcome: the commits made, the scenarios to re-run, the spec and ticket edits left uncommitted, the points dropped, and the scenarios still not run. Then hand the **build later** points, and only those, to `/to-tickets` with their agreed direction. The testbook stays ephemeral: leave it and `open-points.md` uncommitted, and offer to delete them once the e2e tests and tickets exist.

**Done when:** the build-later points are handed to `/to-tickets`, or there are none and the human knows it.

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

## Results

The export reports scenarios by their `TB-<NN>-<slug>` id, and that id is how a point names its scenario. Before grilling a scenario, re-read its steps and the criteria it covers from the testbook JSON.

### Open points

An **open point** is anything the run surfaced that needs a decision before it becomes work. Collect them from the export:

- every scenario under **Failures** or **Blocked**, with its observed note;
- every note: under **Passed, with observations**, on a **Skipped** or **Not run** scenario, and each separate item in **Session notes**;
- every request the human makes by scenario id in chat.

Number them `P1`, `P2`, … in testbook order, permanent within the session, and keep them in `open-points.md` beside the testbook: the point ID, the scenario ids, what was observed, and, once settled, its outcome.

### Grilling rounds

A point whose fix is small and mechanical, the whole edit visible in one reading (a wrong label, a missing guard, a step or expectation the testbook got wrong while the code is right), skips the round: **fix it now** and list it at the top of the next round, so the human can object.

A failure whose cause is unknown is **diagnosed** before it is grilled: run `/diagnosing-bugs` on it in this session, with the scenario's steps and observed note as the report, and bring it to the next round with its cause found.

Every other point is grilled: one numbered question per point, each with your recommended outcome, in the grilling format (`❓ **P3** - **TB-04-<slug>: <title>** … ➡️ <recommendation>`). Answer it first against the code, the criteria, and the source, and let the recommendation follow from the answer. Points whose answer depends on another open one wait for the next round. Rounds go on until every point has an outcome.

### Outcomes

Each point ends as exactly one of these, recorded in `open-points.md`:

- **Fix now**: a fix to the code goes in that repo on its current branch: run the checks that cover the touched files, and commit it alone as a one-line conventional commit. A fix to the testbook (a step or expectation it got wrong) is an edit to its JSON, spliced back into the page. Either way, name the scenarios for the human to re-run.
- **Change the spec or criteria**: the code is right and the spec, tickets, or criteria are wrong or silent. Write the decision into the spec's Implementation Decisions, and into any ticket whose criteria it changes, in **prose** matching their existing conventions: no file paths, no code, no scenario ids. Update the testbook's criteria and scenarios to match. A change that contradicts an accepted ADR is flagged to the human and left unapplied until they say otherwise. Leave these edits uncommitted.
- **Drop**: nothing to do; record why.
- **Build later**: design-sized, worth a fresh context (a missing flow, another approach, a refactor across modules). Discuss it until the human settles the direction, and record that direction with the point.
