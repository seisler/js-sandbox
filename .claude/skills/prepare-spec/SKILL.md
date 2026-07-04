---
name: "prepare-spec"
description: "Bootstrap a feature from a Trello ticket URL and branch name: create the branch, read the ticket, draft a spec summary, update the ticket, then launch spec-interactive."
argument-hint: "<trello-card-url> <branch-name>  (e.g. https://trello.com/c/HorEf7k0/14-my-feature feature/my-feature)"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

Parse `$ARGUMENTS` as two space-separated tokens:

- `TRELLO_URL` — the first token (a `https://trello.com/c/…` URL)
- `BRANCH_NAME` — the second token (the git branch name to create)

If either token is missing, ask the user:

> Please provide both the Trello card URL and the branch name, e.g.:
> `/prepare-spec https://trello.com/c/HorEf7k0/14-my-feature feature/my-feature`

Wait for the user's response before proceeding.

---

## Step 1 — Create the git branch

Run:

```bash
git checkout -b <BRANCH_NAME>
```

- If the branch already exists, run `git checkout <BRANCH_NAME>` instead and note it to the user.
- If creation fails for any other reason, surface the error and stop.

Print:
> ✓ Branch `<BRANCH_NAME>` ready.

---

## Step 2 — Read the Trello ticket

Extract the card ID from `TRELLO_URL`. The card ID is the short alphanumeric segment after `/c/` (e.g. `HorEf7k0` from `https://trello.com/c/HorEf7k0/14-my-feature`).

Fetch the card using the Trello MCP tool:

- Card name
- Card description
- Checklist items (if any)
- Labels
- Due date (if set)

Store the card details as `TICKET_CONTENT`. Store the existing description as `EXISTING_DESCRIPTION`.

Print a brief summary of what was read:
> ✓ Ticket read: "<card name>"

---

## Step 3 — Gather project context

Read the following files silently:

- `CLAUDE.md` — conventions, ADR index, project structure
- All ADR files listed in `CLAUDE.md` under `docs/adr/`
- `specs/` directory listing — any existing specs this feature may relate to

---

## Step 4 — Completeness check

Combine `TICKET_CONTENT` with the project context from Step 3 and evaluate what is known.

Check each field:

| Field | Resolvable if … |
|---|---|
| **Feature description** | Ticket name + description produce a clear one-sentence description |
| **Layer** (BE / FE / Full-stack) | Ticket or ADRs make the layer unambiguous |
| **Relevant ADRs** | Layer + description map to one or more ADRs |
| **User scenarios** | Description is specific enough to derive at least one concrete happy-path scenario |
| **Functional requirements** | Description + ADRs yield testable requirements |
| **Edge cases** | Description implies at least one invalid-input or rejection case |
| **Success criteria** | Description implies at least one measurable outcome |
| **Assumptions** | ADRs and description together scope the v1 boundary |

**Only ask about fields that cannot be resolved.** Ask all missing fields in a single message — never one at a time. Never ask more than 5 questions total. Use:

> **Suggested:** [guess] — confirm or correct?

Wait for the user's answers before proceeding.

---

## Step 5 — Draft the spec summary and update the Trello ticket

Using everything gathered (ticket, project context, and user answers from Step 4), compose a concise spec summary:

```
## What we are going to do

<2-3 sentences: what will be built, why, and the key approach. Reference relevant ADRs.>

## Scope

- <bullet: main deliverable>
- <bullet: second deliverable if any>
- Out of scope: <anything explicitly excluded>

## Branch

`<BRANCH_NAME>`
```

Show the draft to the user, then assess `EXISTING_DESCRIPTION`:

- **If `EXISTING_DESCRIPTION` is empty or thin** (fewer than ~3 sentences / no meaningful structure): the description adds little value. Ask:

  > The current ticket description is minimal. Should I **replace** it with the spec summary, or **add it as a comment** instead?
  >
  > **A** — Replace the description
  > **B** — Add as a comment

- **If `EXISTING_DESCRIPTION` is rich** (has meaningful detail, acceptance criteria, context, etc.): the existing description is worth keeping. Ask:

  > The ticket already has a detailed description. Should I **add the spec summary as a comment**, or **replace the description** anyway?
  >
  > **A** — Add as a comment (recommended)
  > **B** — Replace the description

Wait for the user's answer, then apply it via the Trello MCP tool:

- **Replace**: set the card description to the spec summary (this already includes the `## Branch` section).
- **Add as comment**: post the spec summary as a new card comment, **and** append a branch line to the existing description so the branch is visible without opening the comment thread:

  ```
  <EXISTING_DESCRIPTION>

  **Branch:** `<BRANCH_NAME>`
  ```

  Skip the append if `EXISTING_DESCRIPTION` already contains `<BRANCH_NAME>` verbatim.

The branch name must end up in the card's description field either way — never only in a comment.

Print:
> ✓ Trello card updated.

---

## Step 6 — Launch spec-interactive

Invoke the `spec-interactive` skill, passing the one-sentence feature description derived in Step 4 as the argument.

`spec-interactive` will handle the full speckit pipeline from this point (constitution → specify → clarify → plan → tasks → implement) with its own interactive gates.

---

## Done When

- [ ] Branch created (Step 1)
- [ ] Trello ticket read (Step 2)
- [ ] Project context read (Step 3)
- [ ] Missing fields resolved with user (Step 4)
- [ ] Spec summary drafted and Trello card updated (Step 5)
- [ ] `spec-interactive` launched (Step 6)
