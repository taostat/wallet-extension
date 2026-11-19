# Releasing to the Chrome Web Store

`.github/workflows/release-chrome.yml` runs on every push to `main`.

1. Bump `version` in `apps/extension/package.json` in your PR.
2. Merge. The workflow builds `pnpm build:extension:prod`, uploads the zip to the
   Chrome Web Store as a **draft**, tags the commit `release/v<version>` and
   attaches the zip to a GitHub release.
3. Open the [Developer Dashboard](https://chrome.google.com/webstore/devconsole),
   check the draft and click **Submit for review**.

A merge that doesn't change the version finds the tag already there and stops.
To re-run a failed release, use **Run workflow** on the Actions tab (the tag is
only created after a successful upload).

## Runner

Hippius (`hippius-large`) by default. If Hippius is down, set the repo variable
`RELEASE_RUNNER` to `github` to use `ubuntu-latest`:

```bash
gh variable set RELEASE_RUNNER --body github
```

The "Hippius Runners" GitHub App on the org's Hippius account must have access
to this repository.

## PR checks

`.github/workflows/pr.yml` runs `pnpm lint`, `pnpm test` and
`pnpm build:extension:ci` on every PR to `main`, and attaches the CI build zip
to the run (kept 14 days). Load it unpacked from `chrome://extensions` to try a PR.

- PRs from branches in this repo run on `hippius-large`. PRs from forks always
  run on `ubuntu-latest`, because the repo is public and fork code shouldn't run
  on our Hippius VMs. To keep every PR off Hippius:
  `gh variable set PR_RUNNER --body github`.
- To block merges on it, add the **Lint, test and build** check as required in
  a `main` branch ruleset. Renaming the job means updating the ruleset too.

The release workflow runs lint and tests again before building, in case
something lands on `main` without a PR.

## One-time setup

### Google Cloud (keyless auth, no JSON key stored in GitHub)

1. In a GCP project, enable the **Chrome Web Store API**.
2. Create a service account (no IAM roles needed), e.g.
   `cws-release@<project>.iam.gserviceaccount.com`.
3. Create a Workload Identity Pool + GitHub OIDC provider, restricted to this
   repo and the release environment:
   - issuer `https://token.actions.githubusercontent.com`
   - attribute condition:
     `assertion.repository == 'taostat/wallet-extension' && assertion.environment == 'chrome-web-store'`
4. Grant the pool principal `roles/iam.workloadIdentityUser` **and**
   `roles/iam.serviceAccountTokenCreator` on the service account (the workflow
   mints an OAuth access token for it).

### Chrome Web Store Developer Dashboard

- **Account** section: add the service account email (one per publisher).
- **Publisher > Settings**: copy the publisher ID.
- The extension's 32-character item ID is on its **Package** tab.

### GitHub

- Environment `chrome-web-store` (Settings > Environments), with a deployment
  branch rule of `main` only.
- Repo variables: `CWS_PUBLISHER_ID`, `CWS_EXTENSION_ID`,
  `GCP_WORKLOAD_IDENTITY_PROVIDER`
  (`projects/<number>/locations/global/workloadIdentityPools/<pool>/providers/<provider>`),
  `GCP_SERVICE_ACCOUNT`.
- Optional `chrome-web-store` environment variable `CROSS_CHAIN_SELL`: `true`
  builds cross-chain sells into the release. Anything else leaves them out of
  the zip. Our API's `/cross-chain/config` (`enabled`) can still switch them
  off at runtime.
- Optional secrets (same as a local prod build's `.env`): `SENTRY_AUTH_TOKEN`,
  `SENTRY_DSN`, `POSTHOG_AUTH_TOKEN`.
