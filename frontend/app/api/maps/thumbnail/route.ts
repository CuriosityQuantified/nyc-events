import { EventsApiError, getEvent } from "@/app/data/events";
import { validCoordinates } from "@/app/data/maps";

export const dynamic = "force-dynamic";

const VARIANTS = {
  compact: { size: "640x360", zoom: "14", scale: "2" },
  detail: { size: "640x400", zoom: "15", scale: "2" },
} as const;

const ALLOWED_PARAMS = new Set(["guid", "variant", "location"]);
const GUID_PATTERN = /^[A-Za-z0-9,._-]{1,256}$/;

function errorResponse(status: number, message: string): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].some((key) => !ALLOWED_PARAMS.has(key))) {
    return errorResponse(400, "Unsupported thumbnail parameter");
  }

  const guid = url.searchParams.get("guid") ?? "";
  const variantName = url.searchParams.get("variant") ?? "";
  const locationValue = url.searchParams.get("location") ?? "0";
  if (!GUID_PATTERN.test(guid)) {
    return errorResponse(400, "Invalid event guid");
  }
  if (!(variantName in VARIANTS)) {
    return errorResponse(400, "Unsupported thumbnail variant");
  }
  if (!/^\d$/.test(locationValue)) {
    return errorResponse(400, "Invalid location index");
  }

  const apiKey = process.env.GOOGLE_MAPS_STATIC_API_KEY;
  if (!apiKey) return errorResponse(503, "Map image is unavailable");

  try {
    const event = await getEvent(guid);
    const coordinates = validCoordinates(event.coordinates.value ?? []);
    const coordinate = coordinates[Number(locationValue)];
    if (!coordinate) {
      return errorResponse(404, "Map location is unavailable");
    }

    const variant = VARIANTS[variantName as keyof typeof VARIANTS];
    const center = `${coordinate.latitude.toFixed(6)},${coordinate.longitude.toFixed(6)}`;
    const upstream = new URL("https://maps.googleapis.com/maps/api/staticmap");
    upstream.search = new URLSearchParams({
      center,
      zoom: variant.zoom,
      size: variant.size,
      scale: variant.scale,
      maptype: "roadmap",
      markers: `color:0x16825d|${center}`,
      key: apiKey,
    }).toString();

    const response = await fetch(upstream, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(6_000),
    });
    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (
      !response.ok ||
      (contentType !== "image/png" && contentType !== "image/jpeg")
    ) {
      return errorResponse(502, "Map image is unavailable");
    }

    return new Response(await response.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof EventsApiError && error.status === 404) {
      return errorResponse(404, "Event not found");
    }
    return errorResponse(502, "Map image is unavailable");
  }
}
