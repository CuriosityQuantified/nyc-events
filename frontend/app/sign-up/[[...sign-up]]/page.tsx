import { AccountSignUpScreen } from "@/app/components/auth-client";
import { clerkConfiguration } from "@/app/data/clerk";
import { connection } from "next/server";

export default async function SignUpPage() {
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
        <AccountSignUpScreen />
      ) : (
        <p role="status">Account sign-up is unavailable.</p>
      )}
    </main>
  );
}
