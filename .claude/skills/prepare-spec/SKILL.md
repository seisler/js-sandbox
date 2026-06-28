---
name: "prepare-spec"
description: "Create a git branch and generate a fully exhaustive ticket ready to feed into /speckit-specify. Gathers all required info from context and ADRs, asking only for what is missing."
argument-hint: "Branch name, then optionally a space-separated description (e.g. feature/allow-npm-packages-be extend execute_js to accept npm package bindings)"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

## Outline

Goal: produce a complete, exhaustive ticket for a single feature slice — detailed enough to run `/speckit-specify` on without any additional context — and create the git branch for it.

### Step 1 — Parse arguments

Split `$ARGUMENTS` on the first whitespace boundary:

- **Branch name** — the first token (must match `{type}/{short-description}`)
- **Context** — everything after the first token, treated as free-form feature description / intent

Examples:
- `/prepare-spec feature/dark-mode-toggle` → branch only, no context
- `/prepare-spec feature/dark-mode-toggle add a dark/light toggle to the preferences panel` → branch + context

If the branch name token is missing or malformed, ask for it before proceeding.

### Step 2 — Gather context from the project

Read the following files to understand the project before asking anything:
- `CLAUDE.md` — coding conventions, ADR index, project structure
- `docs/adr/001-platform.md`
- `docs/adr/002-tdd.md`
- `docs/adr/be/001-be-stack.md`
- `docs/adr/be/002-npm-package-injection.md`
- `docs/adr/be/003-error-handling.md`
- `docs/adr/be/004-command-layer.md`
- `docs/adr/be/005-raii-drop-cleanup.md`
- `docs/adr/fe/001-fe-stack.md`
- `docs/adr/fe/002-fsd-architecture.md`
- `docs/adr/fe/003-css-bem.md`
- `docs/adr/fe/004-reactive-state-pattern.md`
- `docs/adr/fe/005-accessibility.md`

Also check `specs/` for any existing specs that this ticket may depend on or relate to.

### Step 3 — Completeness check

Before asking any questions, evaluate what you already know from three sources combined:
1. **Branch name** — implies layer (suffix `-be`/`-fe`/`-fs`) and rough feature area
2. **Context** (from Step 1) — the user's free-form description
3. **ADRs** — architectural constraints, whitelists, IPC contracts, patterns

Run this checklist internally. Mark each field ✅ (resolvable) or ❓ (genuinely unknown):

| Field | Resolvable if … |
|---|---|
| **Feature description** | Branch name + context together produce a clear one-sentence description of what to build |
| **Layer** (BE / FE / Full-stack) | Branch suffix (`-be`, `-fe`) or context makes it unambiguous |
| **Relevant ADRs** | Layer + description map to one or more ADRs |
| **Depends on** | Existing specs or conversation history name a dependency; otherwise default to "None" |
| **User scenarios** | Feature description is specific enough to derive at least one concrete happy-path scenario |
| **Functional requirements** | Feature description + ADRs yield testable, technology-specific requirements |
| **Edge cases** | Feature description implies at least one invalid-input or rejection case |
| **Success criteria** | Feature description implies at least one measurable outcome |
| **Assumptions** | ADRs and feature description scope the v1 boundary |

**Only ask about fields marked ❓.** Ask one question at a time, wait for each answer, then re-run the check. Never ask more than 5 questions total. Never ask for information that is derivable from the ADRs or branch name.

When presenting a best guess, use this format:

> **Suggested:** [your guess] — confirm or correct?

### Step 4 — Create the git branch

**Always run the git command — never skip it based on assumptions about the current branch state. The git status snapshot at conversation start may be stale.**

Run:

```bash
git checkout -b {branch-name}
```

If the command fails because the branch already exists, run:

```bash
git checkout {branch-name}
```

Report the actual command output.

### Step 5 — Generate the ticket

Produce the full ticket text using this exact structure. All sections are mandatory. Pull architectural context from the ADRs read in Step 1 — do not invent constraints that aren't in the ADRs, and do not omit constraints that are.

---

**Ticket: [{LAYER}] {Feature title}**

**Branch:** `{branch-name}`

**Context**
[2-4 sentences. What problem does this solve, why now, what is the approach at a high level. Reference the relevant ADR(s) by name.]

**Architecture reference:** [List relevant ADRs, e.g. ADR-BE-002, ADR-FE-002]

**Depends on:** [Other ticket titles or branch names, or "None"]

---

**User scenarios**

*Scenario 1 — [Title] (Priority: P1)*
Given [initial state],
When [action],
Then [expected outcome].

*Scenario 2 — [Title] (Priority: P1)*
...

*Scenario N — [Title] (Priority: P2)*
...

[Minimum 3 scenarios. At least 2 must be P1. Cover: happy path, error/rejection case, edge case.]

---

**Functional requirements**
- FR-001: [System MUST ...]
- FR-002: [System MUST ...]
- ...

[Each requirement must be testable and directly traceable to a user scenario. Pull constraints from the relevant ADRs — e.g. if BE ticket, include `?` over `.unwrap()` from ADR-BE-003; if FE ticket, include slice public API rule from ADR-FE-002.]

---

**Edge cases**
- [Edge case 1 and expected behaviour]
- [Edge case 2 and expected behaviour]
- ...

[Minimum 3 edge cases. Include at least one invalid input / rejection case.]

---

**Success criteria**
- SC-001: [Measurable, technology-agnostic outcome]
- SC-002: [...]
- ...

[Minimum 2 success criteria. Must be verifiable without knowing implementation details.]

---

**Assumptions**
- [Assumption 1]
- [Assumption 2]
- ...

[Include: what other tickets must be merged first, what the scope excludes for v1, any constraints inherited from ADRs that bound the solution.]

---

### Step 6 — Run speckit-specify

After outputting the ticket, tell the user you are now generating the spec, then immediately invoke the `speckit-specify` skill, passing the feature description as the argument. Derive the feature description from the ticket's Context section — one concise sentence that captures what is being built and the approach.

Do not ask the user for permission. Do not suggest they run it manually. Just invoke it.

If `speckit-specify` is not available as a skill, print:

> Spec generation skipped — `speckit-specify` skill not found. Run `/speckit-specify {feature description}` to continue.

## Done When

- [ ] Arguments parsed: branch name extracted, context captured
- [ ] Completeness check run against branch name + context + ADRs
- [ ] Only genuinely unknown fields asked about (≤ 5 questions total)
- [ ] Branch created with `git checkout -b`
- [ ] Full ticket output with all sections populated
- [ ] `speckit-specify` invoked automatically with the feature description
