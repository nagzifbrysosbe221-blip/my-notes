// src/app/sign-in/page.tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <input
          className="w-full rounded-md border p-2"
          placeholder="dev@local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="w-full rounded-md border p-2"
          onClick={() => signIn("credentials", { email, callbackUrl: "/" })}
        >
          Continue
        </button>
      </div>
    </main>
  );
}

