# Blueprint drift

Compare what was built against the agreed blueprint and tell the story of every difference. A **drift** is one difference between the blueprint and the code; the **drift report** is all of them, each with its why. You narrate the drift; whether it was right is the user's call.

The blueprint is the frozen baseline: read it, never edit it.

## 1. Pin the blueprint and the range

Find the agreed blueprint for the target (`.scratch/<slug>/blueprint.md`, or the comment on the parent issue). The range is `<blueprint base>..HEAD`, or `<fixed point>..HEAD` when the user passed one; use `git merge-base` when the base is not an ancestor of `HEAD`. Confirm the range resolves and its diff is non-empty before going further.

Done when you hold the blueprint and one non-empty range.

## 2. Derive the as-built blueprint

Write the blueprint the code at `HEAD` actually embodies, in the same Format, matching each entry to the planned ID it realises. An entry with no planned counterpart takes the next unused ID in its series. Read the code yourself; when the diff spans many modules, dispatch one sub-agent per group of modules with the planned entries for that group, the range, and the Format, and have each return its as-built entries.

Done when every planned entry is matched to an as-built one or recorded as not built, and every module the range touches belongs to some as-built entry.

## 3. Classify each drift

Compare §2, §3 and §4 entry by entry (§5 and §6 where they changed). Each difference is one drift, of one kind:

- **refined**: same shape, details changed (a renamed export, an extra optional parameter, a reordered flow step).
- **reshaped**: a module, interface or flow changed shape (split, merged, moved, a different owner, a different signature).
- **unplanned**: in the code, nowhere in the blueprint.
- **dropped**: in the blueprint, nowhere in the code.

Give each a **why** quoted from its source: a commit message, a ticket's comments or criteria, a change to the spec since the base (`git log -p <base>..HEAD -- <spec>`), a code comment. When nothing explains it, give your best reading and mark it `(inferred)`. A drift explained by a spec change made after the blueprint was agreed says so: it was decided on paper, not discovered in code.

Done when every drift has a kind and a why.

## 4. Report

Save `.scratch/<slug>/drift.md` (on a real tracker, post it as a comment on the parent issue):

```markdown
# Drift: <title>

Blueprint: <path or link> · Range: <base>..<head> · Date: <yyyy-mm-dd>

## Summary
2–4 sentences: how far the build moved from the blueprint, and where.

## Drifts
### R1 · reshaped · M3
Planned vs as-built, as a `diff` of the entry.
Why: "<quote>" (<source>) | <reading> (inferred)
Verdict: pending
```

Drift IDs are `R1`, `R2`, … in blueprint order. In chat, show the summary and the reshaped, unplanned and dropped drifts with `/show-me` diffs of planned vs as-built; refined drifts as one line each.

## 5. Settle the verdicts

For each reshaped, unplanned or dropped drift, ask the user, with your recommendation:

- **accept**: the build was right to move; record `Verdict: accepted` in the report.
- **fix**: the code should come back toward the blueprint, or go somewhere new; discuss the direction, then record `Verdict: fix` with the agreed direction.

Refined drifts are accepted unless the user raises one.

Done when every drift has a verdict. Then list the `fix` drifts as one block the user can hand to `/to-tickets`.
