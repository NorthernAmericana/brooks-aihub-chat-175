import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  campfirePathSchema,
  createCommentSchema,
  createPostSchema,
  listPostsQuerySchema,
} from "@/lib/validation/commons-schema";

test("createPostSchema accepts valid payload and trims title", () => {
  const parsed = createPostSchema.parse({
    campfirePath: "community/builders-circle",
    title: "  My First Build Log  ",
    body: "## Hello commons\nThis is my post.",
  });

  assert.equal(parsed.title, "My First Build Log");
  assert.equal(parsed.campfirePath, "community/builders-circle");
});

test("createPostSchema rejects html markup to reduce XSS risk", () => {
  const parsed = createPostSchema.safeParse({
    campfirePath: "community/builders-circle",
    title: "A valid title",
    body: "<img src=x onerror=alert('xss') />",
  });

  assert.equal(parsed.success, false);
});

test("campfirePathSchema rejects relative traversal segments", () => {
  const parsed = campfirePathSchema.safeParse("community/../builders-circle");
  assert.equal(parsed.success, false);
});

test("listPostsQuerySchema provides pagination defaults", () => {
  const parsed = listPostsQuerySchema.parse({});

  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 20);
  assert.equal(parsed.sort, "newest");
});

test("createCommentSchema enforces body length contract", () => {
  const parsed = createCommentSchema.safeParse({ body: "" });
  assert.equal(parsed.success, false);
});

test("commons query layer does not project author email", () => {
  const querySource = readFileSync("lib/db/commons-queries.ts", "utf-8");

  assert.equal(querySource.includes("authorEmail"), false);
});

test("campfire post lookup enforces active public campfire filters", () => {
  const querySource = readFileSync("lib/db/commons-queries.ts", "utf-8");

  assert.match(querySource, /eq\(commonsCampfire\.isPrivate, false\)/);
  assert.match(querySource, /eq\(commonsCampfire\.isActive, true\)/);
});
