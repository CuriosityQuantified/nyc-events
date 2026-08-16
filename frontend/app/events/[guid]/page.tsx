import { Suspense } from "react";
import EventDetail from "@/app/components/EventDetail";
import {
  parseFilterSearchParams,
  writeFilterSearchParams,
} from "@/app/data/filters";

async function EventDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ guid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ guid }, values] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const returnQuery = writeFilterSearchParams(
    new URLSearchParams(),
    parseFilterSearchParams(query),
  ).toString();
  const returnHref = `/${returnQuery ? `?${returnQuery}` : ""}#main-content`;

  return <EventDetail guid={guid} returnHref={returnHref} />;
}

type EventDetailPageProps = {
  params: Promise<{ guid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function EventDetailPage({
  params,
  searchParams,
}: EventDetailPageProps) {
  return (
    <Suspense
      fallback={
        <main aria-busy="true">
          <p role="status">Loading event details…</p>
        </main>
      }
    >
      <EventDetailRoute params={params} searchParams={searchParams} />
    </Suspense>
  );
}
