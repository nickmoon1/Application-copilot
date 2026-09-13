"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button className="account-sign-out" onClick={() => signOut({ callbackUrl: "/sign-in" })} type="button">
      Sign out
    </button>
  );
}
