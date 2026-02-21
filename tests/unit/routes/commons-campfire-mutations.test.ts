import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDeleteCampfireHandler,
  createLeaveCampfireHandler,
} from "@/lib/routes/commonsCampfireMutationHandlers";

test("host can delete campfire", async () => {
  const DELETE = createDeleteCampfireHandler({
    auth: async () => ({ user: { id: "host-1" } }),
    softDeleteCampfireAsHost: async () => ({ ok: true }),
  });

  const response = await DELETE(new Request("http://localhost"), {
    params: Promise.resolve({ campfire: ["dm", "room-1"] }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test("member cannot delete campfire", async () => {
  const DELETE = createDeleteCampfireHandler({
    auth: async () => ({ user: { id: "member-1" } }),
    softDeleteCampfireAsHost: async () => ({
      ok: false,
      error: "Only the host can delete this campfire.",
    }),
  });

  const response = await DELETE(new Request("http://localhost"), {
    params: Promise.resolve({ campfire: ["dm", "room-1"] }),
  });

  assert.equal(response.status, 403);
});

test("member can leave campfire", async () => {
  const POST = createLeaveCampfireHandler({
    auth: async () => ({ user: { id: "member-1" } }),
    leaveCampfireAsMember: async () => ({ ok: true }),
  });

  const response = await POST(new Request("http://localhost"), {
    params: Promise.resolve({ campfire: ["dm", "room-1"] }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test("non-member cannot mutate campfire", async () => {
  const DELETE = createDeleteCampfireHandler({
    auth: async () => ({ user: { id: "outsider-1" } }),
    softDeleteCampfireAsHost: async () => ({
      ok: false,
      error: "Only the host can delete this campfire.",
    }),
  });
  const POST = createLeaveCampfireHandler({
    auth: async () => ({ user: { id: "outsider-1" } }),
    leaveCampfireAsMember: async () => ({
      ok: false,
      error: "Only members can leave a campfire.",
    }),
  });

  const deleteResponse = await DELETE(new Request("http://localhost"), {
    params: Promise.resolve({ campfire: ["dm", "room-1"] }),
  });
  const leaveResponse = await POST(new Request("http://localhost"), {
    params: Promise.resolve({ campfire: ["dm", "room-1"] }),
  });

  assert.equal(deleteResponse.status, 403);
  assert.equal(leaveResponse.status, 403);
});
