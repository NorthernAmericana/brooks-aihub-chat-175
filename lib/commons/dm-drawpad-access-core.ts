export type CommonsDmAccessResult =
  | { ok: true; campfireId: string; campfirePath: string }
  | { ok: false; status: 403 | 404; error: string };

export type ResolveCommonsDmDeps = {
  findCampfireByPath: (campfirePath: string) => Promise<{ id: string; isActive: boolean; isDeleted: boolean } | null>;
  getAccess: (options: { campfirePath: string; viewerId: string }) => Promise<{ canWrite: boolean }>;
  hasMembership: (options: { campfireId: string; userId: string }) => Promise<boolean>;
};

export async function resolveCommonsDmDrawpadAccessWithDeps(
  options: {
    dmId: string;
    userId: string;
  },
  deps: ResolveCommonsDmDeps
): Promise<CommonsDmAccessResult> {
  const campfirePath = `dm/${options.dmId}`;

  const campfire = await deps.findCampfireByPath(campfirePath);
  if (!campfire || campfire.isDeleted || !campfire.isActive) {
    return { ok: false, status: 404, error: "DM campfire not found." };
  }

  const access = await deps.getAccess({
    campfirePath,
    viewerId: options.userId,
  });

  if (!access.canWrite) {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  const isMember = await deps.hasMembership({
    campfireId: campfire.id,
    userId: options.userId,
  });

  if (!isMember) {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  return { ok: true, campfireId: campfire.id, campfirePath };
}
