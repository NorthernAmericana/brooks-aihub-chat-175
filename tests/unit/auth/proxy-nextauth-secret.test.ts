import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";

async function run() {
  process.env.NODE_ENV = "development";
  process.env.NEXTAUTH_SECRET = "nextauth-only-secret";
  delete process.env.AUTH_SECRET;

  const { proxy } = await import("@/proxy");

  const token = await encode({
    token: {
      id: "user-123",
      email: "user@example.com",
      type: "regular",
    },
    secret: process.env.NEXTAUTH_SECRET,
    salt: "authjs.session-token",
  });

  const request = new NextRequest("http://localhost/", {
    headers: {
      cookie: `authjs.session-token=${token}`,
    },
  });

  const response = await proxy(request);

  assert.equal(
    response.status,
    200,
    "expected middleware to allow request when only NEXTAUTH_SECRET is set"
  );
  assert.equal(
    response.headers.get("location"),
    null,
    "expected middleware not to redirect to guest auth"
  );

  console.log("✅ middleware auth secret fallback test passed");
}

run();
