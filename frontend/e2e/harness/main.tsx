import { createRoot } from "react-dom/client";
import AccountPanel from "@/app/components/AccountPanel";
import ProfileView from "@/app/components/ProfileView";
import SavedProvider, { useSaved } from "@/app/components/SavedProvider";
import { FixtureAuthProvider, fixtureAuthClient } from "../auth-client.fixture";
import "@/app/globals.css";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
if (!LOOPBACK_HOSTS.has(window.location.hostname)) {
  throw new Error("The configured-auth component harness is loopback-only");
}

function SavedProbe() {
  const saved = useSaved();
  return (
    <output data-testid="harness-saved-state" data-status={saved?.status}>
      {saved?.events.map((event) => event.title).join(", ") ||
        "No saved events"}
    </output>
  );
}

function Harness() {
  return (
    <FixtureAuthProvider>
      <SavedProvider>
        <SavedProbe />
        <ProfileView
          account={<AccountPanel authClient={fixtureAuthClient} />}
        />
      </SavedProvider>
    </FixtureAuthProvider>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Harness root is missing");
createRoot(root).render(<Harness />);
