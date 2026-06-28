# Feature Specification: On-Demand npm Package Injection

**Feature Branch**: `feature/npm-packages-be`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "On-demand npm package injection: when the user adds a package and alias in the UI, the backend runs npm install and esbuild to produce an IIFE bundle cached in the OS app-data directory, then injects the cached bundle as a named V8 global before each execution — supporting any npm package without a rebuild, rejecting empty aliases, and surfacing npm or esbuild failures as descriptive errors before any user code runs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — First Run: Package Prepared and Used (Priority: P1)

A sandbox user types a package name (e.g. `lodash`) and a global name (e.g. `_`) into the package panel, then runs code that references that global. The sandbox prepares the package on the first use and makes it available. The output is correct.

**Why this priority**: This is the core value of the feature. Every other story depends on the package preparation pathway working end-to-end.

**Independent Test**: Add lodash with alias `_`, run `_.chunk([1,2,3,4], 2)`, confirm output is `[[1,2],[3,4]]` with no error.

**Acceptance Scenarios**:

1. **Given** the user has added `lodash` with alias `_` and has never used it before, **When** they run `_.chunk([1,2,3,4], 2)`, **Then** the sandbox prepares the package, and the output is `[[1,2],[3,4]]` with no error.
2. **Given** the user has added `zod` with alias `z`, **When** they run code that calls `z.string().parse("hello")`, **Then** the result is `"hello"` with no error.

---

### User Story 2 — Repeat Run Uses Cache (Priority: P1)

A sandbox user runs code with a package they have used before. The sandbox does not re-prepare the package — it uses the previously prepared bundle immediately. The run is noticeably faster than the first.

**Why this priority**: Without caching, every execution would trigger an external package fetch, making the sandbox unusable for iterative development. Caching is essential to the experience.

**Independent Test**: Run any code with a previously used package twice. Confirm the second run produces the same output and does not trigger package preparation again.

**Acceptance Scenarios**:

1. **Given** lodash with alias `_` has been used at least once before, **When** the user runs any code using `_`, **Then** no package preparation occurs and the output is produced using the previously prepared bundle.

---

### User Story 3 — Multiple Packages in One Execution (Priority: P1)

A sandbox user adds several packages, each with its own global name. All are available in the same code execution without interfering with each other.

**Why this priority**: Combining packages (e.g. a utility library and a date formatter) is a common real-world use case. The feature is only useful if multiple packages work together.

**Independent Test**: Add lodash as `_` and date-fns as `dateFns`. Run code that calls functions from both. Confirm both produce correct output.

**Acceptance Scenarios**:

1. **Given** the user has added `lodash` as `_` and `date-fns` as `dateFns`, **When** they run code that uses both, **Then** both globals are available and both return correct results.
2. **Given** the user has added five different packages each with a distinct global name, **When** they run code referencing all five, **Then** all five are available with no interference.

---

### User Story 4 — Unknown Package Produces a Clear Error (Priority: P1)

A sandbox user types a package name that does not exist in the public package registry. The sandbox surfaces a clear, actionable error message before running any code.

**Why this priority**: Without a clear error, users would see a confusing failure with no guidance. Error clarity is essential for usability.

**Independent Test**: Add a package with a made-up name (e.g. `not-a-real-package-xyzzy`). Confirm the sandbox returns an error identifying the package by name, and no user code executes.

**Acceptance Scenarios**:

1. **Given** the user has added `not-a-real-package-xyzzy` with any alias, **When** they run any code, **Then** the sandbox returns an error identifying `not-a-real-package-xyzzy` as unavailable, and no user code executes.

---

### User Story 5 — Empty Alias Rejected Before Any Work (Priority: P1)

A sandbox user submits a package entry with no global name. The sandbox rejects it immediately with a validation error — before attempting any package preparation.

**Why this priority**: An empty alias would make the package inaccessible in code and cause a confusing silent failure. Early validation prevents wasted time and confusing errors.

**Independent Test**: Add any package with an empty alias `""`. Confirm a validation error is returned before any package preparation begins.

**Acceptance Scenarios**:

1. **Given** the user has added `lodash` with an empty alias `""`, **When** they attempt to run any code, **Then** a validation error is returned immediately, and no package preparation occurs.

---

### User Story 6 — No Packages: Normal Execution Unchanged (Priority: P1)

A sandbox user who has not added any packages can still run JavaScript normally. The absence of package entries has no effect on execution.

**Why this priority**: Preserving existing behaviour for users who don't use packages is a non-negotiable non-regression requirement.

**Independent Test**: Run `1 + 1` with no packages added. Confirm output is `2` and no errors occur.

**Acceptance Scenarios**:

1. **Given** the user has added no packages, **When** they run `1 + 1`, **Then** the output is `2` with no errors.
2. **Given** the user has added no packages, **When** they run code that references a name like `_`, **Then** the standard "not defined" error is produced — not a package error.

---

### User Story 7 — Custom Global Name (Priority: P2)

A sandbox user assigns a non-default global name to a package. The package is accessible only under that name; any other name for the same package is not defined.

**Why this priority**: Custom naming avoids conflicts between packages and with existing variables. It is P2 because the primary value is delivered by P1 stories; this is a refinement.

**Independent Test**: Add lodash with alias `lo` instead of `_`. Run `lo.chunk([1,2,3], 2)`. Confirm it works and `_` is not defined.

**Acceptance Scenarios**:

1. **Given** the user has added `lodash` with alias `lo`, **When** they run `lo.chunk([1,2,3], 2)`, **Then** the output is correct, and `_` is not defined.

---

### Edge Cases

- Two packages added with the same global name: the second overwrites the first in the execution scope. No error is raised; this is documented behaviour.
- A global name that matches a JavaScript built-in (e.g. `Array`, `Math`): allowed. The user accepts responsibility for overriding the built-in.
- A package that exists on the registry but has no browser-compatible build: the preparation step may succeed but the bundle may fail to load. The sandbox returns a descriptive error before running user code.
- Same package name added twice with different global names: both globals are injected; preparation occurs only once for that package name.
- Package preparation tooling is not available on the user's machine: the sandbox returns a clear error explaining what is missing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sandbox MUST accept a list of zero or more (package name, global name) pairs alongside user code, and make each package available under its specified global name before executing the code.
- **FR-002**: The sandbox MUST reject any entry where the global name is empty, returning a validation error before attempting any package preparation.
- **FR-003**: For any package not yet prepared, the sandbox MUST prepare it (fetch and bundle) on first use and store the result in a persistent local cache.
- **FR-004**: For any package already in the cache, the sandbox MUST use the cached result without re-fetching or re-bundling.
- **FR-005**: If package preparation fails (package not found, fetch failure, or bundling failure), the sandbox MUST return a descriptive error identifying the package by name, before executing any user code.
- **FR-006**: If required preparation tooling is not available on the user's machine, the sandbox MUST return a clear error identifying what is missing, before executing any user code.
- **FR-007**: An empty package list MUST be valid input and MUST result in execution with no additional globals injected — identical to pre-feature behaviour.
- **FR-008**: The existing restriction on `import` statements in user code MUST remain unchanged.

### Key Entities

- **PackageEntry**: An association between a package name (e.g. `lodash`) and a user-chosen global name (e.g. `_`). An execution carries zero or more PackageEntries.
- **BundleCache**: A persistent, per-machine store of prepared package bundles. Keyed by package name. Eliminates re-preparation on subsequent runs. Lives in the OS-appropriate application data directory.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A package added for the first time is available as a callable global in user code, with correct output, across 100% of acceptance scenarios for User Story 1.
- **SC-002**: A repeat run with a previously prepared package produces the same output as the first run, and no package preparation occurs — verifiable by the absence of external tool invocations on the second run.
- **SC-003**: All error cases (unknown package, empty alias, missing tooling, bundle failure) produce a human-readable error message returned before any user code executes — 100% of error scenarios produce output the user can act on.
- **SC-004**: All pre-existing execution tests (no packages) continue to pass without modification — zero regressions.
- **SC-005**: Multiple packages can be used simultaneously within a single execution with correct output for each — verified across at least five packages in a single run.

## Assumptions

- No software installation is required on the user's machine. Package bundles are fetched from a public CDN on first use; all subsequent runs use the local cache.
- Internet access is required only on the first use of a package. After that, the sandbox works fully offline for that package.
- Packages that require Node.js system APIs (file system, process spawning, network sockets, etc.) will not work inside the sandbox. This is intentional: the sandbox is designed to run browser-compatible code only, which is a security property of the product.
- Package versions are not pinned by default. The user can specify a version in the package name field (e.g. `lodash@4.17.21`) if version locking is needed.
- The bundle cache is per-machine and persists across sessions. Cache invalidation and clearing are out of scope for this version.
- No package allowlist is enforced. Any package name the user enters is attempted. Security is provided by the V8 execution sandbox, not by restricting which packages can be loaded.
- The companion frontend feature (the package manager panel UI) is out of scope for this ticket. This specification covers only the execution-side behaviour.
