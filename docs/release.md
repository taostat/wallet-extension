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

This is already done for `taostat/wallet-extension`. The steps are here so it
can be checked, repaired or redone.

### What exists

| Where             | What                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| GCP project       | `taostats-wallet-extension` (number `426920405585`), only used for releases                                                                     |
| Service account   | `cws-release@taostats-wallet-extension.iam.gserviceaccount.com`, no IAM roles                                                                   |
| Workload Identity | pool `github`, OIDC provider `wallet-extension`                                                                                                 |
| Chrome Web Store  | publisher `T34 Corporation FZCO`; the service account is set under Publisher > Settings > Service account                                       |
| GitHub            | environment `chrome-web-store` (deployments from `main` only), repo variables `CWS_*` and `GCP_*`, environment variable `CROSS_CHAIN_SELL=true` |

There are no Sentry or PostHog secrets, so store builds ship without either.

### Google Cloud (keyless auth, no JSON key stored in GitHub)

Run these with `gcloud` (or in Cloud Shell). They're the commands that created
the setup above:

```bash
PROJECT_ID=taostats-wallet-extension
gcloud config set project "$PROJECT_ID"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

# The IAM Credentials and STS APIs are needed to mint the access token.
gcloud services enable chromewebstore.googleapis.com iamcredentials.googleapis.com sts.googleapis.com

gcloud iam service-accounts create cws-release --display-name="Chrome Web Store release"

gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc wallet-extension \
  --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.environment=assertion.environment \
  --attribute-condition="assertion.repository == 'taostat/wallet-extension' && assertion.environment == 'chrome-web-store'"

SA="cws-release@$PROJECT_ID.iam.gserviceaccount.com"
MEMBER="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/taostat/wallet-extension"
gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser --member="$MEMBER"
gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.serviceAccountTokenCreator --member="$MEMBER"
```

The attribute condition means only jobs from this repo running in the
`chrome-web-store` environment can get a token.

### Chrome Web Store Developer Dashboard

All on **Publisher > Settings** (switch to the right publisher first):

- **Service account**: paste the service account email and click
  **Add a service account**. A publisher can have only one.
- **Publisher ID**: shown under Profile.
- The extension's 32-character item ID is on its **Package** tab under Items.

### GitHub

- Environment `chrome-web-store` (Settings > Environments), with a deployment
  branch rule of `main` only:

  ```bash
  gh api -X PUT repos/taostat/wallet-extension/environments/chrome-web-store --input - <<< '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}'
  gh api -X POST repos/taostat/wallet-extension/environments/chrome-web-store/deployment-branch-policies -f name=main
  ```

- Repo variables: `CWS_PUBLISHER_ID`, `CWS_EXTENSION_ID`,
  `GCP_WORKLOAD_IDENTITY_PROVIDER`
  (`projects/426920405585/locations/global/workloadIdentityPools/github/providers/wallet-extension`),
  `GCP_SERVICE_ACCOUNT`. Set with `gh variable set <NAME> --body <value>`.
- `chrome-web-store` environment variable `CROSS_CHAIN_SELL`: `true` builds
  cross-chain sells into the release. Anything else leaves them out of the zip.
  Our API's `/cross-chain/config` (`enabled`) can still switch them off at
  runtime. Set with
  `gh variable set CROSS_CHAIN_SELL --env chrome-web-store --body true`.
- Optional secrets (same as a local prod build's `.env`): `SENTRY_AUTH_TOKEN`,
  `SENTRY_DSN`, `POSTHOG_AUTH_TOKEN`.

## Troubleshooting

| Failing step                 | Likely cause                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Authenticate to Google Cloud | Provider path, attribute condition, or the two IAM bindings                     |
| Upload, 403                  | Service account not set on the publisher, or wrong publisher ID                 |
| Upload, 404                  | Wrong item ID or publisher ID                                                   |
| Upload, version rejected     | The store already has this version or higher, or a submission is pending review |

Each failure stops before the tag is created, so fix the cause and use
**Re-run failed jobs**. Re-runs read the current variables.
