# NYC Events — Handoff Document

## 1. Project concept

**Working name:** ParkMatch NYC / NYC Parks Concierge

**Core idea:** Build an API-driven discovery and participation layer for NYC Parks public events. Users should be able to find events by park, date, location, category, age/family suitability, registration requirements, accessibility information, and personal intent.

This is not a static calendar or spreadsheet. The application must query the live NYC Parks events source, synchronize the rolling event window, detect additions and changes, and make the current data available to the web experience, AI concierge, notifications, and social-content tools.

**Product thesis:**

> NYC already offers extensive public programming, but people need a way to discover the right event for their interests, time, location, and participation constraints.

The product transforms:

> Official event feed → personalized discovery → practical recommendation → reminder/social distribution

The public-good framing is improved access to public programming, recreation, cultural events, volunteering, nature, and community participation. The MVP should measure discoverability and engagement—not claim increased attendance without attendance data.

## 2. Local project path

```text
/Users/halgorithm/workspaces/AI/nyc-events/
```

Current files:

```text
.env          Local API credentials and endpoint configuration; mode 600
.gitignore    Excludes .env files
HANDOFF.md    This document
```

The attached CSV snapshot may be used as an offline development fixture, but it is not the production source. Runtime data must come from the API.

## 3. Primary data source

**Dataset:** NYC Parks Public Events – Upcoming 14 Days

- Dataset ID: `w3wp-dpdi`
- Agency: NYC Department of Parks and Recreation
- Dataset page: <https://data.cityofnewyork.us/City-Government/NYC-Parks-Public-Events-Upcoming-14-Days/w3wp-dpdi/about_data>
- SODA3 query endpoint: <https://data.cityofnewyork.us/api/v3/views/w3wp-dpdi/query.json>
- Legacy/public JSON endpoint: <https://data.cityofnewyork.us/resource/w3wp-dpdi.json>
- Developer documentation: <https://dev.socrata.com/foundry/data.cityofnewyork.us/w3wp-dpdi>
- SODA3 query documentation: <https://dev.socrata.com/docs/queries.html>
- Authentication documentation: <https://dev.socrata.com/docs/authentication.html>
- Application-token documentation: <https://dev.socrata.com/docs/app-tokens.html>

The dataset is a rolling upcoming-events feed and is intended to update daily. Event rows include titles, descriptions, dates, times, locations, coordinates, park identifiers, categories, registration information, contact details, images, and official event links.

## 4. Local API configuration

The `.env` file contains these variables:

```text
SOCRATA_API_KEY_ID
SOCRATA_API_KEY_SECRET
SOCRATA_APP_TOKEN
SOCRATA_APP_SECRET_TOKEN
SOCRATA_DATASET_ID
SOCRATA_QUERY_ENDPOINT
```

Load the file only on the server or in local development. Never expose these values to browser JavaScript, a mobile bundle, an Instagram client, source control, logs, or generated public content.

The current read-only public-dataset integration was verified using:

- App-token-only authentication: HTTP 200
- API-key/secret Basic Authentication plus app token: HTTP 200
- API-key/secret Basic Authentication alone: HTTP 200
- Two-page full retrieval: 1,000 rows plus 757 rows in the verification snapshot
- Unique `guid` values in that snapshot: 1,757

The OAuth app secret is not needed for the current direct read-only query path. Keep it available only if a future user-facing OAuth flow is actually implemented.

## 5. SODA3 request pattern

Use HTTP POST with a JSON body. Do not depend on URL query parameters for production synchronization.

Example request body:

```json
{
  "query": "SELECT * ORDER BY startdate ASC, starttime ASC",
  "page": {
    "pageNumber": 1,
    "pageSize": 1000
  },
  "includeSynthetic": false
}
```

Recommended headers:

```text
Accept: application/json
Content-Type: application/json
X-App-Token: ${SOCRATA_APP_TOKEN}
```

If the deployment requires full API authentication, add HTTP Basic Authentication using `SOCRATA_API_KEY_ID` and `SOCRATA_API_KEY_SECRET` from the server environment.

Fetch pages until a page returns no rows. The dataset can exceed 1,000 rows, so a one-page implementation is incomplete.

A minimal Python pattern is:

```python
import json
import os
import requests

endpoint = os.environ["SOCRATA_QUERY_ENDPOINT"]
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-App-Token": os.environ["SOCRATA_APP_TOKEN"],
}

page_number = 1
all_rows = []

while True:
    payload = {
        "query": "SELECT * ORDER BY startdate ASC, starttime ASC",
        "page": {"pageNumber": page_number, "pageSize": 1000},
        "includeSynthetic": False,
    }
    response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    rows = response.json()
    if not rows:
        break
    all_rows.extend(rows)
    page_number += 1
```

Use retry with exponential backoff for transient failures. Keep request logs structured and never log authorization headers or environment-variable values.

## 6. Required synchronization architecture

```text
Socrata SODA3 API
        ↓
Sync worker / scheduled job
        ↓
Raw snapshot + normalized event database
        ↓
Application API
        ↓
Web frontend / AI concierge / notifications / social tools
```

### Sync worker responsibilities

1. Fetch every page from SODA3.
2. Validate the response shape and required fields.
3. Normalize dates, times, URLs, coordinates, categories, and registration text.
4. Upsert events by `guid`.
5. Calculate a content hash for change detection.
6. Store `last_seen_at` and synchronization metadata.
7. Classify new, changed, unchanged, explicitly canceled, expired, and removed-from-feed records.
8. Record sync status, row count, duration, and errors.
9. Preserve the last successful snapshot when the API is temporarily unavailable.

Refresh at least daily. Prefer startup refresh plus a periodic schedule every few hours because registration and cancellation details can change within a day even if the source is published daily.

If synchronization fails, the application must show the timestamp of the last successful sync. It must not silently present old data as current.

Do not interpret an event disappearing from the rolling 14-day feed as a cancellation. It may simply have aged out. Only mark cancellation when the source explicitly indicates it.

## 7. Suggested normalized event model

```text
event_guid
source_row_id
source_version
title
instructor
description
official_event_url
registration_url
registration_description
park_ids[]
park_names[]
start_date
end_date
start_datetime
end_datetime
contact_phone
location
categories[]
coordinates[]
latitude
longitude
image_url
source_pub_date
first_seen_at
last_seen_at
content_hash
status
```

Derived fields should remain visibly derived and should never overwrite raw source text:

```text
is_cancelled
is_free_explicit
registration_status
is_kid_friendly
accessibility_mentioned
is_volunteer
is_fitness
is_nature
is_outdoor_explicit
borough
```

Important rules:

- Treat categories as multi-valued; do not count them as mutually exclusive.
- Do not infer that an event is free merely because no price is listed.
- Do not infer accessibility from coordinates or venue names.
- Preserve the raw registration description because it contains important distinctions such as registration required, registration closed, first-come/first-served, lottery, waiver, or no registration required.
- Support multiple coordinates and multiple park IDs for events spanning several locations.
- Deduplicate using `guid`; recurring occurrences may still need date/time-aware display logic.

## 8. Desired user-facing features

### Event exploration

- Google Maps JavaScript API and list views using the same filtered result set
- One circular marker per distinct valid event location, with same-location events aggregated into a numeric count
- A bounded, monotonically increasing marker size based on the number of filtered events at that location
- Marker details that expose every filtered event at the location; viewport clustering must remain distinct from same-location aggregation
- Accessible location/count labels and a list equivalent for events with or without valid coordinates
- Park selection with a 14-day event timeline
- Event detail page
- Date and time filters
- Borough and distance filters
- Category filters
- Kids/family filter
- Fitness and sports filters
- Arts, culture, history, nature, and volunteer filters
- Free-event filter based only on explicit source language
- Registration-required, registration-not-required, and registration-closed filters
- Accessibility-mentioned filter with a clear “verify details” label

### AI concierge

Users should be able to ask questions such as:

- “What can I do with two children in Queens this Saturday?”
- “Find a free event near me that does not require registration.”
- “Show me volunteer events in Brooklyn next week.”
- “What is happening after work near Riverside Park?”
- “Find an outdoor nature activity for a ten-year-old.”

The AI should retrieve current rows, explain why each result matches, summarize descriptions, translate approved event information, and link to the official source page.

The AI must not invent capacity, availability, accessibility, cancellation status, prices, or transportation times. It should say when information is missing or requires verification.

### Saved preferences and notifications

Users should be able to follow:

- Parks
- Boroughs
- Categories
- Event types
- Volunteer opportunities
- Family events
- Fitness classes
- Free movies
- Accessibility-mentioned activities

After each sync, match `new` or materially `changed` events against saved preferences and send one deduplicated notification per event/preference match.

### Social distribution

Use the same normalized event database to generate:

- Daily Instagram carousels
- Borough-specific event roundups
- Weekend family guides
- Volunteer-event stories
- “New today” posts
- Category-specific collections
- Link-in-bio filtered views

Every social asset should include the exact date, time, location, official event link, and a “verify before you go” reminder. Posts should expire after the event ends.

Instagram DMs and comment responses are a later phase. They should query the current backend database, not answer from a stale caption. Public replies involving cancellations, capacity, registration, or accessibility should receive human review during the MVP.

## 9. Recommended MVP order

1. API sync worker with pagination and retries
2. Normalized local database
3. Google Maps/list event explorer with per-location aggregation and count-scaled markers
4. Event detail page with official links and source freshness
5. Core filters
6. Grounded AI event search
7. Save/follow preferences
8. New-event notification simulation
9. Instagram content preview generator

The strongest demo is:

> “I have two kids, live in Queens, want something free tomorrow, and do not want to register.”

The application retrieves current events, displays them on the map, explains the matches, surfaces registration caveats, saves the preference, and generates a social post or reminder.

## 10. Future data integrations

Potential later additions:

- NYC Parks property and facility data for richer park profiles
- Accessibility and facility information
- NYC libraries and library events
- Weather alerts for outdoor-event warnings
- Transit or routing data for travel estimates
- Community partner event feeds
- User-submitted corrections routed through moderation

External data should be labeled separately from the official NYC Parks event record. The event source remains authoritative for event title, schedule, location, and registration information.

## 11. Completion criteria for the first implementation

The first implementation is complete when:

- The app starts without requiring a CSV fixture.
- It reads configuration from `.env`.
- It successfully POSTs to the SODA3 endpoint.
- It paginates through all returned rows.
- It stores or serves current events from a normalized data layer.
- It displays the last successful synchronization time.
- It detects at least one new or changed event between two snapshots.
- It filters events by date, category, and registration state.
- It renders one Google Maps marker per distinct valid filtered location, aggregates same-location events, and increases marker size as the count grows.
- Map marker counts, marker details, and list results remain synchronized after every filter change; events without coordinates remain available in the list.
- AI responses cite/link the underlying official event records.
- No credential appears in browser code, logs, commits, or generated social content.

For Google Maps, use a dedicated browser key restricted to approved HTTP referrers and the Maps JavaScript API. Do not reuse it for server-side APIs or unrelated applications.
