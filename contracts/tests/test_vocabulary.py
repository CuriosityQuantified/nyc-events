from __future__ import annotations

import unittest

from contracts.vocabulary import walk_keys


class TransitVocabularyTests(unittest.TestCase):
    def test_documented_straight_line_payload_is_allowed(self) -> None:
        walk_keys(
            {
                "line_id": "A",
                "nearest_stop": {"id": "A15", "name": "125 St"},
                "straight_line_distance_miles": 0.25,
            }
        )

    def test_common_routing_and_travel_time_synonyms_are_rejected(self) -> None:
        for key in (
            "walking_minutes",
            "travel_duration",
            "travel_time_seconds",
            "route_steps",
            "directions",
            "eta",
        ):
            with (
                self.subTest(key=key),
                self.assertRaisesRegex(ValueError, "vocabulary violation"),
            ):
                walk_keys({key: 10})


if __name__ == "__main__":
    unittest.main()
