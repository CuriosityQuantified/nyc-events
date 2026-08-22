import type { Metadata } from "next";
import { connection } from "next/server";
import AuthProvider from "@/app/components/AuthProvider";
import SavedProvider from "@/app/components/SavedProvider";
import { clerkConfiguration } from "@/app/data/clerk";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://eventmatch.nyc"),
  title: "EventMatch NYC",
  description:
    "Discover parks, events, and outdoor activities across all five boroughs of New York City.",
  alternates: { canonical: "/" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  const clerk = clerkConfiguration();
  return (
    <html lang="en">
      <body>
        <AuthProvider
          publishableKey={
            clerk.status === "configured" ? clerk.publishableKey : undefined
          }
        >
          <SavedProvider>{children}</SavedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
