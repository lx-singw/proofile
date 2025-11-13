Testing integration features inside docker-compose

When running integration or E2E tests from inside the backend container (for example via `docker-compose exec backend ...`), the test process runs in the compose network namespace and cannot reach services bound to `127.0.0.1` on the host. To make tests reproducible in that context, the project supports the following environment variables:

- BACKEND_INTERNAL_URL - URL used by server-side code (Next.js rewrites / server-side fetches) to reach the backend service inside compose. Example: `http://backend:8000`
- FRONTEND_INTERNAL_URL - URL used to reach the frontend dev server from other containers inside compose. Example: `http://frontend:3000`

Guidance

- When running a test inside the backend container, set these variables (or rely on the defaults) so tests will contact the correct internal hostnames:

  - BACKEND_INTERNAL_URL defaults to `http://backend:8000`.
  - FRONTEND_INTERNAL_URL defaults to `http://frontend:3000`.

- Example: run a single integration test from the backend container:

```bash
# from repository root (docker-compose must be up)
docker-compose exec backend bash -lc "cd /app && BACKEND_INTERNAL_URL=http://backend:8000 FRONTEND_INTERNAL_URL=http://frontend:3000 poetry run pytest -q app/tests/integration/test_proxy_post.py"
```

Why this matters

- Containers have separate network namespaces; using internal compose hostnames lets services talk to each other reliably.
- The project test harness includes heuristics to detect container execution and will prefer these env vars when present. Setting them explicitly improves reproducibility in CI and developer runs.

If you need help wiring these into your CI job or `make` targets, open an issue or ask for a change to the compose setup.

Node modules and running frontend tests in-container

When running frontend tests inside the `frontend` container, the host bind-mount `./frontend:/app` will hide the `node_modules` directory that was created during image build. To avoid the Next.js binary and other installed packages being hidden, this repository uses a named volume for `node_modules` so the image-installed dependencies remain available to the running container.

How it works:
- docker-compose mounts the project source at `/app` from the host and additionally mounts a named volume to `/app/node_modules`.
- During CI or local setup we populate the volume by running `npm ci` once in a one-off container (the Makefile and this README show examples). That ensures `next`, jest and other binaries are present inside the container even when the host source is mounted.

Quick example to populate node_modules (one-time):

```bash
# populate the named volume with packages (runs npm ci inside a temporary container)
docker-compose run --rm frontend sh -c "npm ci --no-audit --no-fund"
```

After populating the named volume you can run the in-container test target:

```bash
make test-frontend
```

This pattern keeps fast rebuilds during development while preserving the runtime dependencies the container expects.
