"use client";

import { useEffect } from "react";
import { bootstrapAccessToken } from "@/lib/authSession";

/** Bootstraps JWT from parent-domain httpOnly cookie into sessionStorage for API calls. */
export function AuthBootstrap() {
  useEffect(() => {
    void bootstrapAccessToken();
  }, []);

  return null;
}
