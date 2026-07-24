"use client";

import { useAuth } from "@/utils/userContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!currentUser && pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [currentUser, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4EB] dark:bg-[#1A1A18]">
        <p className="font-[family-name:var(--font-cormorant)] text-2xl italic text-black/50 dark:text-white/50 animate-pulse tracking-wider">
          Accessing your wardrobe...
        </p>
      </div>
    );
  }

  if (!currentUser && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
