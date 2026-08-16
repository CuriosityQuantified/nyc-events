import type { Metadata } from "next";
import ConciergeView from "@/app/components/ConciergeView";

export const metadata: Metadata = {
  title: "Concierge · EventMatch NYC",
  description:
    "Ask EventMatch NYC for grounded recommendations from the latest NYC Parks events data.",
};

export default function ConciergePage() {
  return <ConciergeView />;
}
