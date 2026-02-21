import { NextResponse } from "next/server";
import { validateCampfirePath } from "@/lib/commons/routing";

const MUTATION_ERROR_STATUS: Record<string, number> = {
  "Campfire not found.": 404,
  "Only the host can delete this campfire.": 403,
  "Only members can leave a campfire.": 403,
  "Hosts cannot leave their own campfire. Transfer host access first.": 409,
};

type MutationResult =
  | { ok: true }
  | {
      ok: false;
      error: keyof typeof MUTATION_ERROR_STATUS;
    };

type CampfireMutationDeps = {
  auth: () => Promise<{ user?: { id?: string | null } } | null>;
};

type DeleteDeps = CampfireMutationDeps & {
  softDeleteCampfireAsHost: (options: {
    campfirePath: string;
    actorId: string;
  }) => Promise<MutationResult>;
};

type LeaveDeps = CampfireMutationDeps & {
  leaveCampfireAsMember: (options: {
    campfirePath: string;
    actorId: string;
  }) => Promise<MutationResult>;
};

function resolveCampfirePath(campfire: string[] | undefined): string | null {
  const validation = validateCampfirePath(campfire ?? []);
  return validation.isValid ? validation.campfirePath : null;
}

export function createDeleteCampfireHandler(deps: DeleteDeps) {
  return async (
    _request: Request,
    context: { params: Promise<{ campfire: string[] }> }
  ) => {
    const session = await deps.auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { campfire } = await context.params;
    const campfirePath = resolveCampfirePath(campfire);

    if (!campfirePath) {
      return NextResponse.json({ error: "Invalid campfire path." }, { status: 400 });
    }

    const result = await deps.softDeleteCampfireAsHost({
      campfirePath,
      actorId: session.user.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: MUTATION_ERROR_STATUS[result.error] }
      );
    }

    return NextResponse.json({ ok: true });
  };
}

export function createLeaveCampfireHandler(deps: LeaveDeps) {
  return async (
    _request: Request,
    context: { params: Promise<{ campfire: string[] }> }
  ) => {
    const session = await deps.auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { campfire } = await context.params;
    const campfirePath = resolveCampfirePath(campfire);

    if (!campfirePath) {
      return NextResponse.json({ error: "Invalid campfire path." }, { status: 400 });
    }

    const result = await deps.leaveCampfireAsMember({
      campfirePath,
      actorId: session.user.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: MUTATION_ERROR_STATUS[result.error] }
      );
    }

    return NextResponse.json({ ok: true });
  };
}
