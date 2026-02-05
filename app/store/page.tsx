import { auth } from "@/app/(auth)/auth";
import { listAppsWithInstallState } from "@/lib/store/listAppsWithInstallState";
import { StoreClient } from "@/app/store/store-client";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const session = await auth();
  const apps = await listAppsWithInstallState(session?.user?.id ?? null);

  return <StoreClient apps={apps} hasSession={Boolean(session?.user?.id)} />;
}
