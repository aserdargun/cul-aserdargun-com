# CUL — Azure Static Web Apps release

Azure-generated endpoint: [white-hill-060b8fb03.3.azurestaticapps.net](https://white-hill-060b8fb03.3.azurestaticapps.net). Release completion is established by the checks below.

## Target contract

| Setting           | Value                                                      |
| ----------------- | ---------------------------------------------------------- |
| Repository        | `aserdargun/cul-aserdargun-com`                            |
| Production branch | `main`                                                     |
| Subscription      | `aserdargun subscription 4`                                |
| Subscription ID   | `a78f5745-b16b-415a-aaf9-9cfd5d19c6a3`                     |
| Resource group    | `rg-cul-aserdargun-com`                                    |
| Static Web App    | `swa-cul-aserdargun-com`                                   |
| Region / SKU      | `westeurope` / `Free`                                      |
| Static artifact   | `dist/`                                                    |
| Workflow          | `.github/workflows/deploy-swa-cul-aserdargun-com.yml`      |
| Deployment secret | `AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_CUL_ASERDARGUN_COM`   |
| Concurrency       | `swa-cul-aserdargun-com-production`, cancellation disabled |

The generated production URL is reported by the successful Actions deployment and by `az staticwebapp show`. The custom domain is [cul.aserdargun.com](https://cul.aserdargun.com), configured separately through IHS DNS and the existing Azure app.

IHS zone-relative records: `cul` CNAME points to `white-hill-060b8fb03.3.azurestaticapps.net`; `_dnsauth.cul` TXT holds the Azure ownership token. Never commit the token. Domain completion requires matching records from both authoritative nameservers, Azure `Validated`, a matching TLS certificate, HTTPS release verification and a browser check.

## Release pipeline

Pushes to `main` and manual dispatch run the same single workflow:

1. Check out the exact commit and install locked dependencies on Node.js 22.
2. Install Chromium and run TypeScript/build checks, artifact verification, 27 domain tests, 5 release-propagation checks and the complete 24-case browser suite against the built static preview.
3. Upload the already verified `dist/` to the Free app. Both app and API rebuilding are disabled; there is no backend.
4. Check the live `release.json` commit against the workflow SHA, plus root HTML, referenced JS/CSS, content types, security headers and cache policy. If a valid CUL manifest still reports the previous commit immediately after upload, retry at five-second intervals for at most 13 reads (one minute of waiting, plus request time). A persistent mismatch, invalid metadata or response-validation error fails the release; an old commit is never accepted.
5. Run the same complete browser suite against the generated HTTPS production URL.

Official actions are pinned to immutable commits, resolved from their official repositories when configuring this release. Workflow permissions are `contents: read`; no GitHub source integration or PR-comment token is required by Azure.

## Evidence and verification

`dist/release.json` is generated at build time and includes application, package version, complete git commit, UTC build time and build source. It is served with `Cache-Control: no-store`; the root HTML is revalidated, and hashed assets are immutable.

```sh
# Repeat all local release checks against the production build.
CUL_PREVIEW=1 npm run validate

# Verify a known deployed SHA and run browser checks against that exact site.
CUL_BASE_URL='https://<azure-generated-hostname>' EXPECTED_COMMIT='<full-sha>' npm run verify:live
CUL_BASE_URL='https://<azure-generated-hostname>' npm run test:ui

az staticwebapp show --name swa-cul-aserdargun-com --resource-group rg-cul-aserdargun-com --subscription a78f5745-b16b-415a-aaf9-9cfd5d19c6a3
az staticwebapp environment list --name swa-cul-aserdargun-com --resource-group rg-cul-aserdargun-com --subscription a78f5745-b16b-415a-aaf9-9cfd5d19c6a3
```

Completion requires the matching pushed commit, successful Actions run including production browser checks, Azure production `Ready`, matching live metadata, and verified rendered UI. A resource merely being created or a workflow being queued is not completion.

The deployment token is transferred directly from Azure CLI to the repository secret and is never committed or printed. If rotation is needed, rotate the Azure deployment token and update that same secret; do not introduce another workflow.

## Scope and operations

- The app remains a deterministic synthetic educational laboratory after publication. There is no live model, OCR, desktop control, account access, telemetry or persistence backend.
- Keep the existing resource in this exact subscription; always pass the subscription ID explicitly.
- To roll back application code, revert the intended code change and push a new commit through the same validation/deployment pipeline. Do not delete the app or mutate DNS.
- [Earlier local validation](VALIDATION.md) records the pre-deployment checks. The workflow and live SHA provide release-specific verification.
