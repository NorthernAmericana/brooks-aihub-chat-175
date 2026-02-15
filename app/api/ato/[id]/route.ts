import { auth } from "@/app/(auth)/auth";
import {
  deleteUnofficialAto,
  getUnofficialAtoByRouteGlobal,
  getUnofficialAtoById,
  getUserById,
  listRouteRegistryEntries,
  updateUnofficialAtoSettings,
} from "@/lib/db/queries";
import { createAtoByIdHandlers } from "@/lib/routes/atoApiHandlers";

export const dynamic = "force-dynamic";

const handlers = createAtoByIdHandlers({
  auth,
  deleteUnofficialAto,
  getUnofficialAtoByRouteGlobal,
  getUnofficialAtoById,
  getUserById,
  listRouteRegistryEntries,
  updateUnofficialAtoSettings,
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
