import assert from "node:assert/strict";
import { test } from "node:test";
import { createAtoByIdHandlers, createAtoHandlers } from "@/lib/routes/atoApiHandlers";

type AtoRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  route: string;
  createdAt: Date;
};

function createStatefulDeps() {
  const ownerUserId = "user-1";
  const store = new Map<string, AtoRecord>();
  let sequence = 0;
  const installRecordCalls: string[] = [];

  const create = createAtoHandlers({
    auth: async () => ({ user: { id: ownerUserId } }),
    createUnofficialAto: async ({ ownerUserId, name, route }) => {
      const id = `ato-${++sequence}`;
      const record: AtoRecord = {
        id,
        ownerUserId,
        name,
        route: route ?? name,
        createdAt: new Date(),
      };
      store.set(id, record);
      return {
        ...record,
        description: null,
        personalityName: null,
        instructions: null,
        intelligenceMode: "ATO-Limited",
        defaultVoiceId: null,
        defaultVoiceLabel: null,
        webSearchEnabled: false,
        fileSearchEnabled: false,
        fileUsageEnabled: false,
        fileStoragePath: null,
        updatedAt: record.createdAt,
        planMetadata: null,
      };
    },
    createUnofficialAtoInstallRecords: async ({ atoId }) => {
      installRecordCalls.push(atoId);
      return {
        id: `app-${atoId}`,
        slug: `custom-ato-${atoId}`,
        name: "Test",
        description: null,
        iconUrl: null,
        category: "Custom ATO",
        storePath: "/store/ato",
        appPath: "/custom/test/",
        isOfficial: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    getUnofficialAtoCountByOwner: async ({ ownerUserId }) =>
      Array.from(store.values()).filter((entry) => entry.ownerUserId === ownerUserId)
        .length,
    getUnofficialAtoByRoute: async ({ ownerUserId, route }) =>
      Array.from(store.values()).find(
        (entry) => entry.ownerUserId === ownerUserId && entry.route === route
      ) ?? null,
    getUnofficialAtosByOwner: async ({ ownerUserId }) =>
      Array.from(store.values()).filter((entry) => entry.ownerUserId === ownerUserId) as never,
    getUserById: async () => ({
      id: ownerUserId,
      email: "test@example.com",
      password: "pw",
      createdAt: new Date(),
      foundersAccess: false,
      premiumUntil: null,
      stripeCustomerId: null,
      subscriptionStatus: null,
      stripeSubscriptionId: null,
    }),
    listRouteRegistryEntries: async () => [],
  });

  const byId = createAtoByIdHandlers({
    auth: async () => ({ user: { id: ownerUserId } }),
    deleteUnofficialAto: async ({ id, ownerUserId }) => {
      const record = store.get(id);
      if (!record || record.ownerUserId !== ownerUserId) {
        return null;
      }
      store.delete(id);
      return record as never;
    },
    getUnofficialAtoByRoute: async ({ ownerUserId, route }) =>
      Array.from(store.values()).find(
        (entry) => entry.ownerUserId === ownerUserId && entry.route === route
      ) ?? null,
    getUnofficialAtoById: async ({ id, ownerUserId }) => {
      const record = store.get(id);
      return record && record.ownerUserId === ownerUserId ? (record as never) : null;
    },
    getUserById: async () => null,
    listRouteRegistryEntries: async () => [],
    updateUnofficialAtoSettings: async () => null,
  });

  return { create, byId, installRecordCalls };
}

test("POST /api/ato -> GET /api/ato/[id] -> DELETE -> recreate keeps id source in UnofficialAto", async () => {
  const { create, byId, installRecordCalls } = createStatefulDeps();

  const firstCreate = await create.POST(
    new Request("http://localhost/api/ato", {
      method: "POST",
      body: JSON.stringify({ name: "Support Bot", route: "support" }),
      headers: { "content-type": "application/json" },
    })
  );

  assert.equal(firstCreate.status, 201);
  const firstPayload = await firstCreate.json();
  assert.equal(firstPayload.ato.id, "ato-1");
  assert.equal(firstPayload.ato.route, "support");

  const fetched = await byId.GET(new Request("http://localhost") as never, {
    params: Promise.resolve({ id: firstPayload.ato.id }),
  });
  assert.equal(fetched.status, 200);
  const fetchedPayload = await fetched.json();
  assert.equal(fetchedPayload.ato.id, firstPayload.ato.id);

  const deleted = await byId.DELETE(new Request("http://localhost") as never, {
    params: Promise.resolve({ id: firstPayload.ato.id }),
  });
  assert.equal(deleted.status, 200);

  const secondCreate = await create.POST(
    new Request("http://localhost/api/ato", {
      method: "POST",
      body: JSON.stringify({ name: "Support Bot", route: "support" }),
      headers: { "content-type": "application/json" },
    })
  );

  assert.equal(secondCreate.status, 201);
  const secondPayload = await secondCreate.json();
  assert.equal(secondPayload.ato.id, "ato-2");
  assert.notEqual(secondPayload.ato.id, firstPayload.ato.id);
  assert.deepEqual(installRecordCalls, ["ato-1", "ato-2"]);
});
