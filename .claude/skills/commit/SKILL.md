---
name: "commit"
description: "Stage and create a conventional commit without a co-authored-by trailer."
argument-hint: "Optional hint or scope (e.g. 'fix login redirect' or leave empty to auto-derive from diff)"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

Use `$ARGUMENTS` as an optional hint when drafting the commit message. If empty, derive everything from the diff.

---

## Step 1 — Inspect working tree

Run in parallel:

```bash
git status
git diff --staged
git diff
git log --oneline -5
```

- If there are no staged or unstaged changes, print:
  > Nothing to commit — working tree is clean.
  And stop.

---

## Step 2 — Stage files

If there are unstaged changes but nothing is staged, run `git add -A` after listing what will be staged so the user can see it.

If some files are already staged and others are not, ask the user:

> Some files are unstaged. Stage everything, or commit only what's already staged?
>
> **A** — Stage everything (`git add -A`)
> **B** — Commit only what's staged

Wait for the answer, then act accordingly.

---

## Step 3 — Draft the commit message

Analyze the staged diff and the optional hint from `$ARGUMENTS` to produce a conventional commit message.

**Format**:

```
<type>(<scope>): <short description>

[optional body — only when the why is non-obvious]
```

**Type rules**:

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, missing semicolons — no logic change |
| `chore` | Build process, tooling, dependency updates |
| `ci` | CI/CD configuration changes |
| `revert` | Reverts a previous commit |

**Rules**:

- `<scope>` is optional; use it when the change is clearly scoped to one module, layer, or file (e.g. `feat(executor): …`, `fix(toolbar): …`). Omit parentheses when scope is omitted.
- `<short description>` is lowercase, imperative mood, no period, max 72 chars.
- Add a body only when the **why** is non-obvious. Never describe what the diff already shows.
- No `Co-Authored-By` trailer. No `🤖 Generated with` footer.

Show the drafted message to the user:

```
Proposed commit message:

<type>(<scope>): <short description>

<body if any>

Confirm? (yes / edit / cancel)
```

Wait for the user's response.

- **yes** — proceed to Step 4.
- **edit** — ask the user to provide the corrected message, then proceed to Step 4 with their version.
- **cancel** — abort and print `Commit cancelled.`

---

## Step 4 — Commit

Run:

```bash
git commit -m "$(cat <<'EOF'
<final message>
EOF
)"
```

Print the output of the commit command so the user can see the result.

---

## Done When

- [ ] Working tree inspected
- [ ] Files staged as needed
- [ ] Commit message drafted and confirmed by user
- [ ] Commit created with no co-authored-by trailer
