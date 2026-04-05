"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "@/lib/firebase";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else if (pathname === "/") {

        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);
  return null;
}
