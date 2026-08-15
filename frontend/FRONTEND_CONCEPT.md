# EventMatch NYC — Initial Frontend Direction

## Consensus basis

This document synthesizes the overlapping recommendations from 12 independent frontend ideation passes covering product UX, mobile design, maps, AI interaction, accessibility, civic trust, visual design, family planning, power-user workflows, social distribution, MVP engineering, and QA/privacy.

The common direction was:

> **A mobile-first, list-first NYC Parks event explorer with optional map discovery, grounded natural-language search, transparent source/freshness treatment, explicit unknown states, official-detail handoffs, and lightweight saving/sharing.**

The product should be a source-aware decision tool—not a generic calendar, social feed, attendance predictor, or opaque chatbot.

## Product definition

The core user journey is:

> **Describe an outing → filter trustworthy options → inspect official details → save/share a plan → verify before attending**

EventMatch should help users answer:

- What is happening?
- When and where?
- Is registration required?
- Is the event explicitly free?
- Is family or accessibility information actually listed?
- What still needs verification?
- What is the official source?

## Application shell

### Desktop

- Header with EventMatch NYC branding
- Prominent natural-language search
- Date and location shortcuts
- Main split workspace:
  - Left: scrollable event list
  - Right: interactive map
- Persistent filter summary and data-freshness status

### Mobile

- Compact header
- Full-width search
- Horizontal quick-filter chips
- Date strip: **Today / Tomorrow / This weekend / Next 14 days**
- List-first results
- Sticky **List / Map** toggle
- Bottom navigation:
  - **Discover**
  - **Saved**
  - **Ask**

The map is an alternate view, not a prerequisite for discovering events.

## Core screens

### 1. Discover

The home screen should immediately support intent-based discovery.

#### Main elements

- Search prompt:
  - “What are you looking for?”
  - “Free family events in Queens this Saturday”
- Quick filters:
  - Today
  - This weekend
  - Near me
  - Free
  - Family
  - Nature
  - Fitness
  - Volunteer
- Date strip covering the rolling 14-day source window
- Borough, park, and neighborhood selectors
- Short sections such as:
  - Happening soon
  - Near your selected area
  - This weekend

Location should be optional. Users can browse by borough, neighborhood, or park without granting GPS access.

### 2. Results explorer

Results should be **list-first**, with a map toggle.

#### Event cards

Every card should prioritize:

1. Date and time
2. Event title
3. Park, venue, neighborhood, and borough
4. Category
5. Registration state
6. Cost state
7. Accessibility-information state
8. Save/share actions
9. Official NYC Parks link

Example:

```text
SAT, AUG 22 · 10:00 AM–12:00 PM
Free Garden Workshop

Queens Botanical Garden · Flushing
Nature · Family

Free — stated by NYC Parks
Registration required
Accessibility information not listed

[Save] [Official details]
```

Cards should never silently omit important unknowns.

#### Filters

Common filters should be immediately available:

- Date and time
- Borough, park, or neighborhood
- Category
- Family/age information
- Explicitly free
- Registration state
- Accessibility information listed
- Distance, if the user supplies an origin

Advanced filters should open in a drawer or mobile bottom sheet.

Active filters should appear as removable chips. Natural-language queries should become visible, editable filters.

#### Sort options

Initial options:

- Best match
- Soonest
- Closest
- Recently updated

“Best match” must be explainable rather than opaque.

#### Shareable state

Search, filters, sort order, and view should be represented in the URL so users can:

- Refresh without losing state
- Share a filtered collection
- Use browser back/forward navigation
- Create borough, category, or weekend links

### 3. Map view

The map should answer spatial questions without becoming the product’s authority.

Use the **Google Maps JavaScript API** as the interactive map provider. Read `GOOGLE_MAPS_BROWSER_API_KEY` and `GOOGLE_MAPS_MAP_ID` from environment configuration and map them to the framework’s client-visible convention at build/runtime. The browser key is expected to reach the browser, so it must be limited to the app’s approved HTTP referrers and restricted to the Maps JavaScript API. Use separate keys for local, preview, production, and server-side Google APIs; never commit their values.

#### Location identity

A valid map position contains finite numbers with latitude from `-90` through `90` and longitude from `-180` through `180`, excluding `(0, 0)`. Normalize each valid coordinate to six decimal places; this removes formatting differences without treating nearby positions as identical.

Build the location key from `stable source location ID + normalized latitude + normalized longitude` when the source ID exists, otherwise from `normalized latitude + normalized longitude`. Display names are not identity keys. Different source IDs remain distinct, and conflicting coordinates under one source ID remain distinct unless an explicit canonical-location mapping resolves them. Repeated copies of the same location within one event count once.

#### Marker sizing

For `n >= 1` filtered events at a location, set the visible circular dot diameter to `min(48, 16 + 6 × log2(n))` CSS pixels. This gives one event a 16px dot, grows strictly with each additional event until reaching the 48px maximum, and then remains capped. The interactive target must still be at least 44px. Show the numeric count whenever `n > 1`; size and color are supplemental encodings only.

#### Required behavior

- List and map use the same filters and results
- Selecting a list item highlights its marker
- Selecting a marker highlights and scrolls to its list card
- Render one circular location marker for every distinct valid event location in the filtered result set
- Aggregate events that share a location into one marker; its event count and accessible label must update whenever filters change
- Apply the defined count-to-diameter formula without substituting a different scale
- Show the numeric event count on markers containing multiple events
- Opening a marker shows every filtered event at that location, without silently dropping recurring occurrences
- Keep location aggregation separate from viewport clustering: aggregation combines the same physical location, while optional clustering only reduces overlap among nearby locations at low zoom
- Support an event with multiple valid locations at each location while deduplicating repeated coordinates within the same event
- Keep events without valid coordinates in the accessible list and clearly label them as unavailable on the map; never create a fallback `(0, 0)` marker
- Provide **Search this area** after the user pans
- Preserve list access on mobile and for assistive technology
- Show whether a pin is exact or approximate

Use `AdvancedMarkerElement`, with the accessible custom HTML circle as that advanced marker’s content; never use legacy `google.maps.Marker`. Every marker must expose the location name and event count, be keyboard focusable, and activate with standard Enter/Space behavior. Preserve an equivalent list interaction and the 44px minimum interactive target even when the visual dot is smaller.

The app should not imply walking time, transit time, or exact meeting points unless those facts come from a verified source.

### 4. Event detail

The detail page is the canonical decision and verification screen.

#### Above the fold

- Official event title
- Date and time
- Park/location and borough
- Registration state
- Cost state
- Source freshness
- Primary actions:
  - **Save**
  - **Open official listing**
  - **Get directions**
  - **Share**
  - **Add to calendar**

#### Detail sections

- Official description
- Registration instructions and contact information
- Accessibility information
- Age/family information
- Location details and map preview
- “What is not listed” section
- Source/provenance panel
- “Verify before you go” reminder
- Report incorrect information

Every important field should distinguish among:

- **Stated by NYC Parks**
- **Derived by EventMatch**
- **Not listed**
- **Requires verification**

Examples:

- `Free — explicitly stated by NYC Parks`
- `Registration information not listed`
- `Accessibility details not provided`
- `Location is approximate`

Missing information must not become a negative claim. “Accessibility not listed” is not “not accessible.”

### 5. Ask / AI concierge

The AI should be an interpretation layer over the structured event explorer, not a separate source of truth.

#### Flow

1. User asks:
   > “Find something free for two kids in Queens tomorrow without registration.”

2. The interface shows:
   > “I understood this as…”

   `Tomorrow` · `Queens` · `Family` · `Explicitly free` · `No registration stated`

3. Results appear as normal event cards.
4. Each result can expand:
   > **Why this matches**
5. Users can edit or remove any interpreted constraint.

The AI must:

- Return structured event cards
- Cite the official event record
- Explain matching fields
- Distinguish facts from interpretation
- Preserve unknowns
- Ask clarifying questions when ambiguity affects results
- Never invent capacity, price, accessibility, cancellations, availability, or travel times
- Offer structured search as a fallback if AI is unavailable

### 6. Saved events / My Plans

The initial version should support lightweight local saving without requiring an account.

#### Saved view

- Upcoming saved events
- Chronological sorting
- Expired-event labels
- Changed/stale indicators
- Direct actions for:
  - Registration
  - Directions
  - Calendar
  - Official source
  - Share

A saved event should retain its source timestamp and warn users when the source data may have changed.

A more advanced planning board, household collaboration, participant profiles, and shared task assignments should remain later features.

## Trust and system states

Trust UI is a core feature, not a footer.

### Global freshness banner

Display:

- Last successful sync
- Coverage window: “Upcoming events currently present in NYC Parks’ rolling 14-day feed”
- Whether results are current, stale, cached, or unavailable

Examples:

- `Official data updated 18 minutes ago`
- `Data may be stale — last successful sync was yesterday`
- `NYC Parks feed unavailable — showing cached results from Aug 8`

### Required states

- Initial loading with skeleton cards
- Empty results with specific recovery actions
- Stale data
- API outage with cached results
- No source data
- Expired event
- Changed event
- Officially cancelled event
- Event absent from the latest feed

An event disappearing from the rolling feed must **not** automatically be labeled cancelled.

## Accessibility baseline

The product should be usable without the map, location permission, or an account.

Initial requirements:

- Semantic HTML and landmarks
- Keyboard navigation
- Visible focus states
- Screen-reader announcements for result changes
- 44px minimum touch targets
- Strong contrast
- No color-only status indicators
- Reduced-motion support
- Accessible filter drawers and dialogs
- List equivalent for every map interaction
- Readable timestamps and status labels
- Responsive behavior under zoom and text enlargement

Accessibility information in the source should use conservative states:

- Accessibility information provided
- Accessibility information not listed
- Details require verification

## Visual direction

The consensus design direction was:

> **A calm civic utility with the warmth of a neighborhood guide.**

Use:

- Clear date/time hierarchy
- Warm neutral surfaces
- Park-inspired greens used selectively
- Strong text labels over decorative badges
- Minimal shadows and promotional styling
- Consistent cards and status treatments
- No “trending,” popularity, or attendance claims in the MVP

## Initial MVP scope

### Include

1. Discover/search screen
2. List-first results
3. Date, borough, category, registration, explicit-free, and accessibility-information filters
4. Google Maps JavaScript API map/list toggle with per-location, count-scaled event markers
5. Event detail pages
6. Official links and source freshness
7. Explicit unknown/stale/outage states
8. Grounded AI search with visible interpreted filters
9. Local saved events
10. Shareable filtered URLs and event links
11. Directions and calendar handoffs
12. Accessible responsive UI

### Defer

- Required accounts or cross-device sync
- Push notifications and complex alert rules
- Household collaboration
- Full itinerary optimization
- Transit and weather intelligence
- Reviews, attendance signals, and community content
- Automated Instagram publishing
- Advanced park-facility layers
- Rich social/admin tooling

## Consensus summary

The initial frontend should be:

> **A mobile-first, list-first NYC Parks event explorer with optional map discovery, grounded natural-language search, transparent source/freshness treatment, explicit unknown states, official-detail handoffs, and lightweight saving/sharing.**

This is the common foundation across the independent ideation. Specialized additions—household profiles, social automation, itinerary planning, and community features—should be evaluated after this foundation is working.
