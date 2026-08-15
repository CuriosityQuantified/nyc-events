import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParkMatch NYC",
  description:
    "Discover parks, events, and outdoor activities across all five boroughs of New York City.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
