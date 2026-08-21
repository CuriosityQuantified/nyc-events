import { Suspense } from "react";
import type { Metadata } from "next";
import SavedView from "@/app/components/SavedView";

export const metadata: Metadata = {
  title: "Saved · EventMatch NYC",
  description:
    "Your saved NYC Parks events, as a list or a month calendar, with export to Google and Apple Calendar.",
};

export default function SavedPage() {
  return (
    <Suspense fallback={null}>
      <SavedView />
    </Suspense>
  );
}
