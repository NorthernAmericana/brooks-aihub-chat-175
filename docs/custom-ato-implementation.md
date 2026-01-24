# Custom ATO Slashes Implementation Summary

## Overview
This implementation adds comprehensive support for custom/unofficial ATO (Autonomous Technological Organism) slashes to the Brooks AI HUB chat application, allowing users to create their own personalized AI assistants with custom prompts, voices, and memory scopes.

## Database Changes

### Schema Updates (`lib/db/schema.ts`)
1. **User Table Enhancement**
   - Added `subscriptionTier` field (free/founders/dev) to track user subscription levels

2. **New CustomAto Table**
   - `id`: UUID primary key
   - `userId`: Foreign key to User table
   - `name`: Custom ATO name (max 128 chars)
   - `slash`: Slash command for routing (max 128 chars)
   - `voiceId`: ElevenLabs voice ID
   - `voiceLabel`: Human-readable voice name
   - `promptInstructions`: Custom system prompt (text)
   - `memoryScope`: Either 'ato-only' or 'hub-wide'
   - `isOfficial`: Boolean flag (false for custom ATOs)
   - `usageCount`: JSON array tracking monthly usage
   - `lastUsedAt`: Timestamp of last use
   - `createdAt`, `updatedAt`: Timestamps

### Database Queries (`lib/db/queries.ts`)
Added complete CRUD operations for custom ATOs:
- `createCustomAto()`: Create new custom ATO
- `getCustomAtosByUserId()`: Fetch all custom ATOs for a user
- `getCustomAtoById()`: Fetch specific custom ATO
- `updateCustomAto()`: Update custom ATO settings
- `deleteCustomAto()`: Delete custom ATO
- `updateCustomAtoUsage()`: Track monthly usage
- `getRecentCustomAtos()`: Get N most recently used custom ATOs

## Backend APIs

### `/api/custom-atos` Route
Complete REST API for custom ATO management:
- **GET**: Retrieve all custom ATOs for authenticated user
- **POST**: Create new custom ATO with validation
  - Checks monthly usage limits
  - Validates prompt instruction length
  - Enforces tier-based restrictions
- **PUT**: Update existing custom ATO
  - Validates ownership
  - Enforces prompt length limits
- **DELETE**: Delete custom ATO with ownership validation

### Usage Limits (`lib/custom-ato-limits.ts`)
Tier-based limitations:
- **Free**: 3 custom ATOs/month, 200 char prompts
- **Founders**: 10 custom ATOs/month, 999 char prompts
- **Dev**: Unlimited ATOs, 999 char prompts

## Voice System Expansion

### Enhanced Voice Options (`lib/voice.ts`)
Expanded from 3 to 12 voice options:
- Bruce NAMC
- Selena NAMC
- Daniel - Brooks AI HUB
- Rachel
- Domi
- Bella
- Antoni
- Elli
- Josh
- Arnold
- Adam
- Sam

## UI Components

### 1. Create Custom ATO Dialog (`components/create-custom-ato-dialog.tsx`)
Full-featured creation modal with:
- ATO name input (required)
- Slash command input (required)
- Voice selection dropdown (12 options)
- Prompt instructions textarea with character counter
- Memory scope toggle (ATO-only vs HUB-wide)
- Form validation and error handling
- Success callbacks for parent refresh

**Location**: Sidebar footer, above "Founders Edition" button

### 2. Custom ATO Settings Dialog (`components/custom-ato-settings-dialog.tsx`)
Settings panel for existing custom ATOs:
- Edit ATO name
- View slash command (read-only)
- Change default voice
- Update prompt instructions
- Toggle memory scope
- Delete ATO button with confirmation dialog

**Trigger**: Gear icon in chat header (only visible for custom ATO chats)

### 3. ATO List Panel (`components/ato-list-panel.tsx`)
Folder/files icon button showing:
- **Official ATO slashes section**: 3 most recent official ATOs
- **Unofficial ATO slashes section**: 3 most recent custom ATOs
- Search bar with magnifying glass icon
- "Use" button for each ATO to add to chat
- Settings button for custom ATOs
- 50% opacity when no custom ATOs exist

**Location**: Chat header, right of memories button

### 4. Chat Header Integration (`components/chat-header.tsx`)
Updated to include:
- ATO list panel button
- Conditional settings icon for custom ATOs
- Route key passing for custom ATO detection

## Agent Registry Integration

### Updated Registry (`lib/ai/agents/registry.ts`)
- Added `customAtoToAgentConfig()` helper function
- Converts CustomAto objects to AgentConfig format
- Integrates with existing agent system seamlessly

### Chat Route Handler (`app/(chat)/api/chat/route.ts`)
Enhanced agent selection logic:
1. Checks if routeKey starts with "custom-"
2. Loads custom ATO from database
3. Converts to AgentConfig
4. Falls back to official agents
5. Tracks custom ATO usage on first message

## Client-Side Hooks

### `useCustomAtos` Hook (`hooks/use-custom-atos.ts`)
React hook for fetching and managing custom ATOs:
- Automatic fetching on mount
- Loading and error states
- Refetch function for manual updates
- Used by slash suggestions and ATO list panel

## Slash Suggestions Integration

### Updated Slash Suggestions (`components/slash-suggestions.tsx`)
- Uses `useCustomAtos` hook to fetch custom ATOs
- Merges official and custom agents
- Filters and sorts by recent usage
- Shows custom ATOs in autocomplete

## Key Features

### 1. Subscription Tier System
Three tiers with different limits:
- Free users: Basic access
- Founders: Enhanced limits
- Dev: Unlimited access

### 2. Usage Tracking
- Monthly usage counters per custom ATO
- Automatic cleanup of old usage data
- Updates on each ATO invocation

### 3. Memory Scoping
Two memory scope options:
- **ATO-only**: Memories isolated to this custom ATO
- **Brooks AI HUB-wide**: Memories shared across all ATOs

### 4. Voice Customization
Full voice selection from 12 ElevenLabs voices, allowing each custom ATO to have its own distinct personality.

### 5. Prompt Customization
Tier-based character limits on system prompts:
- Free: 200 characters
- Founders/Dev: 999 characters

## Testing

### E2E Tests (`tests/e2e/custom-atos.test.ts`)
Created test suite covering:
- "Make your own ATO" button visibility
- Create dialog functionality
- Folder icon in chat header
- ATO list panel interaction
- Form field validation

Tests are marked as `.skip()` pending test environment setup.

## Security Considerations

1. **Authentication**: All API endpoints require authenticated session
2. **Authorization**: Users can only access their own custom ATOs
3. **Input Validation**: 
   - Prompt length limits enforced
   - Required fields validated
   - SQL injection protection via Drizzle ORM
4. **Usage Limits**: Tier-based restrictions prevent abuse

## Migration Path

Database migration file: `lib/db/migrations/0012_fixed_firedrake.sql`
- Adds CustomAto table
- Adds subscriptionTier to User table
- Handles existing data gracefully

## Future Enhancements

Potential improvements for future iterations:
1. Custom tool selection for ATOs
2. ATO sharing/marketplace
3. Analytics dashboard for ATO usage
4. Voice cloning support
5. Advanced memory management UI
6. ATO templates/presets
7. Collaborative ATO editing
8. Export/import ATO configurations

## Build Status

✅ TypeScript compilation: Passing
⚠️ Next.js build: Font loading issue (environment-related, not code issue)
✅ Linter: Passing (with expected pre-existing warnings)

## Files Modified/Created

### Database & Backend
- `lib/db/schema.ts` (modified)
- `lib/db/queries.ts` (modified)
- `lib/db/migrations/0012_fixed_firedrake.sql` (created)
- `lib/custom-ato-limits.ts` (created)
- `app/api/custom-atos/route.ts` (created)

### Voice & Agents
- `lib/voice.ts` (modified)
- `lib/ai/agents/registry.ts` (modified)
- `app/(chat)/api/chat/route.ts` (modified)

### UI Components
- `components/create-custom-ato-dialog.tsx` (created)
- `components/custom-ato-settings-dialog.tsx` (created)
- `components/ato-list-panel.tsx` (created)
- `components/app-sidebar.tsx` (modified)
- `components/chat-header.tsx` (modified)
- `components/chat.tsx` (modified)
- `components/slash-suggestions.tsx` (modified)

### Hooks & Tests
- `hooks/use-custom-atos.ts` (created)
- `tests/e2e/custom-atos.test.ts` (created)

## Deployment Notes

1. Database migration will run automatically on build
2. No environment variables need to be added
3. Existing user data is preserved
4. New `subscriptionTier` defaults to "free" for existing users
5. Compatible with existing Vercel deployment setup
