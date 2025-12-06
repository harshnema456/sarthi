"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(params.get("user"));
    localStorage.setItem("user", JSON.stringify(user));
    router.push(`/InhubDashboard/${user.id}`);
  }, []);

  return <p>Processing GitHub login...</p>;
}
