import { Suspense } from "react";
import TrailersClient from "./trailers-client";

export default function NamcLibraryTrailersPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <TrailersClient />
    </Suspense>
  );
}
