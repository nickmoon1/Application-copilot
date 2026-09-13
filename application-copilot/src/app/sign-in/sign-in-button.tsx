"use client";

import { signIn } from "next-auth/react";

export default function SignInButton({ callbackUrl, disabled }: { callbackUrl: string; disabled: boolean }) {
  return (
    <button
      className="primary auth-button"
      disabled={disabled}
      onClick={() => signIn("github", { callbackUrl })}
      type="button"
    >
      Sign in with GitHub
    </button>
  );
}
