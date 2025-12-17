"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AuthCallback() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const convex = useConvex();

  useEffect(() => {
    if (!isLoaded || !user) return;

    (async () => {
      const userId = await convex.mutation(api.users.CreateUser, {
        name: user.fullName ?? user.username ?? "User",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        picture: user.imageUrl,
        uid: user.id,
      });

      await convex.mutation(api.workspace.CreateWorkspace, {
        user: userId,
      });

      //  CORRECT PLACE FOR REDIRECT
      router.replace("/login/Create");
    })();
  }, [isLoaded, user]);

  return null;
}
