---
name: blueprint
description: "Preview the architecture a spec and its tickets (or the current conversation) will produce, agree it with the user, and save it as a blueprint; later, `/blueprint drift` compares what was built against it."
disable-model-invocation: true
argument-hint: "[group | path | drift [fixed point]]"
---

# Blueprint

A **blueprint** is the agreed shape of what is about to be built: the modules, their interfaces, the flows between them, the seams the tests hit. It is the architecture, never the implementation. Once agreed it is frozen, and becomes the baseline for **drift**: every way the code that later gets built differs from it. Drift is the review's raw material, because it is where implementation discovered something the plan did not know.

This skill sits after `/to-tickets` and before `/preflight` on the main flow (or straight after a grilling, before `/to-spec`), and its `drift` mode runs after implementation, beside `/code-review` and `/walkthrough`. It edits no other skill's files and relies on nothing beyond the tracker doc.

The issue tracker and domain docs should have been provided to you. If `docs/agents/issue-tracker.md` is missing, tell the user to run `/setup-matt-pocock-skills`.

## Pick the branch

- Argument starts with `drift` → read [DRIFT.md](DRIFT.md) and follow it instead of the steps below.
- The target already has a blueprint with status `agreed` → **reconcile** (step 6 only).
- Otherwise → **draft** (steps 1–5).

The **target** is a group (`.scratch/<slug>/`, or the parent issue on a real tracker), a path, or the current conversation when no spec exists yet. If the user named none and the conversation holds no plan, list the candidate groups and ask.

## Draft

### 1. Gather the sources

Read the spec and every open ticket in full, or the conversation's agreed decisions when there is no spec. Read the glossary and ADRs the domain docs name, and the code the tickets touch at the **base** (the committed tip implementation will start from, by default the current branch). Record the base SHA.

Done when you can name every module the work creates, changes or deletes, and the base SHA.

### 2. Draw the blueprint

Write it in the **Format** below. Draw from the sources only; where they leave a shape open and you had to choose (who owns a behaviour, one module or two, sync or async, an interface's shape), mark the choice `(guess)` inline. A guess is an **open point**: it is where drift will come from, so it is what the user must look at.

Done when every module the tickets imply has an `M` entry with its interface, every flow a ticket's criteria walk through has an `F` entry, and every choice the sources did not make is marked `(guess)`.

### 3. Show it

Present the blueprint compactly in chat with `/show-me` views: the module tree as a `diff`, interfaces as signature blocks, flows as call trees or Mermaid. Lead with §1, then the rest; prose only where a view needs a sentence.

Then grill the open points: one numbered question per `(guess)`, each with your recommended answer, in the grilling format (`❓ **Q1** - **<M3: title>** … ➡️ <recommendation>`). Questions whose answers depend on another open one wait for the next round.

### 4. Fold in the feedback

The user answers open points, and may push back on anything else by ID ("M3: split that in two"). For each answer:

- Update the blueprint. IDs are permanent: a removed ID retires and is never reused, a new entry takes the next unused number.
- Write the decision into the spec's Implementation Decisions, and into any ticket whose criteria it changes, in **prose** matching the spec's existing conventions: no file paths, no code, no reference to blueprint IDs. Implementers read the spec and tickets, never the blueprint, so every decision the user would object to seeing broken must live there.
- A change that splits or merges tickets also rewrites their blocking edges the way the tracker doc says they are written.
- A change that contradicts an accepted ADR is flagged to the user and left unapplied until they say otherwise.

Edits stay uncommitted. Re-show only the parts that changed, then the next round of open points.

Done when no `(guess)` remains and the user says the blueprint is agreed.

### 5. Save

Set the header's status to `agreed` and save:

- Local tracker: `.scratch/<slug>/blueprint.md`, next to the spec. From a conversation with no group yet, ask the user for the slug.
- Real tracker: post it as a comment on the spec's parent issue (keep the draft local while iterating).

Tell the user what comes next: from a conversation, `/to-spec` and `/to-tickets`, then `/blueprint` again to reconcile; otherwise, commit the spec, tickets and blueprint, then `/preflight` and implementation. After implementation, `/blueprint drift`.

## Reconcile

### 6. Check the spec carried the blueprint

Runs when an agreed blueprint exists, typically one agreed from a conversation before `/to-spec` and `/to-tickets` wrote the spec. Read the blueprint, the spec and the tickets. Every module boundary, interface shape, flow and decision in the blueprint that the spec or tickets lost or contradict becomes an open point, grilled as in step 3 with two possible fixes: write it into the spec and tickets (as in step 4), or the user changed their mind and the blueprint is amended (a new entry under its old ID, with a dated `amended:` line saying why).

Done when every blueprint entry is either carried by the spec and tickets or amended. If nothing was lost, say so and list what was checked.

## Format

```markdown
# Blueprint: <title>

Base: <sha> · Date: <yyyy-mm-dd> · Source: <group slug | conversation> · Status: draft | agreed

## §1 Overview
3–5 sentences: what gets built and how the pieces fit. One diagram of the whole.

## §2 Modules
A file/module tree as a diff against the base (`+` new, `~` changed, `-` deleted).
- **M1** `<path>`: one-line responsibility.

## §3 Interfaces
### M1.i
Exported types and signatures only: no bodies, no private helpers.

## §4 Flows
### F1: <name>
A call tree or Mermaid sequence through the modules, naming M IDs.

## §5 Seams
Where the tests hit, and which flows each seam covers.

## §6 Decisions
- **D1**: the decision, and where it lives in the spec.
```

Altitude: modules, interfaces, flows, seams, decisions. Pseudocode only for the one or two pieces of logic where the decision *is* the logic, inside the flow that runs it. Leave out function bodies, private helpers, styling and test code: a blueprint someone could compile is too low.
