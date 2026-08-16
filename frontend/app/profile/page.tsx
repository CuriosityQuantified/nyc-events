import type { Metadata } from "next";
import ProfileView from "@/app/components/ProfileView";

export const metadata: Metadata = {
  title: "Profile · EventMatch NYC",
  description:
    "Your anonymous EventMatch profile: the Interests you follow and how Matches reach you.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
