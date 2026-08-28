# Current system boundaries

Status: current implementation snapshot; target migrations below are not
implemented.

- `frontend/` is a Next.js application with the authenticated dashboard,
  preparation, simulation, report, billing, and administrative screens.
- `backend/` is a FastAPI application with SQLAlchemy models, Alembic
  migrations, background worker code, simulation and document services, and
  billing/webhook routes.
- PostgreSQL is the durable database boundary used by the backend.
- Supabase Auth and Supabase Storage remain legacy runtime dependencies during
  the controlled migration period.
- `nginx/`, Docker Compose, and deployment scripts are operational boundaries;
  a local Docker binary is not assumed.
- `.harness/` is a local agent control plane, not a product runtime dependency.
  Its ignored runtime state and cold AAS checkout must not become application
  imports.

Storage and Auth migrations are separate future changes. Do not implement them
from this document alone; use the corresponding migration gate.
