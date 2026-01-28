"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BenjaminBearRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/BrooksBears/");
  }, [router]);

  return <div className="flex h-dvh w-full" />;
}

