import { auth } from "@/app/(auth)/auth";
import { softDeleteCampfireAsHost } from "@/lib/db/commons-queries";
import { createDeleteCampfireHandler } from "@/lib/routes/commonsCampfireMutationHandlers";

export const dynamic = "force-dynamic";

export const DELETE = createDeleteCampfireHandler({
  auth,
  softDeleteCampfireAsHost,
});
