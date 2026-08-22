import { AccountSignInScreen } from "@/app/components/auth-client";
import { clerkConfiguration } from "@/app/data/clerk";
import { connection } from "next/server";

export default async function SignInPage() {
  await connection();
  const clerk = clerkConfiguration();
  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {clerk.status === "configured" ? (
        <AccountSignInScreen />
      ) : (
        <p role="status">Account sign-in is unavailable.</p>
      )}
    </main>
  );
}
