import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveCommonsDmDrawpadAccessWithDeps } from "@/lib/commons/dm-drawpad-access-core";

test("resolveCommonsDmDrawpadAccessWithDeps allows commons DM members", async () => {
  const result = await resolveCommonsDmDrawpadAccessWithDeps(
    { dmId: "abc123", userId: "user-1" },
    {
      findCampfireByPath: async (campfirePath) => {
        assert.equal(campfirePath, "dm/abc123");
        return { id: "camp-1", isActive: true, isDeleted: false };
      },
      getAccess: async () => ({ canWrite: true }),
      hasMembership: async () => true,
    }
  );

  assert.deepEqual(result, {
    ok: true,
    campfireId: "camp-1",
    campfirePath: "dm/abc123",
  });
});

test("resolveCommonsDmDrawpadAccessWithDeps returns 404 when commons DM campfire does not exist", async () => {
  const result = await resolveCommonsDmDrawpadAccessWithDeps(
    { dmId: "missing", userId: "user-1" },
    {
      findCampfireByPath: async () => null,
      getAccess: async () => ({ canWrite: true }),
      hasMembership: async () => true,
    }
  );

  assert.deepEqual(result, {
    ok: false,
    status: 404,
    error: "DM campfire not found.",
  });
});

test("resolveCommonsDmDrawpadAccessWithDeps returns 403 when user lacks write access", async () => {
  const result = await resolveCommonsDmDrawpadAccessWithDeps(
    { dmId: "abc123", userId: "user-2" },
    {
      findCampfireByPath: async () => ({ id: "camp-1", isActive: true, isDeleted: false }),
      getAccess: async () => ({ canWrite: false }),
      hasMembership: async () => false,
    }
  );

  assert.deepEqual(result, {
    ok: false,
    status: 403,
    error: "Forbidden.",
  });
});

test("resolveCommonsDmDrawpadAccessWithDeps returns 403 when user is not a campfire member", async () => {
  const result = await resolveCommonsDmDrawpadAccessWithDeps(
    { dmId: "abc123", userId: "user-3" },
    {
      findCampfireByPath: async () => ({ id: "camp-1", isActive: true, isDeleted: false }),
      getAccess: async () => ({ canWrite: true }),
      hasMembership: async () => false,
    }
  );

  assert.deepEqual(result, {
    ok: false,
    status: 403,
    error: "Forbidden.",
  });
});
