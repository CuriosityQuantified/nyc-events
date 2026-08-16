import type { Metadata } from "next";
import AuthProvider from "@/app/components/AuthProvider";
import SavedProvider from "@/app/components/SavedProvider";
import { clerkPublishableKey } from "@/app/data/clerk";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://eventmatch.nyc"),
  title: "EventMatch NYC",
  description:
    "Discover parks, events, and outdoor activities across all five boroughs of New York City.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <AuthProvider publishableKey={clerkPublishableKey()}>
          <SavedProvider>{children}</SavedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
