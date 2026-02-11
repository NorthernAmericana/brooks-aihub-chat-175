import assert from "node:assert/strict";
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

test("createPostSchema rejects unsafe markdown script tags", () => {
  const parsed = createPostSchema.safeParse({
    campfirePath: "community/builders-circle",
    title: "A valid title",
    body: "<script>alert('xss')</script>",
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
