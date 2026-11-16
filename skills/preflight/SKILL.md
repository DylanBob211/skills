---
name: preflight
description: Check a spec and its tickets for contradictions and divergences that would stall implementation, and settle each one with the user before any agent starts.
disable-model-invocation: true
---

# Preflight

Read a spec and its tickets as a set, before implementation starts, and hunt for what would stall it. A **finding** is one of two kinds:

- **Contradiction**: no implementation can satisfy every source. Two criteria exclude each other, or a ticket conflicts with its spec, an ADR, a coding standard, the checks, or the code it must keep.
- **Divergence**: a point the sources leave open that two tickets both touch, so their implementers, possibly running in parallel, will likely settle it in different ways: two shapes for one type, two owners for one behaviour, two wordings of one message.

A point left open that only one ticket touches is neither: its implementer decides it.

The issue tracker and domain docs should have been provided to you. If `docs/agents/issue-tracker.md` is missing, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Pin the target

The target is one spec and its tickets, named by the user: a group slug, a path, a tracker reference, or a pointer into the conversation ("the spec and tickets we just created").

If the user named none, list the candidates (each `.scratch/<slug>/` with a spec or tickets, and when it last changed; on a real tracker, ask for the parent issue) and ask which one to check. Read no ticket until the user picks.

Done when exactly one spec and one ticket set are pinned.

### 2. Gather the sources

- The spec, and every open ticket, held ones included (`needs-info`, `ready-for-human`): a ticket a human owns can still contradict one an agent owns. Closed tickets count as code already built, not as sources.
- The tracker doc: its field names and how a blocking edge is written.
- The domain docs `docs/agents/domain.md` names: the glossary and the ADRs.
- Whatever the repo documents about how code is written and checked (`CODING_STANDARDS.md`, `CHECKS.md`, `CONTRIBUTING.md`, …).
- The **base**: the committed tip of the branch implementation starts from, by default the current branch. Note any uncommitted change in a file a ticket touches; it is a note for the user, never a finding.

If the repo has a `.sandcastle/` directory, the tickets run through sandfactory: read [SANDFACTORY.md](SANDFACTORY.md) now. It sets the base and adds checks.

### 3. Dispatch the code checks

Group the tickets by the area of code they touch (one ticket per group when areas don't overlap) and spawn one sub-agent per group, in parallel, in the foreground. Each prompt carries:

- The spec, the group's tickets in full, and the base ref.
- The brief: "Read the code at `<base>` that these tickets touch: every module, type, message and test their criteria name or imply. Report each claim in the spec or tickets that the code makes impossible or that misdescribes the code: a criterion to keep a behaviour the required change cannot keep, a module or shape that is not what the ticket says, a test the criteria forbid changing that the change must break. For each, quote the claim with its location and cite the code (`path:line`) that contradicts it. Report facts only; leave resolutions to the caller. Under 400 words."

### 4. Check the documents against each other

While the sub-agents run, check:

1. The spec against itself.
2. Each ticket against the spec.
3. Each ticket against every other ticket, pairwise wherever two share a module, a type, a message or a glossary term. This is where divergences live.
4. The spec and tickets against the ADRs, the coding standards and the checks.
5. The mechanics, against the tracker doc: each field written the way the doc says it is read; every blocking edge naming a ticket that exists; no cycle; on local files, no ticket numbered before one of its blockers.

Then fold in the sub-agents' reports. Re-read each reported claim yourself before keeping it.

Done when every criterion of every open ticket has been read against the spec, the ADRs and the standards, and every pair of tickets sharing a module or shape has been compared.

### 5. Settle the findings in rounds

Present the findings as grilling rounds: one numbered question per finding. Each quotes both sides with their locations, names the kind, and gives your recommended fix. Findings whose fixes are independent share a round; a finding whose fix depends on another's answer waits for the next round.

```
❓ **F1** - **<contradiction|divergence>: <title>**: <side A, quoted, with its location> vs <side B, quoted, with its location>. <why no implementation satisfies both, or how two tickets would settle it differently>

➡️ <recommended fix: which document changes, and to what>
```

Where fixes land:

- The spec and the tickets, by default. A divergence is fixed by writing the decision into the spec; adding a blocking edge between the two tickets is the fallback.
- An ADR, the coding standards or the checks change only when the user's answer says so explicitly.
- On a real tracker, say in the question that the fix will be posted there; post it only after the answer.

Apply each round's fixes before computing the next round.

If there are no findings, say so, and list what was checked.

### 6. Re-check and hand back

Re-run the mechanics check (step 4, item 5) and re-read every edited passage against its neighbours. A new finding opens another round.

Done when a re-check turns up nothing new. Leave the changes uncommitted, and tell the user what comes next: commit the spec and tickets, then start implementation.
