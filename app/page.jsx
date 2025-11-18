"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, []);

  return <p className="p-6">Redirecting…</p>;
}