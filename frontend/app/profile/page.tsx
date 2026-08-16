import type { Metadata } from "next";
import AccountPanel from "@/app/components/AccountPanel";
import ProfileView from "@/app/components/ProfileView";
import { clerkPublishableKey } from "@/app/data/clerk";

export const metadata: Metadata = {
  title: "Profile · EventMatch NYC",
  description:
    "Your anonymous EventMatch profile: the Interests you follow and how Matches reach you.",
};

export default function ProfilePage() {
  return (
    <ProfileView account={clerkPublishableKey() ? <AccountPanel /> : null} />
  );
}
