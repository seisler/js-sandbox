---
name: "spec-interactive"
description: "Run the full speckit flow interactively — one step at a time, with a confirmation gate between each phase."
argument-hint: "Describe the feature you want to build (e.g. add dark mode toggle to the toolbar)"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

## Overview

This skill walks through the full speckit pipeline step by step:

1. **Constitution** — ensure project principles exist
2. **Specify** — write the feature spec from your description
3. **Clarify** — resolve any open questions in the spec
4. **Plan** — generate the implementation plan
5. **Tasks** — break the plan into actionable tasks
6. **Implement** — execute the tasks (optional, confirm before starting)

At each gate the user must confirm before the next step runs. This prevents runaway automation and keeps the user in control of how far the pipeline goes.

---

## Step 0 — Collect feature description

If `$ARGUMENTS` is non-empty, use it as the feature description. Otherwise ask:

> What feature do you want to build? Describe it in one or two sentences.

Wait for the user's response before proceeding.

---

## Step 1 — Constitution check

Check whether `.specify/memory/constitution.md` exists.

- **If it exists**: print a one-line note:
  > ✓ Constitution found — skipping `/speckit-constitution`.

- **If it does not exist**: print:
  > No constitution found. Running `/speckit-constitution` to establish project principles.

  Then invoke the `speckit-constitution` skill and wait for it to complete.

After this step, print the gate:

```
─────────────────────────────────────
✓ Step 1 complete: Constitution ready
  Next → Specify: write the feature spec
  Type "go" to continue, or "stop" to exit.
─────────────────────────────────────
```

Wait for user confirmation before proceeding.

---

## Step 2 — Specify

Invoke the `speckit-specify` skill, passing the feature description from Step 0 as the argument.

Wait for `speckit-specify` to complete fully (including any clarification questions it surfaces internally).

After this step, print the gate:

```
─────────────────────────────────────
✓ Step 2 complete: Spec written
  File: <SPEC_FILE from speckit-specify output>
  Next → Clarify: resolve open questions in the spec
  Type "go" to continue, "skip" to jump to Plan, or "stop" to exit.
─────────────────────────────────────
```

Wait for user confirmation before proceeding.

---

## Step 3 — Clarify

If the user typed "skip" at Step 2's gate, skip this step and go to Step 4.

Otherwise invoke the `speckit-clarify` skill.

Wait for `speckit-clarify` to complete fully, including any back-and-forth questions it asks the user.

After this step, print the gate:

```
─────────────────────────────────────
✓ Step 3 complete: Spec clarified
  Next → Plan: generate the implementation plan
  Type "go" to continue, or "stop" to exit.
─────────────────────────────────────
```

Wait for user confirmation before proceeding.

---

## Step 4 — Plan

Invoke the `speckit-plan` skill.

Wait for `speckit-plan` to complete fully.

After this step, print the gate:

```
─────────────────────────────────────
✓ Step 4 complete: Plan generated
  File: <plan.md path>
  Next → Tasks: break the plan into actionable tasks
  Type "go" to continue, or "stop" to exit.
─────────────────────────────────────
```

Wait for user confirmation before proceeding.

---

## Step 5 — Tasks

Invoke the `speckit-tasks` skill.

Wait for `speckit-tasks` to complete fully.

After this step, print the gate:

```
─────────────────────────────────────
✓ Step 5 complete: Tasks generated
  File: <tasks.md path>
  Next → Implement: execute all tasks (this may take a while)
  Type "go" to start implementation, or "stop" to exit.
  ⚠ Implementation runs autonomously — confirm only when ready.
─────────────────────────────────────
```

Wait for user confirmation before proceeding.

---

## Step 6 — Implement

Invoke the `speckit-implement` skill.

Wait for `speckit-implement` to complete fully.

---

## Completion Report

After all steps are done (or the user stopped early), print a summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  spec-interactive complete
  Feature: <feature description>
  Spec:    <spec.md path>
  Plan:    <plan.md path>
  Tasks:   <tasks.md path>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If the user stopped early, list which steps were completed and which were skipped.

---

## Behavior Rules

- **One step at a time** — never start the next step without an explicit "go" from the user.
- **"stop" exits cleanly** — print the completion report showing how far the pipeline reached, then stop.
- **"skip" is only valid at Step 2's gate** (to bypass Clarify). At all other gates only "go" or "stop" are valid; if the user types anything else, re-prompt.
- **Never re-run a completed step** — if the user types "go" multiple times, do not repeat the current step.
- **Pass-through** — each sub-skill handles its own logic and user interaction. Do not duplicate or override their behavior.
- **Gate text is literal** — print the gate blocks exactly as shown (substituting file paths). Do not summarize or shorten them.

## Done When

- [ ] Feature description collected
- [ ] Constitution confirmed or created (Step 1)
- [ ] Spec written via `speckit-specify` (Step 2)
- [ ] Spec clarified via `speckit-clarify` or explicitly skipped (Step 3)
- [ ] Plan generated via `speckit-plan` (Step 4)
- [ ] Tasks generated via `speckit-tasks` (Step 5)
- [ ] Implementation run via `speckit-implement` or user stopped before Step 6 (Step 6)
- [ ] Completion report printed
