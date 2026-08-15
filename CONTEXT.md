# EventMatch NYC

A discovery layer over the NYC Parks public events feed. This glossary fixes the language used across the backend, the frontend, and the issue tracker so that one concept has exactly one name.

## Language

### Source data

**Event**:
One row from the NYC Parks feed, identified by its source `guid`. A weekly class appearing fourteen times in the feed is fourteen Events, not one Event with fourteen dates.
_Avoid_: Occurrence, listing, activity

**Location**:
A physical place where an Event happens, identified by its normalized coordinates and stable source location ID. The display name is never part of its identity.
_Avoid_: Venue, place. `Park` is an optional attribute of a Location, never an entity in its own right.

**Facet**:
A single filterable attribute of an Event — a borough, a category, a registration state, a specific Location.

**Snapshot**:
The complete set of rows returned by one successful full pagination of the source feed.

**Sync Run**:
One execution of the sync worker, recording its status, row count, duration, and errors. A Sync Run either produces a Snapshot or fails and leaves the previous one in place.

### People and their lists

**Profile**:
A person's state in the application, created anonymously on first use and keyed to an opaque device token. A Profile may later be claimed by an account, but it exists and works without one.
_Avoid_: User (reserve for a claimed account specifically), session

**Interest**:
A Facet a Profile has chosen to follow. Interests are single Facets in this version; named combinations of Facets are a later feature.
_Avoid_: Preference, subscription, saved search

**Match**:
An Event automatically collected for a Profile because it carries a Facet that Profile follows as an Interest. A Match is a suggestion the system made.

**Saved**:
An Event a person deliberately chose to keep. A Saved Event is a decision the person made, which is why Saved and Matches are separate lists.

### Provenance

**Stated**:
A fact present in the source record's own text. Only Stated facts may be presented as facts.

**Derived**:
A value EventMatch computed from a source record. Derived values are always labelled as such and never overwrite the raw text they came from.

**Not listed**:
The source is silent on this. Distinct from a negative claim — an Event with no accessibility information is not an inaccessible Event.
