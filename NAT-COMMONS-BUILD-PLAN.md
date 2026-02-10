# NAT: Commons — Build Plan & Implementation Guide

**Project:** NAT: Commons (Community Platform for Brooks AI HUB)  
**Status:** Planning / Pre-Development  
**Last Updated:** February 10, 2026  
**Version:** 1.0

---

## Table of Contents

1. [Product Definition](#1-product-definition)
2. [MVP Scope](#2-mvp-scope)
3. [Information Architecture & Routes](#3-information-architecture--routes)
4. [Data Model](#4-data-model)
5. [API Design](#5-api-design)
6. [UI Components](#6-ui-components)
7. [Moderation & Safety](#7-moderation--safety)
8. [Media Upload Flow](#8-media-upload-flow)
9. [Implementation Sequence (PR Plan)](#9-implementation-sequence-pr-plan)
10. [Testing Strategy](#10-testing-strategy)
11. [Future Enhancements](#11-future-enhancements)

---

## 1. Product Definition

### 1.1 Vision

**NAT: Commons** is a community-driven space within Brooks AI HUB where users can gather around **campfires** to share experiences, ask questions, and build connections within the Northern Americana Tech ecosystem.

Think of it as:
- **Reddit meets campfire gatherings** — themed community spaces with a cozy, trust-first vibe
- **Filesystem-based organization** — campfires as top-level "subreddits" mapped to filesystem paths
- **User-owned contributions** — posts, comments, and media that users control and can export
- **Safety-first design** — proactive moderation, reporting, and community guidelines

### 1.2 Core Principles

1. **Trust-First**: Users control their data, can export/delete content, and understand how moderation works
2. **Cozy + Capable**: Warm, woodsy aesthetic that encourages genuine conversation
3. **Structured but Flexible**: Organized campfires with clear themes, but room for organic discussion
4. **Privacy-Conscious**: Public by default within Commons, but with clear boundaries
5. **Moderation-Ready**: Built-in tools for reporting, flagging, and community safety

### 1.3 Key Use Cases

1. **Share strain experiences** (MyFlowerAI users)
2. **Discuss NAMC lore** (story fans)
3. **Get driving tips** (MyCarMindATO users)
4. **Community support** (general Brooks AI HUB users)
5. **Feature requests** (product feedback)
6. **Creative sharing** (art, music, stories inspired by NAT products)

### 1.4 Non-Goals (For MVP)

- ❌ Real-time chat (async posting only)
- ❌ Direct messaging between users
- ❌ User profiles/followers (focus on content)
- ❌ Karma/reputation systems (too gamified)
- ❌ Cross-posting to other platforms
- ❌ Native video hosting (links only for MVP)

---

## 2. MVP Scope

### 2.1 Phase 0: Foundation (Weeks 1-2)

**Goal:** Database schema, basic API routes, and admin tooling

**Deliverables:**
- Database schema for campfires, posts, comments, votes, reports
- Migration scripts
- Admin CLI for creating/managing campfires
- Basic API endpoints (CRUD operations)
- Integration with existing auth system

**Acceptance Criteria:**
- [ ] Database tables created with proper relationships
- [ ] Migrations run successfully on dev/staging
- [ ] Admin can create campfires via CLI
- [ ] API endpoints return proper JSON responses
- [ ] Auth middleware protects write operations

### 2.2 Phase 1: Read-Only Experience (Weeks 3-4)

**Goal:** Browse campfires and view posts (no posting yet)

**Deliverables:**
- `/commons` landing page with campfire directory
- `/commons/[...campfire]` page showing posts
- `/commons/[...campfire]/[postId]` page showing post + comments
- UI components for post cards, comment threads
- Pagination and sorting

**Acceptance Criteria:**
- [ ] Users can see all active campfires
- [ ] Users can browse posts in a campfire
- [ ] Users can read comments on a post
- [ ] Posts display author, timestamp, vote counts
- [ ] Layout matches Brooks AI HUB woodsy aesthetic

### 2.3 Phase 2: Posting & Commenting (Weeks 5-6)

**Goal:** Users can create posts and comments

**Deliverables:**
- Post creation form
- Comment creation form
- Rich text editor (basic markdown)
- Form validation and error handling
- Toast notifications for success/errors

**Acceptance Criteria:**
- [ ] Authenticated users can create posts
- [ ] Users can add comments to posts
- [ ] Markdown preview works
- [ ] Character limits enforced (title, body)
- [ ] Proper error messages for failures

### 2.4 Phase 3: Voting & Engagement (Week 7)

**Goal:** Users can upvote/downvote content

**Deliverables:**
- Vote buttons on posts and comments
- Vote count display
- Optimistic UI updates
- Vote persistence and reconciliation

**Acceptance Criteria:**
- [ ] Users can upvote/downvote posts
- [ ] Users can upvote/downvote comments
- [ ] Vote state persists across sessions
- [ ] Users can change their vote
- [ ] Vote counts update in real-time (local)

### 2.5 Phase 4: Moderation & Safety (Week 8)

**Goal:** Basic moderation tools and reporting

**Deliverables:**
- Report button on posts/comments
- Report submission form
- Moderation queue page (admin only)
- Content flagging system
- User content management (edit/delete own posts)

**Acceptance Criteria:**
- [ ] Users can report problematic content
- [ ] Admins can view reported content
- [ ] Admins can remove/hide content
- [ ] Users can edit their own posts (within time limit)
- [ ] Users can delete their own posts/comments

### 2.6 Phase 5: Media Support (Week 9)

**Goal:** Image uploads for posts

**Deliverables:**
- Image upload component
- Integration with existing blob storage
- Image preview in posts
- Image optimization (resize, compress)
- Alt text support

**Acceptance Criteria:**
- [ ] Users can upload images (max 5 per post)
- [ ] Images stored in Vercel Blob
- [ ] Images display in post view
- [ ] File size limits enforced (5MB per image)
- [ ] Proper error handling for upload failures

### 2.7 Phase 6: Polish & Launch (Week 10)

**Goal:** Final polish, testing, and soft launch

**Deliverables:**
- Performance optimization
- SEO metadata
- Error boundaries
- Loading states
- Initial seed campfires

**Acceptance Criteria:**
- [ ] All pages load in < 2s
- [ ] Mobile responsive
- [ ] Accessibility audit passes
- [ ] At least 3 seed campfires created
- [ ] Community guidelines published

---

## 3. Information Architecture & Routes

### 3.1 Route Structure

NAT: Commons uses a **filesystem-based campfire path model** that aligns with Next.js App Router conventions:

```
/commons                           → Commons landing page
/commons/[...campfire]             → Campfire home (list of posts)
/commons/[...campfire]/[postId]    → Individual post + comments
/commons/[...campfire]/submit      → Create new post
/commons/guidelines                → Community guidelines
/commons/moderation                → Moderation queue (admin only)
```

**Concrete App Router mapping (MVP):**

```text
app/commons/page.tsx
app/commons/[...campfire]/page.tsx
app/commons/[...campfire]/[postId]/page.tsx
app/commons/[...campfire]/submit/page.tsx
```

If a route conflict appears during implementation, use an equivalent non-conflicting detail layout such as:

```text
app/commons/[...campfire]/posts/[postId]/page.tsx
```

and keep submit at:

```text
app/commons/[...campfire]/submit/page.tsx
```

> **Canonical model decision:** `campfires.slug` remains a **single segment** identifier and hierarchy is represented via `campfires.parent_id`. Nested URL forms are resolved by Next.js catch-all params (`[...campfire]`) and mapped to a sequence of single-segment slugs.

### 3.2 Campfire Path Model

Each campfire is identified by a **single-segment slug**, while nesting is represented by `parent_id`:

```
myflowerai          → Root campfire (`slug='myflowerai'`, `parent_id=NULL`)
strains             → Child campfire under `myflowerai` (`slug='strains'`, `parent_id=<myflowerai.id>`)
tips                → Child campfire under `myflowerai` (`slug='tips'`, `parent_id=<myflowerai.id>`)

namc               → Root campfire
lore               → Child campfire under `namc`
spoilers           → Child campfire under `namc`

brooksbears        → BrooksBears experiences
mycarmindato       → Road trip stories and tips
meta               → Brooks AI HUB feedback and feature requests
```

**Rules:**
- `campfires.slug` must be lowercase, alphanumeric + hyphens (no leading/trailing hyphens, no consecutive hyphens)
- `campfires.slug` is always one segment (no `/`)
- Nesting uses `parent_id` (MVP depth: 2 levels max)
- URL paths are assembled from ancestry segments and parsed via Next.js catch-all (`[...campfire]`)
- Root campfires created by admins only
- Sub-campfires can be proposed by users (admin approval)

**Canonical conversion (campfire path arrays ⇄ stored slug/path):**

- Incoming route param is `params.campfire: string[]` from `[...campfire]`.
- Validation layer enforces:
  - `1 <= params.campfire.length <= 2` (hard max depth = 2 for MVP)
  - every segment matches slug regex (`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
  - reserved segments (e.g., `submit`) are rejected as campfire slugs
- Resolver walks `parent_id` from root to leaf using the array order.
- Canonical path string is derived as `campfirePath = params.campfire.join('/')` for URLs/logging.
- Canonical storage identity remains the **leaf campfire id** + parent chain (not a slash-delimited slug in DB).

### 3.3 Page Hierarchy

```
Commons Landing (/commons)
├── Featured Campfires (3-5 curated)
├── All Campfires (alphabetical, with descriptions)
└── Community Guidelines Link

Campfire Home (/commons/[...campfire])
├── Campfire Header (name, description, member count)
├── Sort/Filter Controls (new, hot, top)
├── Post List (paginated, 20 per page)
└── "New Post" Button (authenticated users)

Post Detail (/commons/[...campfire]/[postId])
├── Post Header (author, timestamp, campfire)
├── Post Content (title, body, media)
├── Vote Controls
├── Comment Section
│   ├── Top-level Comments (sorted by votes)
│   └── Nested Replies (max depth: 5 levels)
└── Share/Report Buttons

Submit Post (/commons/[...campfire]/submit)
├── Campfire Context (breadcrumb)
├── Post Form (title, body, images)
├── Preview Pane
└── Submit/Cancel Buttons
```

### 3.4 Navigation Integration

**Edge Swipe Nav** (already exists in `/src/components/EdgeSwipeNav.tsx`):
- Currently has placeholder links to `/commons`
- Update to show:
  - **Left edge:** NAT: Commons (current)
  - **Right edge:** Quick access to user's recent campfires

**Main Nav** (in app layout):
- Add "Commons" link to main navigation
- Badge indicator for unread replies (future)

---

## 4. Data Model

### 4.1 Schema Overview

```typescript
// Core entities
campfires     → Community spaces
posts         → Top-level content in campfires
comments      → Replies to posts (nested)
votes         → Upvotes/downvotes on posts/comments
reports       → User-submitted reports for moderation
media         → Uploaded images/files

// Relationships
user (existing) ──< posts ──< comments
posts ──< votes
comments ──< votes
posts ──< media
campfires ──< posts
```

### 4.2 Database Tables

#### 4.2.1 `campfires`

```sql
CREATE TABLE campfires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,                     -- Single URL segment (e.g., 'myflowerai', 'strains')
  parent_id UUID REFERENCES campfires(id), -- For sub-campfires
  name TEXT NOT NULL,                      -- Display name (e.g., 'MyFlowerAI')
  description TEXT,                        -- Short description
  rules TEXT,                              -- Campfire-specific rules (markdown)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES "User"(id),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  post_count INTEGER NOT NULL DEFAULT 0,   -- Denormalized for performance
  member_count INTEGER NOT NULL DEFAULT 0, -- Future: track subscriptions
  last_activity_at TIMESTAMPTZ,           -- Last post/comment timestamp
  
  -- Settings
  allow_images BOOLEAN NOT NULL DEFAULT TRUE,
  allow_links BOOLEAN NOT NULL DEFAULT TRUE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE, -- Moderated posting
  
  -- Display
  icon_url TEXT,                           -- Campfire icon/emoji
  banner_url TEXT,                         -- Header image
  
  CONSTRAINT valid_slug CHECK (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND
    position('/' in slug) = 0
  ),
  CONSTRAINT max_slug_length CHECK (length(slug) <= 50)
);

CREATE UNIQUE INDEX ux_campfires_root_slug ON campfires(slug) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX ux_campfires_child_slug ON campfires(parent_id, slug) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_campfires_slug ON campfires(slug);
CREATE INDEX idx_campfires_parent ON campfires(parent_id);
CREATE INDEX idx_campfires_activity ON campfires(last_activity_at DESC);
```

#### 4.2.2 `commons_posts`

```sql
CREATE TABLE commons_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campfire_id UUID NOT NULL REFERENCES campfires(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES "User"(id),
  
  -- Content
  title TEXT NOT NULL,
  body TEXT,                              -- Markdown content
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,                  -- Last edit timestamp
  
  -- Engagement
  vote_score INTEGER NOT NULL DEFAULT 0,  -- Denormalized: upvotes - downvotes
  comment_count INTEGER NOT NULL DEFAULT 0, -- Denormalized
  view_count INTEGER NOT NULL DEFAULT 0,
  
  -- Moderation
  is_removed BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE, -- Prevent new comments
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES "User"(id),
  removal_reason TEXT,
  
  -- Flags
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_nsfw BOOLEAN NOT NULL DEFAULT FALSE,
  is_spoiler BOOLEAN NOT NULL DEFAULT FALSE,
  
  CONSTRAINT title_length CHECK (length(title) BETWEEN 3 AND 300),
  CONSTRAINT body_length CHECK (length(body) <= 10000)
);

CREATE INDEX idx_posts_campfire ON commons_posts(campfire_id, created_at DESC);
CREATE INDEX idx_posts_author ON commons_posts(author_id);
CREATE INDEX idx_posts_score ON commons_posts(campfire_id, vote_score DESC);
CREATE INDEX idx_posts_hot ON commons_posts(campfire_id, created_at DESC, vote_score DESC);
```

#### 4.2.3 `commons_comments`

```sql
CREATE TABLE commons_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES commons_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES commons_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES "User"(id),
  
  -- Content
  body TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  
  -- Engagement
  vote_score INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0, -- Direct replies
  depth INTEGER NOT NULL DEFAULT 0,        -- Nesting level (0 = top-level)
  
  -- Moderation
  is_removed BOOLEAN NOT NULL DEFAULT FALSE,
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES "User"(id),
  removal_reason TEXT,
  
  CONSTRAINT body_length CHECK (length(body) BETWEEN 1 AND 5000),
  CONSTRAINT max_depth CHECK (depth <= 5)
);

CREATE INDEX idx_comments_post ON commons_comments(post_id, created_at ASC);
CREATE INDEX idx_comments_parent ON commons_comments(parent_id);
CREATE INDEX idx_comments_author ON commons_comments(author_id);
```

#### 4.2.4 `commons_votes`

```sql
CREATE TABLE commons_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  
  -- Polymorphic target (post or comment)
  post_id UUID REFERENCES commons_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES commons_comments(id) ON DELETE CASCADE,
  
  -- Vote value
  value INTEGER NOT NULL,                 -- 1 (upvote) or -1 (downvote)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT vote_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT vote_value CHECK (value IN (-1, 1)),
  CONSTRAINT unique_vote_post UNIQUE (user_id, post_id),
  CONSTRAINT unique_vote_comment UNIQUE (user_id, comment_id)
);

CREATE INDEX idx_votes_user ON commons_votes(user_id);
CREATE INDEX idx_votes_post ON commons_votes(post_id);
CREATE INDEX idx_votes_comment ON commons_votes(comment_id);
```

#### 4.2.5 `commons_reports`

```sql
CREATE TABLE commons_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES "User"(id),
  
  -- Reported content (polymorphic)
  post_id UUID REFERENCES commons_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES commons_comments(id) ON DELETE CASCADE,
  
  -- Report details
  reason VARCHAR(50) NOT NULL,            -- 'spam', 'harassment', 'misinformation', etc.
  details TEXT,                           -- User's explanation
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Moderation response
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES "User"(id),
  moderator_notes TEXT,
  
  CONSTRAINT report_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT valid_reason CHECK (reason IN (
    'spam', 'harassment', 'hate_speech', 'misinformation',
    'nsfw', 'illegal', 'self_harm', 'other'
  ))
);

CREATE INDEX idx_reports_status ON commons_reports(status, created_at DESC);
CREATE INDEX idx_reports_reporter ON commons_reports(reporter_id);
```

#### 4.2.6 `commons_media`

```sql
CREATE TABLE commons_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES commons_posts(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES "User"(id),
  
  -- Storage
  blob_url TEXT NOT NULL,                 -- Vercel Blob URL
  blob_pathname TEXT NOT NULL,            -- Path in blob storage
  
  -- Metadata
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,             -- MIME type
  file_size INTEGER NOT NULL,             -- Bytes
  width INTEGER,                          -- Image dimensions
  height INTEGER,
  
  -- Display
  alt_text TEXT,                          -- Accessibility
  display_order INTEGER NOT NULL DEFAULT 0, -- Order in post
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_content_type CHECK (content_type ~ '^image/(jpeg|png|gif|webp)$'),
  CONSTRAINT max_file_size CHECK (file_size <= 5242880) -- 5MB
);

CREATE INDEX idx_media_post ON commons_media(post_id, display_order);
CREATE INDEX idx_media_uploader ON commons_media(uploader_id);
```

### 4.3 Data Flow

```
User creates post
  → POST /api/commons/[...campfire]/posts
  → Validate auth, content, campfire exists
  → Insert into commons_posts
  → Upload images → Insert into commons_media
  → Increment campfire.post_count
  → Update campfire.last_activity_at
  → Return post ID

User votes on post
  → POST /api/commons/votes
  → Check existing vote by user
  → Upsert vote record
  → Update post.vote_score (trigger or app logic)
  → Return new vote state

User reports content
  → POST /api/commons/reports
  → Validate target exists
  → Insert into commons_reports
  → Notify moderators (future: email/webhook)
  → Return confirmation
```

---

## 5. API Design

### 5.1 API Principles

- **RESTful conventions** where sensible
- **Server Components first** for read-heavy operations
- **Server Actions** for mutations (forms, voting)
- **Edge-compatible** queries (no pg_trgm initially)
- **Type-safe** with Zod validation

### 5.2 API Routes

### 5.2.0 MVP Admin Authorization Contract (Required)

For **MVP only**, every privileged Commons API route must enforce the same server-side gate:

```typescript
const hasMvpAdminAccess = session?.user?.foundersAccess === true;
if (!hasMvpAdminAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

- **Exact gate:** `session.user.foundersAccess === true` (boolean strict check).
- UI checks (`/commons/moderation`, admin buttons) are **advisory only**; route handlers are source of truth.
- Never rely on truthy coercion (`if (session.user.foundersAccess)`) for privileged access.

#### Migration path to `isAdmin` (post-MVP)

Phase the authorization migration to avoid breaking existing founders during rollout:

1. **Dual-read (compatibility phase):** `isAdmin === true || foundersAccess === true`
2. **Backfill:** set `isAdmin=true` for all users currently holding `foundersAccess=true`
3. **Write-new/read-both:** new admin grants only update `isAdmin`; checks still read both flags
4. **Cutover:** once all admin users are verified on `isAdmin`, remove `foundersAccess` from guards

Recommended helper during migration:

```typescript
const hasAdminAccess =
  session?.user?.isAdmin === true || session?.user?.foundersAccess === true;
```

> Backward compatibility requirement: no existing founder should lose moderation/campfire privileges until cutover is complete and audited.

**Route contract for campfire identity:**
- `campfires.slug` is a single segment in storage (no `/`).
- Nested URL forms use catch-all params (`[...campfire]`), e.g. `['myflowerai', 'strains']`.
- Validation layer rejects campfire arrays deeper than 2 segments for MVP.
- Server resolves catch-all arrays by walking parent/child records (`parent_id`) from root to leaf and uses the leaf `campfire_id` for queries.
- Canonical URL path is generated from validated array segments (`campfire.join('/')`), while DB identity remains normalized as leaf record + ancestry.

#### 5.2.1 Campfires

```typescript
// List all campfires
GET /api/commons/campfires
Response: { campfires: Campfire[], total: number }

// Get campfire details
GET /api/commons/campfires/[slug]
Response: { campfire: Campfire, stats: { posts: number, members: number } }

// Create campfire (admin only)
POST /api/commons/campfires
Body: { slug, name, description, parentId?, settings }
Response: { campfire: Campfire }
```

**Authorization Matrix — Campfire creation**

| Surface | Endpoint / Route | Allowed in MVP | Server guard (MVP) | Future guard (migration phase) |
|---|---|---|---|---|
| API | `POST /api/commons/campfires` | Admin only | `foundersAccess === true` | `isAdmin === true || foundersAccess === true` |
| UI | Campfire creation controls | Admin only (hide/disable otherwise) | Must mirror API gate, but API is authoritative | Must mirror migrated helper |

#### 5.2.2 Posts

```typescript
// List posts in campfire
GET /api/commons/[...campfire]/posts
Query: { sort: 'new' | 'hot' | 'top', page: number, limit: number }
Response: { posts: Post[], hasMore: boolean, total: number }

// Get single post
GET /api/commons/[...campfire]/posts/[postId]
Response: { post: Post, author: User, media: Media[] }

// Create post
POST /api/commons/[...campfire]/posts
Body: { title, body, images?: File[], nsfw: boolean, spoiler: boolean }
Response: { post: Post }

// Update post (author only, within 15min of creation)
PATCH /api/commons/[...campfire]/posts/[postId]
Body: { title?, body? }
Response: { post: Post }
Note: API validates createdAt is within 15 minutes before allowing edit

// Delete post (author or admin)
DELETE /api/commons/[...campfire]/posts/[postId]
Response: { success: true }
```

#### 5.2.3 Comments

```typescript
// List comments for post
GET /api/commons/posts/[postId]/comments
Query: { sort: 'best' | 'new' | 'old', parentId?: UUID }
Response: { comments: Comment[], total: number }

// Create comment
POST /api/commons/posts/[postId]/comments
Body: { body, parentId?: UUID }
Response: { comment: Comment }

// Update comment
PATCH /api/commons/comments/[commentId]
Body: { body }
Response: { comment: Comment }

// Delete comment
DELETE /api/commons/comments/[commentId]
Response: { success: true }
```

#### 5.2.4 Votes

```typescript
// Vote on content
POST /api/commons/votes
Body: { 
  targetType: 'post' | 'comment',
  targetId: UUID,
  value: 1 | -1 | 0  // 0 = remove vote
}
Response: { 
  vote: { value: number },
  newScore: number
}

// Get user's votes for a post and its comments
GET /api/commons/votes/user
Query: { postId: UUID }
Response: { 
  votes: { targetId: UUID, value: number }[]
}
```

#### 5.2.5 Reports

```typescript
// Submit report
POST /api/commons/reports
Body: {
  targetType: 'post' | 'comment',
  targetId: UUID,
  reason: ReportReason,
  details?: string
}
Response: { report: Report }

// List reports (moderators only)
GET /api/commons/reports
Query: { status: 'pending' | 'reviewed', page: number }
Response: { reports: Report[], total: number }

// Update report status (moderators only)
PATCH /api/commons/reports/[reportId]
Body: { status: 'reviewed' | 'actioned' | 'dismissed', notes?: string }
Response: { report: Report }
```

**Authorization Matrix — Moderation queue access**

| Surface | Endpoint / Route | Allowed in MVP | Server guard (MVP) | Future guard (migration phase) |
|---|---|---|---|---|
| API | `GET /api/commons/reports` | Admin only | `foundersAccess === true` | `isAdmin === true || foundersAccess === true` |
| UI | `/commons/moderation` page load + data fetch | Admin only | Must mirror API gate, but API is authoritative | Must mirror migrated helper |

**Authorization Matrix — Report actioning**

| Surface | Endpoint / Route | Allowed in MVP | Server guard (MVP) | Future guard (migration phase) |
|---|---|---|---|---|
| API | `PATCH /api/commons/reports/[reportId]` | Admin only | `foundersAccess === true` | `isAdmin === true || foundersAccess === true` |
| UI | Report action buttons (`Dismiss`, `Remove`, etc.) | Admin only | Must mirror API gate, but API is authoritative | Must mirror migrated helper |

**Authorization Matrix — Content removal / locking / pinning**

| Surface | Endpoint / Route | Allowed in MVP | Server guard (MVP) | Future guard (migration phase) |
|---|---|---|---|---|
| API | `DELETE /api/commons/[...campfire]/posts/[postId]` (remove) | Author or admin | `authorId === session.user.id OR foundersAccess === true` | `authorId === session.user.id OR isAdmin === true OR foundersAccess === true` |
| API | `PATCH /api/commons/[...campfire]/posts/[postId]` (lock/pin fields in moderation mode) | Admin only | `foundersAccess === true` | `isAdmin === true || foundersAccess === true` |
| UI | Post moderation controls (`Remove`, `Lock`, `Pin`) | Admin only (except author self-delete) | Must mirror API gate, but API is authoritative | Must mirror migrated helper |

#### 5.2.6 Media

```typescript
// Upload image for post
POST /api/commons/media/upload
Body: FormData { file: File, postId?: UUID }
Response: { 
  url: string,
  pathname: string,
  metadata: { width, height, size }
}

// Delete media (author or admin)
DELETE /api/commons/media/[mediaId]
Response: { success: true }
```

### 5.3 Server Actions (Form Submissions)

For better UX, use Server Actions for form submissions:

```typescript
// app/commons/[...campfire]/submit/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  // Validate
  const data = createPostSchema.parse({
    title: formData.get('title'),
    body: formData.get('body'),
    // ...
  });
  
  // Insert post
  const post = await db.insert(commons_posts).values({
    campfireId: campfireId,
    authorId: session.user.id,
    ...data
  }).returning();
  
  revalidatePath(`/commons/${campfire}`);
  redirect(`/commons/${campfire}/${post.id}`);
}
```

### 5.4 Query Optimization

**Hot Posts Algorithm:**
```typescript
// Simplified "hot" ranking
score = (upvotes - downvotes) / ((age_hours + 2) ** 1.5)

// SQL implementation
SELECT *,
  (vote_score / POW(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 + 2, 1.5)) as hot_score
FROM commons_posts
WHERE campfire_id = $1
ORDER BY hot_score DESC
LIMIT 20;
```

**Pagination:**
- Use cursor-based pagination for better performance
- Fallback to offset pagination for simplicity in MVP

---

## 6. UI Components

### 6.1 Component Hierarchy

```
Commons Layout
├── CommonsNav (breadcrumbs, search)
├── CampfireList
│   └── CampfireCard
├── PostList
│   └── PostCard
│       ├── VoteButtons
│       ├── PostMeta (author, time, campfire)
│       └── PostActions (share, report, edit)
├── PostDetail
│   ├── PostContent
│   ├── MediaGallery
│   └── CommentSection
│       └── CommentThread
│           └── Comment
│               ├── VoteButtons
│               └── CommentActions
└── Forms
    ├── PostForm
    ├── CommentForm
    └── ReportForm
```

### 6.2 Core Components

#### 6.2.1 CampfireCard

```typescript
// components/commons/CampfireCard.tsx
interface CampfireCardProps {
  campfire: {
    slug: string;
    name: string;
    description: string;
    postCount: number;
    lastActivityAt: Date | null;
  };
}

export function CampfireCard({ campfire }: CampfireCardProps) {
  return (
    <Link 
      href={`/commons/${campfire.slug}`}
      className="rounded-lg border border-white/10 bg-black/25 p-4 
                 transition hover:bg-black/35"
    >
      <div className="flex items-start gap-3">
        <Flame className="h-6 w-6 text-amber-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{campfire.name}</h3>
          <p className="text-sm text-white/70 line-clamp-2">
            {campfire.description}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
            <span>{campfire.postCount} posts</span>
            {campfire.lastActivityAt && (
              <span>Active {formatRelative(campfire.lastActivityAt)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

#### 6.2.2 PostCard

```typescript
// components/commons/PostCard.tsx
interface PostCardProps {
  post: {
    id: string;
    title: string;
    body: string | null;
    voteScore: number;
    commentCount: number;
    createdAt: Date;
    author: { id: string; email: string; displayName?: string | null; avatarUrl?: string | null };
    campfire: { slug: string; name: string };
    isPinned: boolean;
    isNsfw: boolean;
    isSpoiler: boolean;
  };
  userVote?: { value: number } | null;
  compact?: boolean;
}

export function PostCard({ post, userVote, compact = false }: PostCardProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/25">
      <div className="flex gap-3 p-4">
        {/* Vote buttons */}
        <VoteButtons
          targetType="post"
          targetId={post.id}
          initialScore={post.voteScore}
          userVote={userVote?.value}
        />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Link href={`/commons/${post.campfire.slug}`}>
              c/{post.campfire.name}
            </Link>
            <span>•</span>
            <span>Posted by {post.author.displayName || `User ${post.author.id.slice(0, 8)}`}</span>
            <span>•</span>
            <time>{formatRelative(post.createdAt)}</time>
          </div>
          
          <Link href={`/commons/${post.campfire.slug}/${post.id}`}>
            <h3 className="mt-1 text-lg font-semibold text-white hover:text-amber-200">
              {post.isPinned && <Pin className="inline h-4 w-4 mr-1" />}
              {post.title}
            </h3>
          </Link>
          
          {!compact && post.body && (
            <p className="mt-2 text-sm text-white/70 line-clamp-3">
              {post.body.substring(0, 200)}
            </p>
          )}
          
          <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
            <button className="flex items-center gap-1 hover:text-white">
              <MessageSquare className="h-4 w-4" />
              {post.commentCount} comments
            </button>
            <button className="hover:text-white">Share</button>
            <button className="hover:text-white">Report</button>
          </div>
        </div>
      </div>
    </article>
  );
}
```

#### 6.2.3 VoteButtons

```typescript
// components/commons/VoteButtons.tsx
'use client'

interface VoteButtonsProps {
  targetType: 'post' | 'comment';
  targetId: string;
  initialScore: number;
  userVote?: number; // 1, -1, or undefined
  orientation?: 'vertical' | 'horizontal';
}

export function VoteButtons({
  targetType,
  targetId,
  initialScore,
  userVote,
  orientation = 'vertical'
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState(userVote);
  const [isPending, startTransition] = useTransition();

  const handleVote = (value: number) => {
    startTransition(async () => {
      const newVote = vote === value ? 0 : value; // Toggle
      const optimisticScore = score - (vote || 0) + newVote;
      
      setVote(newVote);
      setScore(optimisticScore);
      
      try {
        const result = await voteAction({
          targetType,
          targetId,
          value: newVote
        });
        setScore(result.newScore);
      } catch (error) {
        // Revert on error
        setVote(vote);
        setScore(score);
        toast.error('Vote failed');
      }
    });
  };

  return (
    <div className={cn(
      "flex items-center gap-1",
      orientation === 'vertical' ? "flex-col" : "flex-row"
    )}>
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        className={cn(
          "rounded p-1 transition",
          vote === 1 ? "text-amber-400" : "text-white/50 hover:text-amber-400"
        )}
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      
      <span className={cn(
        "text-sm font-semibold",
        vote === 1 && "text-amber-400",
        vote === -1 && "text-blue-400",
        !vote && "text-white/70"
      )}>
        {score}
      </span>
      
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        className={cn(
          "rounded p-1 transition",
          vote === -1 ? "text-blue-400" : "text-white/50 hover:text-blue-400"
        )}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
```

#### 6.2.4 CommentThread

```typescript
// components/commons/CommentThread.tsx
interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  voteScore: number;
  createdAt: Date;
  author: { id: string; email: string; displayName?: string | null; avatarUrl?: string | null };
}

interface CommentThreadProps {
  comments: Comment[];
  postId: string;
  maxDepth?: number;
}

export function CommentThread({ 
  comments, 
  postId, 
  maxDepth = 5 
}: CommentThreadProps) {
  const topLevel = comments.filter(c => !c.parentId);
  
  return (
    <div className="space-y-4">
      {topLevel.map(comment => (
        <CommentNode
          key={comment.id}
          comment={comment}
          allComments={comments}
          postId={postId}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
}

function CommentNode({ 
  comment, 
  allComments, 
  postId, 
  maxDepth, 
  depth = 0 
}: CommentNodeProps) {
  const [isReplying, setIsReplying] = useState(false);
  const replies = allComments.filter(c => c.parentId === comment.id);
  
  return (
    <div className={cn(
      "pl-4 border-l border-white/10",
      depth > 0 && "ml-4"
    )}>
      <div className="mb-2">
        <div className="flex items-start gap-3">
          <VoteButtons
            targetType="comment"
            targetId={comment.id}
            initialScore={comment.voteScore}
            orientation="horizontal"
          />
          <div className="flex-1">
            <div className="text-xs text-white/50">
              {comment.author.displayName || `User ${comment.author.id.slice(0, 8)}`} · {formatRelative(comment.createdAt)}
            </div>
            <p className="mt-1 text-sm text-white/80">{comment.body}</p>
            <div className="mt-1 flex gap-3 text-xs text-white/50">
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className="hover:text-white"
              >
                Reply
              </button>
              <button className="hover:text-white">Report</button>
            </div>
          </div>
        </div>
        
        {isReplying && (
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={() => setIsReplying(false)}
            onCancel={() => setIsReplying(false)}
          />
        )}
      </div>
      
      {replies.length > 0 && depth < maxDepth && (
        <div className="space-y-2">
          {replies.map(reply => (
            <CommentNode
              key={reply.id}
              comment={reply}
              allComments={allComments}
              postId={postId}
              maxDepth={maxDepth}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6.3 Design System Alignment

**Colors (from brand-style.md):**
- Background: `woodsy-base` (warm dark tones)
- Primary: Amber/orange (`text-amber-200`, `text-amber-400`)
- Text: White with opacity variants (`text-white/70`, `text-white/50`)
- Borders: `border-white/10`
- Cards: `bg-black/25` with `backdrop-blur-md`

**Typography:**
- Headings: `font-semibold` or `font-pixel` for retro vibe
- Body: `text-sm` or `text-base`
- Metadata: `text-xs text-white/50`

**Icons:**
- Use `lucide-react` for consistency
- Key icons: `Flame` (campfires), `MessageSquare` (comments), `ChevronUp/Down` (votes)

---

## 7. Moderation & Safety

### 7.1 Moderation Strategy

**Proactive:**
- Content length limits (prevent spam)
- Rate limiting (10 posts/hour per user)
- Image size limits (5MB max)
- Profanity filter for titles (configurable)

**Reactive:**
- User reporting system
- Moderator queue
- Content removal (soft delete)
- Account suspension (future)

### 7.2 Report Reasons

```typescript
const REPORT_REASONS = {
  spam: 'Spam or commercial content',
  harassment: 'Harassment or bullying',
  hate_speech: 'Hate speech or discrimination',
  misinformation: 'False or misleading information',
  nsfw: 'Inappropriate content (not marked NSFW)',
  illegal: 'Illegal activity or content',
  self_harm: 'Self-harm or suicide content',
  other: 'Other (explain in details)'
} as const;
```

### 7.3 Moderator Permissions

**MVP admin gate (exact):** `session.user.foundersAccess === true`

**Admin users** (MVP + migration-aware):
- View moderation queue
- Remove posts/comments
- Lock threads
- Pin posts
- Create/archive campfires
- Ban users (future)

**Migration path to `isAdmin` with backward compatibility:**
- Step 1 (MVP): privileged moderation routes require `foundersAccess === true`
- Step 2 (compat phase): moderation routes accept `isAdmin === true || foundersAccess === true`
- Step 3 (data migration): backfill `isAdmin=true` for all founders
- Step 4 (cutover): remove `foundersAccess` checks after audit confirms full parity

Canonical migration helper:

```typescript
const canModerate =
  session?.user?.isAdmin === true || session?.user?.foundersAccess === true;
```

**Actions:**
- **Remove:** Soft delete (sets `is_removed = true`, keeps in DB)
- **Lock:** Prevent new comments (sets `is_locked = true`)
- **Pin:** Show at top of campfire (sets `is_pinned = true`)

### 7.4 Moderation UI

```
/commons/moderation (admin only)

Tabs:
- [ ] Pending Reports (N)
- [ ] Removed Content
- [ ] Locked Threads

Report Card:
┌─────────────────────────────────────┐
│ Report #123                         │
│ Type: Post                          │
│ Reason: Spam                        │
│ Details: "Advertising their blog"   │
│                                     │
│ [View Post] [Dismiss] [Remove Post] │
└─────────────────────────────────────┘
```

### 7.5 Community Guidelines

Create `/commons/guidelines` page with:

1. **Be Respectful**
   - No harassment, hate speech, or personal attacks
   - Disagree ideas, not people

2. **Stay On Topic**
   - Post in relevant campfires
   - Use descriptive titles

3. **No Spam**
   - No self-promotion without disclosure
   - No duplicate posting

4. **Content Warnings**
   - Mark NSFW content appropriately
   - Use spoiler tags for story discussions

5. **Privacy**
   - Don't share others' personal information
   - Use discretion with your own info

6. **Enforcement**
   - First offense: warning
   - Repeat offenses: content removal
   - Severe violations: account suspension

---

## 8. Media Upload Flow

### 8.1 Upload Process

```
User selects images
  ↓
Client-side validation
  - File type (JPEG, PNG, GIF, WebP)
  - File size (< 5MB each)
  - Count (max 5 per post)
  ↓
Upload to Vercel Blob
  - Use FormData
  - Stream upload
  - Get blob URL
  ↓
Create commons_media record
  - Store blob URL
  - Extract metadata (dimensions, size)
  - Link to post
  ↓
Display in post
```

### 8.2 Image Processing

**Client-side (before upload):**
```typescript
async function optimizeImage(file: File): Promise<File> {
  // Resize if > 2000px wide/tall
  // Compress to < 5MB
  // Convert to WebP if possible
  return optimizedFile;
}
```

**Server-side (in API route):**
```typescript
// app/api/commons/media/upload/route.ts
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Validate
  if (!file.type.startsWith('image/')) {
    return badRequest('Only images allowed');
  }
  if (file.size > 5_242_880) {
    return badRequest('File too large (max 5MB)');
  }
  
  // Upload to blob storage
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true
  });
  
  // Save metadata
  const media = await db.insert(commons_media).values({
    postId: postId,
    uploaderId: session.user.id,
    blobUrl: blob.url,
    blobPathname: blob.pathname,
    filename: file.name,
    contentType: file.type,
    fileSize: file.size,
    // Extract dimensions (using sharp or client-provided)
  }).returning();
  
  return json({ media });
}
```

### 8.3 Display

**In PostCard (preview):**
```typescript
{post.media?.[0] && (
  <img
    src={post.media[0].blobUrl}
    alt={post.media[0].altText || 'Post image'}
    className="mt-2 rounded-lg max-h-[300px] object-cover"
  />
)}
```

**In PostDetail (full gallery):**
```typescript
<MediaGallery images={post.media} />

// components/commons/MediaGallery.tsx
export function MediaGallery({ images }: { images: Media[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {images.map(img => (
        <img
          key={img.id}
          src={img.blobUrl}
          alt={img.altText || ''}
          className="rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => openLightbox(img)}
        />
      ))}
    </div>
  );
}
```

### 8.4 Cleanup

**On post deletion:**
```typescript
// Delete media from blob storage
for (const media of post.media) {
  await del(media.blobPathname);
}

// Delete media records
await db.delete(commons_media).where(eq(commons_media.postId, postId));
```

---

## 9. Implementation Sequence (PR Plan)

### PR #1: Database Schema & Migrations

**Files:**
- `lib/db/schema.ts` (add Commons tables)
- `lib/db/migrations/NNNN_create_commons_tables.ts`
- `lib/db/queries/commons.ts` (query helpers)

**Tests:**
- Migration runs successfully
- Foreign key constraints work
- Indexes created

**Acceptance:**
- [ ] All tables created
- [ ] Sample data can be inserted
- [ ] Migration is reversible

---

### PR #2: API Routes — Campfires

**Files:**
- `app/api/commons/campfires/route.ts` (GET, POST)
- `app/api/commons/campfires/[slug]/route.ts` (GET)
- `lib/validation/commons.ts` (Zod schemas)

**Tests:**
- Can list campfires
- Can get campfire details
- Admin can create campfires
- Non-admin cannot create

**Acceptance:**
- [ ] Endpoints return correct data
- [ ] Proper error handling
- [ ] Auth middleware works

---

### PR #3: API Routes — Posts

**Files:**
- `app/api/commons/[...campfire]/posts/route.ts` (GET, POST)
- `app/api/commons/[...campfire]/posts/[postId]/route.ts` (GET, PATCH, DELETE)
- `app/commons/[...campfire]/submit/actions.ts` (Server Actions)

**Tests:**
- Can list posts
- Can create posts
- Author can edit own posts (within time limit)
- Author can delete own posts

**Acceptance:**
- [ ] CRUD operations work
- [ ] Denormalized counts update
- [ ] Proper validation

---

### PR #4: UI — Commons Landing & Campfire List

**Files:**
- `app/commons/page.tsx` (replace placeholder)
- `components/commons/CampfireCard.tsx`
- `components/commons/CampfireList.tsx`

**Tests:**
- Page renders with campfires
- Links navigate correctly

**Acceptance:**
- [ ] Campfires display correctly
- [ ] Matches design system
- [ ] Mobile responsive

---

### PR #5: UI — Post List & Post Cards

**Files:**
- `app/commons/[...campfire]/page.tsx`
- `components/commons/PostCard.tsx`
- `components/commons/PostList.tsx`
- `components/commons/SortControls.tsx`

**Tests:**
- Posts display correctly
- Sorting works (new, hot, top)
- Pagination works

**Acceptance:**
- [ ] Post list loads
- [ ] Sort/filter controls work
- [ ] Pagination works

---

### PR #6: UI — Post Detail & Comments

**Files:**
- `app/commons/[...campfire]/[postId]/page.tsx`
- `components/commons/PostDetail.tsx`
- `components/commons/CommentThread.tsx`
- `components/commons/Comment.tsx`

**Tests:**
- Post detail renders
- Comments display nested
- Deep nesting handles correctly

**Acceptance:**
- [ ] Post displays with all metadata
- [ ] Comments nest correctly
- [ ] Max depth enforced

---

### PR #7: Forms — Create Post & Comment

**Files:**
- `app/commons/[...campfire]/submit/page.tsx`
- `components/commons/PostForm.tsx`
- `components/commons/CommentForm.tsx`
- `components/commons/MarkdownEditor.tsx`

**Tests:**
- Forms validate correctly
- Markdown preview works
- Server Actions handle errors

**Acceptance:**
- [ ] Can create posts
- [ ] Can add comments
- [ ] Validation works
- [ ] Error messages clear

---

### PR #8: Voting System

**Files:**
- `app/api/commons/votes/route.ts`
- `components/commons/VoteButtons.tsx`
- `lib/actions/commons-votes.ts` (Server Action)

**Tests:**
- Can upvote/downvote
- Can change vote
- Score updates correctly
- Optimistic UI works

**Acceptance:**
- [ ] Voting works on posts
- [ ] Voting works on comments
- [ ] Scores update correctly
- [ ] Optimistic UI feels instant

---

### PR #9: Reporting & Moderation UI

**Files:**
- `app/api/commons/reports/route.ts`
- `app/commons/moderation/page.tsx`
- `components/commons/ReportForm.tsx`
- `components/commons/ModerationQueue.tsx`

**Tests:**
- Users can report content
- Admins see moderation queue
- Admins can action reports

**Acceptance:**
- [ ] Report form works
- [ ] Queue displays reports
- [ ] Admins can remove content
- [ ] Non-admins cannot access

---

### PR #10: Media Upload

**Files:**
- `app/api/commons/media/upload/route.ts`
- `components/commons/ImageUpload.tsx`
- `components/commons/MediaGallery.tsx`

**Tests:**
- Images upload successfully
- Validation enforces limits
- Images display in posts

**Acceptance:**
- [ ] Can upload up to 5 images
- [ ] Size/type validation works
- [ ] Images display correctly
- [ ] Alt text supported

---

### PR #11: Seed Data & Guidelines

**Files:**
- `scripts/seed-commons.ts`
- `app/commons/guidelines/page.tsx`
- `data/commons/seed-campfires.json`

**Tests:**
- Seed script creates campfires
- Guidelines page renders

**Acceptance:**
- [ ] 5+ seed campfires created
- [ ] Guidelines page complete
- [ ] Campfires have descriptions

---

### PR #12: Polish & Performance

**Files:**
- Various (optimizations)
- Loading states
- Error boundaries
- SEO metadata

**Tests:**
- Lighthouse score > 90
- Mobile usability passes
- Accessibility audit passes

**Acceptance:**
- [ ] Loading states on all pages
- [ ] Error boundaries catch errors
- [ ] SEO metadata present
- [ ] Mobile responsive verified

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Database Queries:**
```typescript
// lib/db/queries/commons.test.ts
describe('getCampfirePosts', () => {
  it('returns posts sorted by date', async () => {
    const posts = await getCampfirePosts('myflowerai', { sort: 'new' });
    expect(posts[0].createdAt > posts[1].createdAt).toBe(true);
  });
  
  it('filters by campfire slug', async () => {
    const posts = await getCampfirePosts('myflowerai');
    expect(posts.every(p => p.campfire.slug === 'myflowerai')).toBe(true);
  });
});
```

**Server Actions:**
```typescript
// lib/actions/commons-posts.test.ts
describe('createPostAction', () => {
  it('creates post with valid data', async () => {
    const result = await createPostAction({
      campfireSlug: 'test',
      title: 'Test Post',
      body: 'Test body'
    });
    expect(result.post).toBeDefined();
  });
  
  it('rejects without auth', async () => {
    await expect(createPostAction({...})).rejects.toThrow('Unauthorized');
  });
});
```

### 10.2 Integration Tests

**API Routes:**
```typescript
// app/api/commons/[...campfire]/posts/route.test.ts
describe('POST /api/commons/[...campfire]/posts', () => {
  it('creates post for authenticated user', async () => {
    const res = await fetch('/api/commons/test/posts', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: JSON.stringify({ title: 'Test', body: 'Body' })
    });
    expect(res.status).toBe(201);
  });
});
```

### 10.3 E2E Tests (Playwright)

```typescript
// tests/commons/post-creation.spec.ts
test('user can create a post', async ({ page }) => {
  await page.goto('/commons/test');
  await page.click('text=New Post');
  
  await page.fill('[name="title"]', 'My Test Post');
  await page.fill('[name="body"]', 'This is a test post body.');
  await page.click('button:has-text("Submit")');
  
  await expect(page).toHaveURL(/\/commons\/test\/[a-f0-9-]+/);
  await expect(page.locator('h1')).toContainText('My Test Post');
});

test('user can vote on a post', async ({ page }) => {
  await page.goto('/commons/test/post-123');
  
  const upvote = page.locator('[aria-label="Upvote"]');
  await upvote.click();
  
  await expect(page.locator('[data-testid="vote-score"]')).toContainText('1');
});
```

### 10.4 Load Testing

**Expected Load:**
- 100 concurrent users
- 10 posts created per minute
- 100 votes per minute
- 50 comments per minute

**Tools:**
- Artillery for API load testing
- Lighthouse CI for performance regression

---

## 11. Future Enhancements

### 11.1 Phase 2 Features (Post-MVP)

**User Profiles:**
- Add `displayName` field to User table (for privacy)
- `/commons/u/[userId]` — user profile page
- Post/comment history
- User badges (Founder, Moderator, etc.)

**Subscriptions:**
- Subscribe to campfires
- Personalized feed (`/commons/feed`)
- Notification preferences

**Search:**
- Full-text search across posts/comments
- Filter by campfire, date range, author
- Save search queries

**Rich Content:**
- Embed links (YouTube, Spotify, etc.)
- Code blocks with syntax highlighting
- Polls

**Advanced Moderation:**
- Automod rules (regex-based)
- User reputation scores
- Shadow banning
- Appeal system

### 11.2 Phase 3 Features (Long-Term)

**AI Integration:**
- Summarize long threads
- Suggest related posts
- Auto-tag posts
- Sentiment analysis for moderation

**Analytics:**
- Campfire growth metrics
- User engagement dashboard
- Content performance

**Gamification (Light Touch):**
- Streak tracking (daily visit)
- Campfire "explorer" badges
- Special flair for helpful users

**Mobile App:**
- React Native wrapper
- Push notifications
- Offline read mode

---

## Appendices

### A. Database Schema Summary

**Note on User Display Names:** The existing User table does not include a `displayName` field. For MVP, the UI components use a fallback pattern of `User ${id.slice(0, 8)}` when no display name is available. A future migration should add `displayName` to the User table for better privacy (Phase 2).

```
campfires (12 columns)
  ├── id, slug, parent_id, name, description
  ├── created_at, created_by, is_archived
  ├── post_count, member_count, last_activity_at
  └── settings & display fields

commons_posts (18 columns)
  ├── id, campfire_id, author_id
  ├── title, body
  ├── timestamps (created, updated, edited)
  ├── engagement (vote_score, comment_count, view_count)
  ├── moderation (is_removed, is_locked, removed_by)
  └── flags (is_pinned, is_nsfw, is_spoiler)

commons_comments (13 columns)
  ├── id, post_id, parent_id, author_id
  ├── body
  ├── timestamps
  ├── engagement (vote_score, reply_count, depth)
  └── moderation fields

commons_votes (7 columns)
  ├── id, user_id, post_id, comment_id
  ├── value, created_at

commons_reports (10 columns)
  ├── id, reporter_id, post_id, comment_id
  ├── reason, details
  ├── status, reviewed_at, reviewed_by
  └── moderator_notes

commons_media (13 columns)
  ├── id, post_id, uploader_id
  ├── blob storage (url, pathname)
  ├── metadata (filename, type, size, dimensions)
  ├── display (alt_text, order)
  └── created_at
```

### B. File Structure

```
app/
├── commons/
│   ├── page.tsx (landing)
│   ├── guidelines/
│   │   └── page.tsx
│   ├── moderation/
│   │   └── page.tsx (admin only)
│   └── [...campfire]/
│       ├── page.tsx (post list)
│       ├── submit/
│       │   ├── page.tsx
│       │   └── actions.ts
│       └── [postId]/
│           └── page.tsx (post detail)
│
├── api/
│   └── commons/
│       ├── campfires/
│       │   ├── route.ts
│       │   └── [slug]/route.ts
│       ├── [...campfire]/
│       │   └── posts/
│       │       ├── route.ts
│       │       └── [postId]/route.ts
│       ├── posts/
│       │   └── [postId]/
│       │       └── comments/route.ts
│       ├── comments/
│       │   └── [commentId]/route.ts
│       ├── votes/
│       │   └── route.ts
│       ├── reports/
│       │   ├── route.ts
│       │   └── [reportId]/route.ts
│       └── media/
│           ├── upload/route.ts
│           └── [mediaId]/route.ts
│
components/
└── commons/
    ├── CampfireCard.tsx
    ├── CampfireList.tsx
    ├── PostCard.tsx
    ├── PostList.tsx
    ├── PostDetail.tsx
    ├── PostForm.tsx
    ├── VoteButtons.tsx
    ├── CommentThread.tsx
    ├── Comment.tsx
    ├── CommentForm.tsx
    ├── SortControls.tsx
    ├── ReportForm.tsx
    ├── ModerationQueue.tsx
    ├── ImageUpload.tsx
    └── MediaGallery.tsx
│
lib/
├── db/
│   ├── schema.ts (add Commons tables)
│   ├── migrations/
│   │   └── NNNN_create_commons_tables.ts
│   └── queries/
│       └── commons.ts
├── validation/
│   └── commons.ts (Zod schemas)
└── actions/
    ├── commons-posts.ts
    ├── commons-comments.ts
    └── commons-votes.ts
│
scripts/
└── seed-commons.ts
```

### C. Environment Variables

No new environment variables required — Commons uses existing infrastructure:

- `DATABASE_URL` (Postgres)
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
- Existing auth system (Auth.js)

### D. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Page Load (P95) | < 2s | Server-rendered, minimal JS |
| API Response (P95) | < 500ms | Indexed queries |
| Vote Action | < 100ms | Optimistic UI |
| Image Upload | < 3s | 5MB limit |
| Lighthouse Score | > 90 | Performance, accessibility |

### E. Success Metrics

**Week 1 Post-Launch:**
- 10+ campfires created
- 50+ posts created
- 100+ comments posted
- 500+ votes cast

**Month 1:**
- 100+ posts per week
- 50+ daily active users
- < 5 moderation actions per week
- 0 critical bugs

### F. References

- [Master Scope](docs/master-scope.md) — NAT vision and principles
- [Vision](docs/vision.md) — Brooks AI HUB product philosophy
- [NAMC README](namc/README.md) — Content conventions
- [Brand Style](docs/brand-style.md) — Design system
- [Existing `/commons` page](app/commons/page.tsx) — Current placeholder
- [NAMC Campfire page](app/NAMC/campfire/page.tsx) — UI inspiration

---

**End of Build Plan**

For questions or clarifications, refer to this document or consult the NAT team.
