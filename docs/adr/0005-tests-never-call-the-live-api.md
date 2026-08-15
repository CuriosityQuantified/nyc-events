# Tests run against fixtures, never the live feed

The test suite calls no network. Two captured Snapshots with a known delta between them live in `backend/tests/fixtures/` and serve as the input for parsing, pagination, normalization, and the entire change-detection layer. A live smoke test runs nightly, outside the merge gate.

The source is a third-party civic data platform with no availability guarantee — during the design session that produced these records, `data.cityofnewyork.us` returned 503 on every endpoint including its own root. The rejected alternative was live calls that skip on failure, which produces a suite that reports green precisely when it has verified nothing.
