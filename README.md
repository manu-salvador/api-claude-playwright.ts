# Go Rest API Automation

Repo de automation de la API Go Rest, armada con Claude.

API test automation for [Go Rest](https://gorest.co.in) (`/public/v2`) built with **Playwright + TypeScript**, structured with **SOLID** principles, runnable against **INT** and **UAT**, reported with **Allure** and executed in **GitHub Actions**.

## Quick start

```bash
npm ci
cp .env.example .env          # then set GOREST_TOKEN (https://gorest.co.in/consumer/login)
npm run test:int              # or: npm run test:uat
npm run allure:serve          # open the Allure report
```

> Without `GOREST_TOKEN` only the public tests (`@public`) run; tests that need authentication are **skipped**, not failed.

## Environments

| Env | How to run | Settings | Secrets |
|-----|------------|----------|---------|
| `int` (default) | `npm run test:int` | `src/config/environments.ts` | `.env.int` or `.env` |
| `uat` | `npm run test:uat` | `src/config/environments.ts` | `.env.uat` or `.env` |

Resolution order: `process.env` (CI) → `.env.<TEST_ENV>` → `.env` → defaults. Supported variables: `GOREST_TOKEN`, `BASE_URL`, `REQUEST_TIMEOUT`.
Every `.env*` file is git-ignored except `.env.example`.

Go Rest only exposes one public instance, so both environments point to it by default; set `BASE_URL` to target another deployment.

## Project structure

```
src/
├── config/        ConfigLoader + per-environment settings (int / uat)
├── constants/     HttpStatus, ErrorMessages, Endpoints, Tags
├── core/
│   ├── http/      IHttpClient, PlaywrightHttpClient, ApiResponse
│   ├── auth/      IAuthProvider, BearerTokenAuthProvider, NoAuthProvider
│   └── reporting/ IRequestReporter, AllureRequestReporter, NullRequestReporter
├── services/      BaseResourceService + Users/Posts/Comments/Todos services, GoRestApi facade
├── models/        Typed models and payloads
├── builders/      Fluent payload builders (with / withEmpty / without / withValue)
├── schemas/       JSON schemas (Ajv) for contract validation
├── assertions/    Custom matchers: toHaveStatus, toMatchSchema, toHaveValidationError, toHaveErrorMessage
├── data/          Data-driven case tables (parametric, pagination, invalid ids)
└── fixtures/      Playwright fixtures, ApiClientFactory (composition root), TestDataManager
tests/
└── <resource>/    *.happy-path | *.functional | *.status-codes | *.validation
```

## SOLID applied

| Principle | Where |
|-----------|-------|
| **S**ingle responsibility | `ConfigLoader` only resolves config, `PlaywrightHttpClient` only does HTTP, `AllureRequestReporter` only reports, `SchemaValidator` only validates, `TestDataManager` only handles data lifecycle. |
| **O**pen/closed | New resources extend `BaseResourceService` (just declare `endpoint`), new scenarios are new rows in `src/data/*`. |
| **L**iskov substitution | Any `IAuthProvider` (`Bearer`, `NoAuth`) or `IRequestReporter` (`Allure`, `Null`) can be swapped without changing callers. |
| **I**nterface segregation | `IHttpClient` exposes a single `request()`; `IAuthProvider` a single `getHeaders()`. |
| **D**ependency inversion | Services depend on `IHttpClient`, the client on `IAuthProvider`/`IRequestReporter`; concrete classes are wired only in `ApiClientFactory`. |

## Test coverage

Resources: **users, posts, comments, todos**.

| Category | Tag | What it covers |
|----------|-----|----------------|
| Happy path | `@happy-path` `@smoke` | List, create, get, PUT, PATCH, DELETE |
| Functional | `@functional` | Pagination, filters, nested resources, uniqueness, persistence, re-assignment |
| Status codes | `@status-codes` | 200, 201, 204, 304, 401 (no token / invalid token), 404, 406, 422, 4xx for malformed JSON / bad Content-Type |
| Empty fields | `@empty-fields` | Every required field as `""`, whitespace, all empty (POST and PATCH) |
| Missing fields | `@missing-fields` | Every required field omitted, `{}` body, unknown fields |
| Parametric | `@parametric` | Wrong types (string in integer `user_id`/`post_id`, integer in `email`/`gender`/`status`, booleans, nulls), invalid enums/formats, invalid query params and path ids |

Run a slice: `npx playwright test --grep @parametric` · `npm run test:uat:smoke`.

### Status codes not covered deterministically

Go Rest documents 400, 403, 405, 415, 429 and 500 but does not return them in a reproducible way (e.g. unsupported methods return 404, rate limiting depends on traffic). Malformed JSON and unsupported `Content-Type` are asserted as a generic 4xx.

## Allure

```bash
npm run allure:generate && npm run allure:open   # static report
npm run allure:serve                             # temporary server
```

Each HTTP call is an Allure step with `Request`, `Response` and `cURL` attachments (the `Authorization` header is masked). Environment info and failure categories are added automatically. Requires Java 8+.

## GitHub Actions

Workflow: `.github/workflows/api-tests.yml`

- **push / PR to `main`** → INT
- **nightly (Mon–Fri 03:00 UTC)** → UAT
- **manual (`workflow_dispatch`)** → choose `int`/`uat` and an optional `--grep` tag

Setup:
1. Create GitHub **Environments** `int` and `uat` (Settings → Environments), each with secret `GOREST_TOKEN` (and optional variable `BASE_URL`).
2. Enable GitHub Pages from the `gh-pages` branch to browse reports at `https://<owner>.github.io/<repo>/<env>/` (history kept per environment).
3. The report is also uploaded as a workflow artifact.
