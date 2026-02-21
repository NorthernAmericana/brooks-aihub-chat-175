import { auth } from "@/app/(auth)/auth";
import { leaveCampfireAsMember } from "@/lib/db/commons-queries";
import { createLeaveCampfireHandler } from "@/lib/routes/commonsCampfireMutationHandlers";

export const dynamic = "force-dynamic";

export const POST = createLeaveCampfireHandler({
  auth,
  leaveCampfireAsMember,
});
