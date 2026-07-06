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

At each gate the user must confirm before the next step runs, via the `AskUserQuestion` tool (clickable options — never a typed "go"/"stop"). This prevents runaway automation and keeps the user in control of how far the pipeline goes.

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

After this step, call `AskUserQuestion` with:

- `question`: "Step 1 complete — constitution ready. Continue to Specify (write the feature spec)?"
- `header`: "Step 1 gate"
- `options`:
  - label: "Continue to Specify", description: "Proceed and write the feature spec from the description."
  - label: "Stop", description: "Exit the pipeline here. Nothing further is generated."

Branch on the selected label: "Continue to Specify" → Step 2. "Stop" → Completion Report.

---

## Step 2 — Specify

Invoke the `speckit-specify` skill, passing the feature description from Step 0 as the argument.

Wait for `speckit-specify` to complete fully (including any clarification questions it surfaces internally).

After this step, call `AskUserQuestion` with:

- `question`: "Step 2 complete — spec written (<SPEC_FILE from speckit-specify output>). What next?"
- `header`: "Step 2 gate"
- `options`:
  - label: "Continue to Clarify", description: "Resolve open questions in the spec before planning."
  - label: "Skip to Plan", description: "Bypass clarification and jump straight to plan generation."
  - label: "Stop", description: "Exit the pipeline here."

Branch on the selected label: "Continue to Clarify" → Step 3. "Skip to Plan" → Step 4 (skip Step 3). "Stop" → Completion Report.

---

## Step 3 — Clarify

(Only reached if the user chose "Continue to Clarify" at Step 2's gate.)

Invoke the `speckit-clarify` skill.

Wait for `speckit-clarify` to complete fully, including any back-and-forth questions it asks the user.

After this step, call `AskUserQuestion` with:

- `question`: "Step 3 complete — spec clarified. Continue to Plan (generate the implementation plan)?"
- `header`: "Step 3 gate"
- `options`:
  - label: "Continue to Plan", description: "Proceed to generate the implementation plan."
  - label: "Stop", description: "Exit the pipeline here."

Branch on the selected label: "Continue to Plan" → Step 4. "Stop" → Completion Report.

---

## Step 4 — Plan

Invoke the `speckit-plan` skill.

Wait for `speckit-plan` to complete fully.

After this step, call `AskUserQuestion` with:

- `question`: "Step 4 complete — plan generated (<plan.md path>). Continue to Tasks (break the plan into actionable tasks)?"
- `header`: "Step 4 gate"
- `options`:
  - label: "Continue to Tasks", description: "Proceed to break the plan into actionable tasks."
  - label: "Stop", description: "Exit the pipeline here."

Branch on the selected label: "Continue to Tasks" → Step 5. "Stop" → Completion Report.

---

## Step 5 — Tasks

Invoke the `speckit-tasks` skill.

Wait for `speckit-tasks` to complete fully.

After this step, call `AskUserQuestion` with:

- `question`: "Step 5 complete — tasks generated (<tasks.md path>). Start implementation? This runs autonomously — confirm only when ready."
- `header`: "Step 5 gate"
- `options`:
  - label: "Start implementation", description: "Execute all generated tasks now. Runs autonomously once started."
  - label: "Stop", description: "Exit the pipeline here without implementing yet."

Branch on the selected label: "Start implementation" → Step 6. "Stop" → Completion Report.

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

- **One step at a time** — never start the next step without an explicit confirming selection from the user via `AskUserQuestion`.
- **Clickable gates, not typed commands** — every gate is an `AskUserQuestion` call with labeled options ("Continue to …", "Stop", and "Skip to Plan" where applicable). Never ask the user to type "go"/"stop"/"skip".
- **"Stop" exits cleanly** — print the completion report showing how far the pipeline reached, then stop.
- **"Skip to Plan" is only offered at Step 2's gate** (to bypass Clarify). No other gate offers a skip option.
- **Never re-run a completed step** — each gate fires exactly once per step; a completed step is not repeated.
- **Pass-through** — each sub-skill handles its own logic and user interaction. Do not duplicate or override their behavior.
- **Gate content is literal** — use the exact `question`/`header`/`options` text specified per step (substituting file paths). Do not summarize or shorten it.

## Done When

- [ ] Feature description collected
- [ ] Constitution confirmed or created (Step 1)
- [ ] Spec written via `speckit-specify` (Step 2)
- [ ] Spec clarified via `speckit-clarify` or explicitly skipped (Step 3)
- [ ] Plan generated via `speckit-plan` (Step 4)
- [ ] Tasks generated via `speckit-tasks` (Step 5)
- [ ] Implementation run via `speckit-implement` or user stopped before Step 6 (Step 6)
- [ ] Completion report printed
