"""Subway proximity distance and server-side query helpers."""

from __future__ import annotations

import math
from typing import Any

from sqlalchemy import Select, func, select, true
from sqlalchemy.orm import aliased

from app.models.event import CurrentEvent
from app.models.subway import CurrentEventLocation, SubwayRouteStop, SubwayStop

EARTH_RADIUS_MILES = 3958.7613
MAX_SUBWAY_DISTANCE_MILES = 0.5
_MILES_PER_LATITUDE_DEGREE = 69.0


def _valid_coordinate(latitude: float, longitude: float) -> bool:
    return (
        math.isfinite(latitude)
        and math.isfinite(longitude)
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
        and (latitude != 0 or longitude != 0)
    )


def straight_line_distance_miles(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float | None:
    """Return deterministic great-circle distance, or None for invalid input."""
    if not _valid_coordinate(latitude_a, longitude_a) or not _valid_coordinate(
        latitude_b, longitude_b
    ):
        return None
    lat_a, lat_b = math.radians(latitude_a), math.radians(latitude_b)
    lat_delta = lat_b - lat_a
    lon_delta = math.radians(longitude_b - longitude_a)
    haversine = (
        math.sin(lat_delta / 2) ** 2
        + math.cos(lat_a) * math.cos(lat_b) * math.sin(lon_delta / 2) ** 2
    )
    return 2 * EARTH_RADIUS_MILES * math.asin(math.sqrt(min(1.0, haversine)))


def nearest_stop_subquery(route_id: str) -> Any:
    """Build an indexed query for the nearest station served by one route."""
    platform = aliased(SubwayStop, name="served_platform")
    station = aliased(SubwayStop, name="served_station")
    served_station_ids = (
        select(
            func.coalesce(platform.parent_station, platform.stop_id).label("stop_id")
        )
        .select_from(SubwayRouteStop)
        .join(platform, platform.stop_id == SubwayRouteStop.stop_id)
        .where(SubwayRouteStop.route_id == route_id)
        .distinct()
        .subquery("served_station_ids")
    )
    served_stations = (
        select(
            station.stop_id,
            station.name.label("stop_name"),
            station.latitude,
            station.longitude,
        )
        .where(station.stop_id.in_(select(served_station_ids.c.stop_id)))
        .subquery("served_stations")
    )
    latitude_window = MAX_SUBWAY_DISTANCE_MILES / _MILES_PER_LATITUDE_DEGREE
    longitude_window = latitude_window / func.greatest(
        0.2, func.cos(func.radians(served_stations.c.latitude))
    )
    nearby_events = (
        select(
            CurrentEventLocation.event_guid,
            CurrentEventLocation.latitude,
            CurrentEventLocation.longitude,
        )
        .where(
            CurrentEventLocation.latitude.between(
                served_stations.c.latitude - latitude_window,
                served_stations.c.latitude + latitude_window,
            ),
            CurrentEventLocation.longitude.between(
                served_stations.c.longitude - longitude_window,
                served_stations.c.longitude + longitude_window,
            ),
        )
        .limit(2_147_483_647)
        .lateral("nearby_event_locations")
    )
    event_lat = func.radians(nearby_events.c.latitude)
    stop_lat = func.radians(served_stations.c.latitude)
    lat_delta = stop_lat - event_lat
    lon_delta = func.radians(served_stations.c.longitude - nearby_events.c.longitude)
    haversine = func.pow(func.sin(lat_delta / 2), 2) + func.cos(event_lat) * func.cos(
        stop_lat
    ) * func.pow(func.sin(lon_delta / 2), 2)
    distance = (
        2 * EARTH_RADIUS_MILES * func.asin(func.sqrt(func.least(1.0, haversine)))
    ).label("distance_miles")
    candidates = (
        select(
            nearby_events.c.event_guid.label("event_guid"),
            served_stations.c.stop_id,
            served_stations.c.stop_name,
            distance,
        )
        .select_from(served_stations)
        .join(nearby_events, true())
        .subquery("subway_candidates")
    )
    ranked = (
        select(
            candidates.c.event_guid,
            candidates.c.stop_id,
            candidates.c.stop_name,
            candidates.c.distance_miles,
            func.row_number()
            .over(
                partition_by=candidates.c.event_guid,
                order_by=(candidates.c.distance_miles, candidates.c.stop_id),
            )
            .label("rank"),
        )
        .where(candidates.c.distance_miles < MAX_SUBWAY_DISTANCE_MILES)
        .subquery("ranked_subway_stops")
    )
    return (
        select(
            ranked.c.event_guid,
            ranked.c.stop_id,
            ranked.c.stop_name,
            ranked.c.distance_miles,
        )
        .where(ranked.c.rank == 1)
        .subquery("nearest_subway_stops")
    )


def apply_subway_filter(query: Select[Any], route_id: str) -> tuple[Select[Any], Any]:
    """Join an Event query to one deterministic nearest-stop result per Event."""
    nearest = nearest_stop_subquery(route_id)
    return query.join(nearest, nearest.c.event_guid == CurrentEvent.guid), nearest
