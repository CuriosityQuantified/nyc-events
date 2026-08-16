import type { ParkEvent } from "./events";

/**
 * Calendar handoffs for Saved Events (#46). Exports use only stored Event
 * facts; a missing time or duration is never invented — an Event without a
 * usable date is simply not exportable.
 */

const NY_TIME_ZONE = "America/New_York";
const GOOGLE_RENDER_URL = "https://calendar.google.com/calendar/render";

type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const wallTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: NY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function newYorkWallTime(iso: string): WallTime | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;
  const parts: Record<string, string> = {};
  for (const part of wallTimeFormat.formatToParts(instant)) {
    parts[part.type] = part.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

const pad = (value: number, width = 2) => String(value).padStart(width, "0");

function basicDateTime(wall: WallTime): string {
  return (
    `${pad(wall.year, 4)}${pad(wall.month)}${pad(wall.day)}` +
    `T${pad(wall.hour)}${pad(wall.minute)}${pad(wall.second)}`
  );
}

function basicDate(dateOnly: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  return match ? `${match[1]}${match[2]}${match[3]}` : null;
}

function nextDay(dateOnly: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;
  const next = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1),
  );
  return `${pad(next.getUTCFullYear(), 4)}-${pad(next.getUTCMonth() + 1)}-${pad(
    next.getUTCDate(),
  )}`;
}

export type EventSchedule =
  | { kind: "timed"; start: WallTime; end: WallTime | null }
  | { kind: "all-day"; startDate: string; endDateExclusive: string };

/** Resolve an Event's stored facts into an exportable schedule, or null. */
export function eventSchedule(event: ParkEvent): EventSchedule | null {
  if (event.startDateTime) {
    const start = newYorkWallTime(event.startDateTime);
    if (start) {
      let end: WallTime | null = null;
      if (
        event.endDateTime &&
        new Date(event.endDateTime).getTime() >=
          new Date(event.startDateTime).getTime()
      ) {
        end = newYorkWallTime(event.endDateTime);
      }
      return { kind: "timed", start, end };
    }
  }
  if (event.startDate && basicDate(event.startDate)) {
    const lastDay =
      event.endDate &&
      basicDate(event.endDate) &&
      event.endDate >= event.startDate
        ? event.endDate
        : event.startDate;
    const endDateExclusive = nextDay(lastDay);
    if (endDateExclusive) {
      return { kind: "all-day", startDate: event.startDate, endDateExclusive };
    }
  }
  return null;
}

/**
 * Strip control characters (including CR/LF) from untrusted source text so it
 * cannot inject extra calendar properties or URL structure.
 */
function exportText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
  return cleaned || null;
}

function exportLocation(event: ParkEvent): string | null {
  const location = exportText(event.location);
  if (!location || location === "Location not listed") return null;
  const borough = exportText(event.borough);
  return borough && borough !== "Borough not listed"
    ? `${location}, ${borough}, New York`
    : `${location}, New York`;
}

function descriptionParts(event: ParkEvent): string[] {
  const parts: string[] = [];
  const description = exportText(event.description);
  if (description) parts.push(description);
  if (event.officialUrl) parts.push(`Official listing: ${event.officialUrl}`);
  parts.push(`Source: NYC Parks event ${exportText(event.guid) ?? ""}`.trim());
  parts.push(
    "Imported calendar entries do not update automatically if this event changes in EventMatch.",
  );
  return parts;
}

/** Google Calendar template handoff URL, or null when no date is stored. */
export function googleCalendarUrl(event: ParkEvent): string | null {
  const schedule = eventSchedule(event);
  if (!schedule) return null;
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", exportText(event.title) ?? "Untitled event");
  if (schedule.kind === "timed") {
    const end = schedule.end ?? schedule.start;
    params.set(
      "dates",
      `${basicDateTime(schedule.start)}/${basicDateTime(end)}`,
    );
    params.set("ctz", NY_TIME_ZONE);
  } else {
    const start = basicDate(schedule.startDate);
    const end = basicDate(schedule.endDateExclusive);
    if (!start || !end) return null;
    params.set("dates", `${start}/${end}`);
  }
  const location = exportLocation(event);
  if (location) params.set("location", location);
  params.set("details", descriptionParts(event).join("\n\n"));
  return `${GOOGLE_RENDER_URL}?${params.toString()}`;
}

function safeGuid(guid: string): string {
  return guid.replace(/[^A-Za-z0-9._-]/g, "-");
}

/** Deterministic stable UID derived from the Event source guid. */
export function icsUid(event: ParkEvent): string {
  return `eventmatch-${safeGuid(event.guid)}@eventmatch.nyc`;
}

export function icsFilename(event: ParkEvent): string {
  return `eventmatch-${safeGuid(event.guid)}.ics`;
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** Fold a content line at 74 UTF-16 units without splitting surrogate pairs. */
function foldLine(line: string): string {
  const folded: string[] = [];
  let rest = line;
  let width = 74;
  while (rest.length > width) {
    let cut = width;
    const edge = rest.charCodeAt(cut - 1);
    if (edge >= 0xd800 && edge <= 0xdbff) cut -= 1;
    folded.push((folded.length === 0 ? "" : " ") + rest.slice(0, cut));
    rest = rest.slice(cut);
    width = 73;
  }
  folded.push((folded.length === 0 ? "" : " ") + rest);
  return folded.join("\r\n");
}

const NY_VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:America/New_York",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:20070311T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:20071104T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function utcBasic(now: Date): string {
  return (
    `${pad(now.getUTCFullYear(), 4)}${pad(now.getUTCMonth() + 1)}` +
    `${pad(now.getUTCDate())}T${pad(now.getUTCHours())}` +
    `${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

/** RFC 5545 VEVENT for Apple Calendar, or null when no date is stored. */
export function buildIcs(event: ParkEvent, now = new Date()): string | null {
  const schedule = eventSchedule(event);
  if (!schedule) return null;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventMatch NYC//Saved Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (schedule.kind === "timed") lines.push(...NY_VTIMEZONE);
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${icsUid(event)}`);
  lines.push(`DTSTAMP:${utcBasic(now)}`);
  if (schedule.kind === "timed") {
    lines.push(`DTSTART;TZID=${NY_TIME_ZONE}:${basicDateTime(schedule.start)}`);
    if (schedule.end) {
      lines.push(`DTEND;TZID=${NY_TIME_ZONE}:${basicDateTime(schedule.end)}`);
    }
  } else {
    const start = basicDate(schedule.startDate);
    const end = basicDate(schedule.endDateExclusive);
    if (!start || !end) return null;
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
  }
  lines.push(
    `SUMMARY:${escapeIcsText(exportText(event.title) ?? "Untitled event")}`,
  );
  const location = exportLocation(event);
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  lines.push(
    `DESCRIPTION:${descriptionParts(event).map(escapeIcsText).join("\\n\\n")}`,
  );
  if (event.officialUrl) lines.push(`URL:${event.officialUrl}`);
  if (event.lifecycleStatus === "cancelled") lines.push("STATUS:CANCELLED");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
