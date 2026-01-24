# Custom ATO Slashes Implementation Summary

## Overview
This implementation adds support for custom/unofficial ATO (AI Task Operator) slashes in the Brooks AI HUB chat application. Users can now create their own personalized ATOs with custom names, voices, prompts, and memory scopes.

## Features Implemented

### 1. Database Schema
- **User Table Extensions**:
  - `isFounder`: Boolean flag for Founders Edition access
  - `customAtoCount`: JSON field tracking monthly usage `{month: string, count: number}`

- **CustomAgent Table** (new):
  - `id`: UUID primary key
  - `userId`: Reference to User
  - `name`: ATO display name
  - `slash`: URL-safe slash identifier
  - `systemPrompt`: Custom instructions (up to 500/999 chars)
  - `defaultVoiceId`: ElevenLabs voice ID
  - `defaultVoiceLabel`: Voice display name
  - `memoryScope`: "ato-only" or "hub-wide"
  - `tools`: JSON array of enabled tools
  - `isActive`: Soft delete flag
  - `lastUsedAt`: Timestamp for sorting

### 2. API Endpoints

#### `/api/custom-agents`
- **GET**: List user's custom agents with usage limits
- **POST**: Create new custom agent (enforces limits)
- **PATCH**: Update existing custom agent
- **DELETE**: Soft-delete custom agent

#### `/api/agents-list`
- **GET**: Returns all agents (official + custom) for slash suggestions

### 3. Access Limits
- **Default Users**: 3 custom ATOs per month, 500 char prompts
- **Founders Edition**: 10 custom ATOs per month, 999 char prompts
- **Dev Mode**: Unlimited custom ATOs, unlimited prompt length

### 4. UI Components

#### `CreateCustomAtoModal`
- Form for creating new custom ATOs
- Fields: name, slash, voice selection, prompt, memory scope
- Real-time character count and limit display
- Accessible from sidebar button

#### `CustomAtoSettingsPanel`
- Settings page section for managing custom ATOs
- Edit and delete functionality
- Deep-linking support (`/settings?agentId=xxx`)
- Usage statistics display

#### `AtoBrowser`
- Folder icon in chat header
- Shows official and unofficial ATOs
- Search functionality
- Quick access to 3 most recent ATOs
- Settings button for custom ATOs
- 50% opacity when no custom ATOs exist

### 5. Voice System
- Extended voice list in `lib/voice.ts`
- Includes: Daniel (Brooks AI HUB), Bruce/Selena (NAMC), and 9 additional voices
- Full voice picker in custom ATO creation/editing

### 6. Integration Points

#### Agent Registry (`lib/ai/agents/registry.ts`)
- Synchronous functions for client-side: `getAgentConfigByIdSync()`, `getAgentConfigBySlashSync()`
- Asynchronous functions for server-side: `listAgentConfigsWithCustom()`, `getAgentConfigById()`, `getAgentConfigBySlash()`
- Proper client/server separation to avoid build issues

#### Custom Loader (`lib/ai/agents/custom-loader.ts`)
- Server-only module for loading custom agents from database
- Marked with `"server-only"` directive
- Used by async registry functions

#### Chat Routing (`app/(chat)/api/chat/route.ts`)
- Updated to await async agent lookup
- Checks persisted `routeKey` first, then slash in message
- Falls back to default agent

#### Sidebar (`components/app-sidebar.tsx`)
- "Make your own ATO /../" button above Founders Edition
- Opens creation modal
- Shows success toast with usage instructions

#### Chat Header (`components/chat-header.tsx`)
- Folder icon for ATO browser
- Positioned after Memories button
- Always visible (50% opacity if no custom ATOs)

### 7. Memory Scope
- **ATO-only**: Memories saved specifically for this custom ATO
- **Brooks AI HUB-wide**: Memories shared across all ATOs
- Stored in CustomAgent.memoryScope field
- Used by memory system (schema already supports agentId/agentLabel)

## File Structure
```
app/
  api/
    custom-agents/route.ts         # CRUD endpoints
    agents-list/route.ts            # List all agents
  (chat)/
    api/chat/route.ts               # Updated routing
    settings/page.tsx               # Added custom ATO settings
components/
  create-custom-ato-modal.tsx       # Creation modal
  custom-ato-settings-panel.tsx     # Settings management
  ato-browser.tsx                   # Browser panel
  app-sidebar.tsx                   # Updated with button
  chat-header.tsx                   # Updated with folder icon
  slash-suggestions.tsx             # Updated for custom agents
lib/
  ai/agents/
    registry.ts                     # Updated with sync/async functions
    custom-loader.ts                # Server-only custom agent loader
  db/
    schema.ts                       # Updated schema
    queries.ts                      # New custom agent queries
  voice.ts                          # Extended voice list
```

## Usage Flow

### Creating a Custom ATO
1. User clicks "Make your own ATO /../" in sidebar
2. Modal opens with creation form
3. User enters:
   - Name (e.g., "My Research Assistant")
   - Slash (e.g., "research")
   - Voice selection
   - Prompt instructions (with character limit)
   - Memory scope
4. System checks limits
5. ATO created and ready to use as `/research/`

### Using a Custom ATO
1. In chat, type `/research/` at start of message
2. System routes to custom ATO
3. Custom prompt, voice, and memory scope apply
4. Settings cog available in chat for quick edits

### Managing Custom ATOs
1. Navigate to Settings page
2. View all custom ATOs with usage stats
3. Click settings icon to edit
4. Click trash icon to delete (soft delete)
5. Deep link directly from ATO browser

## Technical Notes

### Client/Server Separation
- Client components use synchronous registry functions (official agents only)
- Server components use asynchronous functions (includes custom agents)
- Custom agent loading is server-only with "server-only" directive
- API endpoints provide custom agents to client via fetch

### Caching Strategy
- No caching implemented in initial version
- Each request loads fresh from database
- Future: Add Redis caching layer for custom agents

### Security
- All endpoints require authentication
- User can only access/modify their own custom ATOs
- Slash names sanitized (lowercase, alphanumeric + hyphens only)
- Prompt length strictly enforced based on user tier

## Testing Recommendations

1. **Access Limits**:
   - Test monthly reset logic
   - Verify dev mode bypass
   - Check Founders Edition limits

2. **UI Flow**:
   - Create, edit, delete custom ATOs
   - Use custom ATO in chat
   - Search in ATO browser
   - Settings deep-linking

3. **Edge Cases**:
   - Duplicate slash names
   - Very long prompts
   - Network errors during creation
   - Custom ATO with same slash as official

4. **Memory Scope**:
   - Verify ATO-only memories don't leak
   - Test hub-wide memory sharing

## Future Enhancements
- Import/export custom ATOs
- Share custom ATOs with other users
- ATO marketplace
- Analytics dashboard for ATO usage
- Custom tool selection per ATO
- ATO templates/presets
