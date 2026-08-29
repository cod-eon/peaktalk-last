# Manual Deploy Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the already-verified `origin/main` commit when GitHub artifact storage rejects every upload despite an empty artifact inventory.

**Architecture:** Keep the normal immutable-artifact release path unchanged. Add an explicit, manual-only `direct_deploy` mode to the existing workflow: it checks out and verifies an exact `origin/main` SHA, builds the same pinned images, assembles the same checksummed release bundle in runner-local storage, then transfers it directly to the VDS and invokes the unchanged guarded `deploy.sh`.

**Tech Stack:** GitHub Actions, Docker, Bash, SSH/rsync, existing PeakTalk `deploy.sh`

**Spec:** User-approved manual deployment recovery in the current PeakTalk landing release task.

## Global Constraints

- Do not change application, auth, billing, database, migration, or product behavior.
- The target must be a full 40-character SHA and must equal current `origin/main`.
- Keep pre-deploy backup, migration execution, health checks, deploy lock, and runtime rollback in `deploy.sh` unchanged.
- The direct path must be opt-in and unavailable on pull requests or pushes.
- Preserve the standard artifact-based release path as the default.

---

### Task 1: Add the manual direct transport

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `workflow_dispatch` inputs `direct_deploy` and `target_sha`, existing deployment secrets, current `deploy.sh` contract.
- Produces: a `Direct deploy exact main SHA to VDS` job that transfers the same three release files without `actions/upload-artifact`.

- [ ] **Step 1: Establish the failing condition**

Record the third failed release job log showing `Failed to CreateArtifact: Artifact storage quota has been hit` while the repository artifact API reports `total_count: 0`.

- [ ] **Step 2: Add opt-in inputs and skip artifact transport only in direct mode**

Add a boolean `direct_deploy` input defaulting to `false`, an optional `target_sha` string, and exclude `build-artifact` when direct mode is selected.

- [ ] **Step 3: Implement the direct job**

Reuse the existing image build, manifest/checksum, SSH validation, rsync, activation, and public health commands. Validate that checked-out `HEAD`, `target_sha`, and fetched `origin/main` are identical before building.

- [ ] **Step 4: Validate locally**

Run `git diff --check`, parse the YAML, run `bash -n deploy.sh`, and run the repository harness tests. Inspect the resulting diff for secret exposure and for accidental changes to the default release path.

- [ ] **Step 5: Independent review**

Ask a review agent to check SHA pinning, event conditions, secrets handling, concurrency/locking, rollback preservation, and artifact-path isolation. Resolve any verified findings.

- [ ] **Step 6: Commit and push the recovery branch**

Commit only the workflow and plan, then push `codex/manual-deploy-recovery-20260829`.

### Task 2: Execute and verify production release

**Files:**
- No additional repository files.

**Interfaces:**
- Consumes: the reviewed workflow branch and target SHA `7e062f6b2980e356d78ed8ad0e58b050441016ea`.
- Produces: a verified production release plus run/log evidence.

- [ ] **Step 1: Dispatch the workflow**

Run `.github/workflows/deploy.yml` on the recovery branch with `direct_deploy=true` and the exact target SHA.

- [ ] **Step 2: Monitor server activation**

Require successful build, checksum assembly, SSH transfer, backup, migrations, stack activation, local health, and public health. Stop on the first failure and inspect its full job log.

- [ ] **Step 3: Run production smoke tests**

Check `/health`, public routes, approved landing headline, current price, media assets, the landing contract test, and desktop/mobile browser QA without any auth mock.

- [ ] **Step 4: Record release evidence**

Record deploy and health checks in the existing harness task, complete it only after all checks are green, and report the exact release SHA and rollback state.
