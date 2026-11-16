---
name: walkthrough
description: "Walk a human through a range of code changes as a story: diffs grouped by purpose, each with the why from its ticket or spec, every unit addressable by ID for chat, edits, and follow-up tickets."
disable-model-invocation: true
---

# Walkthrough

A **walkthrough** is a guided review of changes that already landed: the **how** (the net diff) beside the **why** (the ticket, spec, or ADR it was born from), told as a **story** instead of file by file. It has two halves:

- **The page**: one `walkthrough.html` the human reads, marking each change fine / needs change / question, with an export back into this session.
- **The session**: you stay here as the narrator. The human points at units by ID ("T48.2b: drop those comments", "T51.1: why not reuse X?"), and each request is either done **now** or **queued** for `/to-tickets`.

You narrate; judging belongs to `/code-review`. Explain what each change does and why it exists, and let the human form the verdict.

[`walkthrough.mjs`](walkthrough.mjs) (in this skill's directory) does the mechanical work: `hunks` splits a range into hunks and traces each to its commits and tickets, and `build` splices your outline into [`template.html`](template.html). **Your job is the outline**: grouping hunks into changes, ordering them into a story, and writing the why and how.

## Process

### 1. Resolve the ranges

The argument names a feature group (`.scratch/<feature>`), specific tickets, or a git fixed point. Turn it into one `base..head` range per repo that the work touched: usually just the current one.

- **Tickets**: find the commits that name them. A subject names a ticket (`feat: complete issue #48`), or a merge names a ticket's branch (`Merge branch 'feature/<group>-<NN>-<slug>'`). `head` is the current `HEAD`. `base` is the first parent of the earliest matching commit on `HEAD`'s first-parent line.
- **Feature group**: every ticket under its `issues/`. Take the range from the group branch's merge-base with the branch it lands on (the default branch unless the user says otherwise).
- **Fixed point**: `git merge-base <point> HEAD`.

If the repo has a `.sandcastle/` directory, the tickets ran through sandfactory: read [SANDFACTORY.md](SANDFACTORY.md) now. It changes where the ranges come from.

Then, per repo:

```
node <skill-dir>/walkthrough.mjs hunks <repo-dir> <base> <head> > .scratch/<feature>/walkthrough/hunks-<repo>.json
```

Its stderr gives the size and a hunks-per-ticket tally. That tally is also your first read on which tickets the range covers.

**Done when:** every touched repo has a hunks file, and you can list the tickets the range covers.

### 2. Read the why

Read every covered ticket in full, including comments. Also read the spec it came from (a `spec.md` / PRD beside the issues), plus the glossary terms and ADRs the changes touch (wherever the repo's domain docs keep them). These are the only sources a **Why** may quote.

**Done when:** each covered ticket is read, and you know which spec sections and ADRs bear on the range.

### 3. Write the outline

Group every hunk into **changes**, order them into a story, and write `.scratch/<feature>/walkthrough/outline.json` per **Outline** below. Hunk attribution from step 1 is a starting point. A hunk with `attribution: "file"` (pure deletions, or blame found nothing) is traced only loosely, so check it against the diff.

Size decides who reads the diff. Sum the `+`/`-` lines from step 1's stderr:

- **Up to ~3,000 changed lines**: read every hunk yourself. The chat that follows works best when you hold the whole diff.
- **Over that**: dispatch one sub-agent per ticket. Give it the ticket path, the hunk keys attributed to that ticket, the hunks file paths, and the **Outline**, **Why**, and **How** sections of this skill verbatim. Have it return that ticket's `groups[]` entry as JSON. You write the overview, the Shared and Untraced groups, and the final order. Afterwards you keep only the outline in context, so re-read a unit's hunks from the hunks file each time the human references it.

Then build:

```
node <skill-dir>/walkthrough.mjs build .scratch/<feature>/walkthrough/outline.json .scratch/<feature>/walkthrough.html
```

`build` refuses an outline that leaves a hunk out, assigns one twice, or names an unknown key. Fix the outline and rerun until it writes the file.

**Done when:** `build` exits clean, which means every hunk sits in exactly one change.

### 4. Hand over the page

Report the `file://` URL, the counts `build` printed, the size of the Untraced group, and the loop in one breath. The human reads, marks, and notes on the page, then either talks to you by unit ID or pastes the page's **Copy review** export. Stay in the session: the walkthrough's value is the conversation that follows.

**Done when:** the human has the URL and knows both ways to talk back.

### 5. Run the conversation

Work the human's messages per **The conversation** below until they call the review done.

**Done when:** every ✎ and ? the human raised is answered, done now, or queued.

### 6. Close out

Show the queue (`.scratch/<feature>/walkthrough/queue.md`) and tell the human to run `/to-tickets` on it. That skill slices the items and writes their blocking edges, so the new tickets land in the same `issues/` beside the ones this range closed. The walkthrough files are ephemeral like a testbook, so leave them uncommitted and offer to delete them once the tickets exist.

**Done when:** the queue is handed to `/to-tickets`, or is empty and the human knows it.

## Units and IDs

Three levels, each with an ID the human can type:

- **Group**: one per ticket (`T48`), plus two special groups. **Shared** (`S`) holds changes that serve several tickets. **Untraced** (`U`) holds hunks no source explains: drive-by refactors, leftover comments, agent fixups.
- **Change** (`T48.2`): one purpose, carried out by hunks from any number of files and repos, e.g. "exports run in the background": a queued job, the endpoint that enqueues it, and its test. A change is the unit of review: it carries the status, the note, the why, and the how.
- **Hunk** (`T48.2b`): lettered by `build` in the order you list them.

**Story order.** Within a ticket, order changes the way you'd explain the feature aloud: data and types, then logic, then UI, then tests. Within a change, list the hunks the same way. Order tickets by their `Depends-on:` edges, then by number. Place Shared just before the first ticket it serves, and Untraced last.

## Why

Every change carries at least one **why**, and each why names its source. The source is a ticket line (`48-exports-run-in-the-background.md — Acceptance criteria`), a spec section, an ADR, or a commit message. Quote the source's own words, trimmed.

When nothing in the sources explains a change, write your best reading of it and mark it `"inferred": true`. The page shows inferred reasons in a separate style, so every sourced why can be trusted as quoted. The Untraced group is made of these: state plainly that nothing asked for them.

## How

2–4 sentences on the approach: what the code now does and how the pieces connect, in the glossary's vocabulary. Set `lead` to the hunk holding the real logic, so the page marks it **start here** and the human knows where to spend attention. A hunk gets a `note` only when it would puzzle a reader who has read the how. Plumbing and renames go without.

The overview at the top of the page is 3–5 sentences: what this range set out to do, and the order it reads best in.

## Outline

```json
{
  "title": "Invoice export: tickets 46–52",
  "slug": "invoice-export-46-52",
  "generated": "2026-09-23",
  "source": { "kind": "tickets | group | range", "ref": ".scratch/invoice-export/issues/46–52" },
  "overview": "3–5 sentences.",
  "ranges": [ { "hunks": "hunks-web-app.json" } ],
  "groups": [
    {
      "id": "T48",
      "kind": "ticket | shared | untraced",
      "title": "Exports run in the background",
      "summary": "1–2 sentences.",
      "ref": ".scratch/invoice-export/issues/48-exports-run-in-the-background.md",
      "changes": [
        {
          "id": "T48.1",
          "title": "The export endpoint enqueues a job",
          "serves": ["T46", "T47"],
          "why": [
            { "quote": "Requesting an export returns at once; the file arrives when it is ready", "source": "48-… — Acceptance criteria" },
            { "quote": "Probably keeps large exports under the gateway timeout", "inferred": true }
          ],
          "how": "2–4 sentences.",
          "lead": "web-app:src/…/export-endpoint.ts#2",
          "hunks": [
            "web-app:src/…/export-endpoint.ts#2",
            { "key": "web-app:src/…/export-job.ts#1", "note": "One-line note, only when needed." }
          ],
          "revisions": [ { "repo": "web-app", "commit": "a1b2c3d", "request": "T48.1: drop the inline comments" } ]
        }
      ]
    }
  ]
}
```

`ranges[].hunks` paths are relative to the outline file. `serves` appears only in the Shared group. `revisions` appears only after an in-session edit. Hunk keys come from the hunks files; everything else `build` fills in.

When a change's explanation depends on surrounding code that three lines of context hide, regenerate that repo's hunks with `-U15`, then point the outline at the new file.

## The conversation

The human references units by ID, and IDs are exact: `T48.2` means the whole change, `T48.2b` means one hunk. In the large-range branch, re-read the referenced hunks before answering.

A pasted export arrives grouped as **Needs change**, **Questions**, and **Fine**. Answer the questions first, then take each needs-change item as a request.

**Every request gets a bucket.** Propose one, and let the human confirm or flip it:

- **Now**: small and mechanical, the whole edit visible in one reading. Examples: removing comments, renaming, extracting a helper, tightening a test. Edit the code in that repo on its current branch, run the checks that cover the touched files, and commit it alone as a one-line conventional commit. Then record it on each affected change as a `revisions` entry, rerun `hunks` with the new `HEAD`, and rerun `build`. `build` marks every change whose hunks moved as **revised**, and the page resets its status so the human looks again.
- **Queue**: design-sized. Examples: another approach, a refactor across modules, anything worth a fresh context. Discuss it until the human settles the direction, then append it to `queue.md`: the unit IDs, the request, and the direction you agreed.

A question like "what about approach X?" is a discussion first. Answer it against the code and the why, and bucket it only once the human decides to act.

A request to reshape the walkthrough itself ("merge T48.2 and T48.3", "this belongs under T50") is an outline edit followed by `build`. IDs are permanent within a walkthrough: a merged change keeps the lower ID, the other ID retires, and a new change takes the next unused number. Untouched changes keep their IDs, so the human's notes on the page stay attached.
