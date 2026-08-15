# Railway hosts Postgres, Redis, and both services

Postgres, Redis, the FastAPI service, and the sync worker all run on Railway, on one private network. Cloudflare is used for DNS, CDN, and R2 only.

Cloudflare was the initial preference but does not sell managed Postgres: D1 is SQLite with a 10GB ceiling, and Hyperdrive is a connection pooler in front of a database hosted elsewhere. Hyperdrive's benefit also depends on running compute on Workers, which cannot host a FastAPI container — so choosing Python in ADR-0001 made Cloudflare's data products inapplicable rather than merely unnecessary.
