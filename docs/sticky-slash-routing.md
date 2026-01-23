# Sticky Slash Routing Implementation

## Overview
This document describes the implementation of sticky slash routing per conversation, which ensures that each chat maintains its agent selection throughout the conversation.

## Architecture Changes

### 1. Database Schema
- Added `routeKey` field to the `Chat` table
- Migration: `0011_famous_silhouette.sql`
- The field stores the agent ID (e.g., "namc", "brooks-ai-hub", "nat") for each chat

### 2. Backend Changes

#### Database Layer (`lib/db/queries.ts`)
- Updated `saveChat()` to accept and store `routeKey`
- Added `updateChatRouteKey()` function for updating route keys
- The routeKey is determined from the first message's slash trigger

#### Chat API (`app/(chat)/api/chat/route.ts`)
- Modified POST handler to extract slash trigger from initial message
- Stores the agent ID in `chat.routeKey` during chat creation
- Agent selection now prioritizes `chat.routeKey` over message-level slash triggers
- Falls back to parsing slash from messages only for new/unmigrated chats

#### Title Generation (`app/(chat)/actions.ts`)
- Updated `generateTitleFromUserMessage()` to prefix titles with route (e.g., `/NAMC/ Title`)
- Maintains backward compatibility with existing voice selection logic

### 3. Voice Selection Updates

#### Voice Library (`lib/voice.ts`)
- Added `getChatRouteKey()` - prefers `chat.routeKey`, falls back to title parsing
- Added `isChatNamcRoute()` - checks route using persisted field
- Maintains backward compatibility with `getRouteKey()` for title-only contexts

#### Components
- `voice-settings-panel.tsx` - Uses `getChatRouteKey()` and `isChatNamcRoute()`
- `sidebar-history-item.tsx` - Uses `getChatRouteKey()` for route determination

### 4. Frontend UI Components

#### Slash Suggestions (`components/slash-suggestions.tsx`)
- Displays when user types "/" in the input
- Shows 3 suggested routes based on recent usage
- Includes search functionality to filter available routes
- Keyboard navigation support (Escape to close, Enter to select first)

#### Route Change Modal (`components/route-change-modal.tsx`)
- Triggers when user attempts to change routes mid-conversation
- Provides clear explanation of current vs. new route
- Options to stay in current route or start new chat
- Optionally carries over the draft message to the new chat

#### Multimodal Input (`components/multimodal-input.tsx`)
- Integrated slash suggestions dropdown
- Route change detection in `submitForm()`
- Compares attempted route with `chatRouteKey`
- Blocks message send and shows modal if routes differ
- Only applies to chats with existing messages and persisted routes

#### Chat Component (`components/chat.tsx`)
- Accepts `initialRouteKey` prop
- Passes `chatRouteKey` to MultimodalInput for validation

#### Chat Page (`app/(chat)/chat/[id]/page.tsx`)
- Provides `chat.routeKey` to Chat component

## User Experience Flow

### Starting a New Chat
1. User types a message starting with `/NAMC/` or similar
2. System extracts the slash trigger and determines agent ID
3. Chat is created with the agent ID stored in `routeKey`
4. Title is generated with route prefix (e.g., "/NAMC/ Music Discussion")
5. All subsequent messages in this chat use the NAMC agent

### Typing Slash Commands
1. User types "/" in the input field
2. Slash suggestions dropdown appears above the input
3. Shows 3 most relevant routes (based on recent usage and search)
4. User can search for specific routes or select from suggestions
5. Selecting a route populates the input with the formatted slash (e.g., "/NAMC/ ")

### Attempting to Change Routes
1. User has an existing conversation with `/NAMC/`
2. User types a message starting with `/BrooksBears/`
3. System detects route mismatch before sending
4. Modal appears explaining the situation
5. User can either:
   - Cancel and stay in current `/NAMC/` chat
   - Confirm and start a new chat with `/BrooksBears/`

### Voice Settings
1. Voice settings panel filters to show only NAMC chats
2. Uses `chat.routeKey` to determine available voices
3. Falls back to title parsing for unmigrated chats
4. Maintains per-chat voice preferences

## Backward Compatibility

### Existing Chats
- Chats created before this update have `routeKey = null`
- System falls back to parsing slash from title
- Voice selection continues to work via title parsing
- Agent selection uses existing title-based logic

### Migration Path
- No forced migration required
- New chats automatically get `routeKey` populated
- Existing chats can be optionally migrated by:
  1. Parsing route from title
  2. Updating `routeKey` field
  3. Re-formatting title if needed

## Configuration

### Agent Registry (`lib/ai/agents/registry.ts`)
- Defines available agents and their slash triggers
- Each agent has: `id`, `label`, `slash`, `tools`, `systemPromptOverride`
- Default agent is "brooks-ai-hub"

### Supported Routes
- `/Brooks AI HUB/` - Main curator and router
- `/NAMC/` - Media curator for NAMC content
- `/NAT/` - NAT strategy and business
- `/BrooksBears/` - Companion experience
- `/MyCarMindATO/` - Driving intelligence
- `/MyFlowerAI/` - Cannabis journaling

## Testing Checklist

### New Chat Creation
- [ ] Start chat with `/NAMC/` - verify NAMC agent is used
- [ ] Start chat without slash - verify default agent
- [ ] Check database for correct `routeKey` value
- [ ] Verify title includes route prefix

### Route Persistence
- [ ] Send multiple messages in NAMC chat
- [ ] Verify all responses come from NAMC agent
- [ ] Refresh page and send message
- [ ] Verify agent remains NAMC

### Route Change Detection
- [ ] Try typing `/BrooksBears/` in NAMC chat
- [ ] Verify modal appears before sending
- [ ] Cancel - message should not send
- [ ] Confirm - new chat should be created
- [ ] Verify draft message carries over (optional)

### Slash Suggestions UI
- [ ] Type "/" in empty input
- [ ] Verify dropdown appears with 3 suggestions
- [ ] Verify search input is functional
- [ ] Type "namc" in search - verify filtering works
- [ ] Press Escape - verify dropdown closes
- [ ] Select a route - verify input populates correctly

### Voice Settings
- [ ] Create NAMC chat with `/NAMC/`
- [ ] Open voice settings
- [ ] Verify chat appears in voice settings
- [ ] Select different voice
- [ ] Verify voice persists across sessions
- [ ] Create non-NAMC chat
- [ ] Verify it doesn't appear in voice settings

## Known Limitations

1. **Title Dependency**: Voice selection still partially depends on title format for backward compatibility. Future iterations should eliminate this dependency entirely.

2. **Manual Route Changes**: There's no UI to manually change a chat's route after creation. Users must start a new chat.

3. **Route Suggestions**: Recent usage tracking is client-side only (localStorage). Could be enhanced with server-side tracking for better cross-device experience.

4. **Default Route**: Chats without explicit slash default to "brooks-ai-hub". This behavior could be made configurable.

## Future Enhancements

1. **Server-side Route Tracking**: Track route usage in database for better suggestions
2. **Route History**: Show route history within a chat
3. **Route Templates**: Allow users to create custom route shortcuts
4. **Multi-Agent Conversations**: Support switching agents within a conversation with clear boundaries
5. **Route Analytics**: Track which routes are most used, conversion rates, etc.
6. **Route Permissions**: Implement user/role-based route access control
7. **Route Aliases**: Support multiple slash triggers for the same agent

## Maintenance Notes

### Adding New Routes
1. Update `lib/ai/agents/registry.ts` with new agent config
2. Add system prompt if needed
3. Define tools the agent can use
4. No database changes needed - system will automatically pick up new routes

### Debugging Route Issues
1. Check `chat.routeKey` in database
2. Verify agent config exists in registry
3. Check browser localStorage for recent slash actions
4. Review chat title format for backward compatibility
5. Check browser console for routing errors

### Database Queries
```sql
-- Find all chats by route
SELECT * FROM "Chat" WHERE "routeKey" = 'namc';

-- Update route for a chat
UPDATE "Chat" SET "routeKey" = 'namc' WHERE id = 'chat-uuid';

-- Find chats without route (pre-migration)
SELECT * FROM "Chat" WHERE "routeKey" IS NULL;

-- Count chats by route
SELECT "routeKey", COUNT(*) FROM "Chat" GROUP BY "routeKey";
```
