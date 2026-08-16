const NYC_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Generate ISO date strings for the next N New York calendar days. */
export function getUpcomingDates(count: number): string[] {
  const parts = Object.fromEntries(
    NYC_DATE_FORMATTER.formatToParts(new Date()).map(({ type, value }) => [
      type,
      value,
    ]),
  );
  const start = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  );

  return Array.from({ length: count }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10),
  );
}
