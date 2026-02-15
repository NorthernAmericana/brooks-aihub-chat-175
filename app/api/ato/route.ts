import { auth } from "@/app/(auth)/auth";
import {
  createUnofficialAto,
  createUnofficialAtoInstallRecords,
  getUnofficialAtoCountByOwner,
  getUnofficialAtoByRoute,
  getUnofficialAtosByOwner,
  getUserById,
  listRouteRegistryEntries,
} from "@/lib/db/queries";
import { createAtoHandlers } from "@/lib/routes/atoApiHandlers";

export const dynamic = "force-dynamic";

const handlers = createAtoHandlers({
  auth,
  createUnofficialAto,
  createUnofficialAtoInstallRecords,
  getUnofficialAtoCountByOwner,
  getUnofficialAtoByRoute,
  getUnofficialAtosByOwner,
  getUserById,
  listRouteRegistryEntries,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
