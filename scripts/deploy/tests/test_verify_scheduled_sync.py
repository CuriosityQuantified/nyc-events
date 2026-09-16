import unittest

from scripts.deploy.verify_scheduled_sync import verify_manifest


class ScheduledWorkerManifestTests(unittest.TestCase):
    def test_rejects_the_production_web_server_fallback(self):
        with self.assertRaisesRegex(ValueError, "startCommand"):
            verify_manifest(
                {
                    "meta": {
                        "serviceManifest": {
                            "deploy": {"startCommand": None, "cronSchedule": None}
                        }
                    }
                },
                {
                    "startCommand": ".venv/bin/python -m app.sync",
                    "cronSchedule": "*/5 * * * *",
                },
            )

    def test_requires_all_three_worker_settings_in_deployed_manifest(self):
        expected = {
            "startCommand": ".venv/bin/python -m app.sync",
            "cronSchedule": "*/5 * * * *",
            "restartPolicyType": "NEVER",
        }
        verify_manifest({"meta": {"serviceManifest": {"deploy": expected}}}, expected)
        for key in expected:
            actual = {**expected, key: None}
            with self.subTest(key=key), self.assertRaises(ValueError):
                verify_manifest(
                    {"meta": {"serviceManifest": {"deploy": actual}}}, expected
                )
