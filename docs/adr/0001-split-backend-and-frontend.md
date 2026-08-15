# Split FastAPI backend and Next.js frontend

EventMatch runs as two deployables rather than one Next.js application: a Python FastAPI service and a separate Next.js frontend. The reasons are that the ETL and sync work is Python, and that the sync worker must scale independently of page traffic.

This decision was **not** made to support rendering on phones. Responsive layout is decided entirely in the frontend and would be identical under a single-app architecture; if that ever becomes the stated rationale, it is a misreading of this record.
