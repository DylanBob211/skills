---
name: ask-factory
description: Ask which skill comes next, from idea to shipped and reviewed work. A router over the flow.
disable-model-invocation: true
---

# Ask Factory

Find where the user is on the flow below and name the next skill, with one line on why. Before saying what a skill does, or that a step can be skipped, read that skill's SKILL.md: the lines here are for orientation only. You route; you never run the skills yourself, since only the user can start them.

If the repo has a `.sandcastle/` directory, the work runs through sandfactory: read [SANDFACTORY.md](SANDFACTORY.md) now. It replaces the build step and the review steps below.

If `docs/agents/issue-tracker.md` is missing, the first step is **`/setup-matt-pocock-skills`**: every planning skill assumes it.

## Small or big

- **Small**: one session holds it, from idea to done, and nobody needs a spec to understand it. Grill if it is fuzzy, then **`/implement`** here, in the same context window. Stop routing.
- **Big**: anything that spans sessions, or that several agents build in parallel. Take the main flow.

## The main flow

1. **`/grill-with-docs`** sharpens the idea by interview, recording terms in `GLOSSARY.md` and decisions as ADRs. A question only running code can answer detours through **`/prototype`**.
2. **`/to-spec`** turns the conversation into a spec.
3. **`/to-tickets`** splits the spec into tracer-bullet tickets, each naming the tickets that block it.
4. **`/blueprint`** previews the architecture the tickets will produce and agrees it with the user. Skip it only when the tickets touch no module boundary.
5. **`/preflight`** reads spec and tickets as a set and settles every contradiction and divergence before any agent starts.
6. **Build.** **`/implement`** one ticket at a time, blockers first, clearing context between tickets. Each one closes with `/code-review`.
7. **Review** what was built, each step settling what it surfaces as **open points** in grilling rounds:
   - **`/to-testbook`** for a page that checks the feature by hand; the user pastes the results back.
   - **`/walkthrough`** for the changes told as a story, each beside the ticket it came from.
   - **`/blueprint drift`** when step 4 saved a blueprint: what the build changed in the agreed shape.

   Points the user decides to build later go to **`/to-tickets`**, and back to step 6.
8. **`/retro`** looks back over the session and improves the agent's environment (checks, standards, steering files) for the next build.

## Context

- Keep steps 1–5 in one context window, so spec, tickets, blueprint and preflight all build on the grilling. If it nears its limit, `/compact` at a step boundary.
- Each `/implement` and each review step starts fresh: it works from the tickets and the code.
- Run `/retro` in the session it looks back on, before clearing it.

## Off the main flow

- **Raw bugs and requests piling up** → **`/triage`**, which turns them into agent-ready issues for `/implement`. Tickets from `/to-tickets` are already agent-ready.
- **Something broken that resists a first look** → **`/diagnosing-bugs`**, then `/retro` on what would have prevented it.
- **An effort too foggy to grill in one session** → **`/wayfinder`** charts it as decision tickets, then joins the main flow at `/to-spec`.
- **A spare moment for codebase health** → **`/improve-codebase-architecture`** finds deepening opportunities; one picked becomes an idea for step 1. **`/codebase-design`** is the vocabulary for shaping it.
- **Reading legwork** → **`/research`** leaves a cited file to bring into step 1.
- **Moving work to another directory, harness or person** → **`/handoff`**, also the bridge into and out of a `/prototype`.
- **A fuzzy or overloaded term** → **`/domain-modeling`**.
- **Writing a pull request** → **`/pr`**.
- **Writing a skill, `AGENTS.md` or `CLAUDE.md`** → **`/writing-for-agents`**.
