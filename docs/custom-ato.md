# Custom ATO Slashes

Custom ATO (AI Task Organizer) slashes allow users to create their own specialized AI assistants within Brooks AI HUB with personalized settings and behaviors.

## Overview

Custom ATOs extend the official slash-based routing system (e.g., `/NAMC/`, `/BrooksBears/`) by allowing users to create their own custom routes with unique configurations.

## Features

### User Limits

- **Regular Users**: 3 custom ATOs per month, 500 character prompt limit
- **Founders Edition**: 10 custom ATOs per month, 999 character prompt limit
- **Development Mode**: Unlimited custom ATOs (bypasses monthly limits)

### ATO Configuration

Each custom ATO includes:

1. **Name**: Display name for the ATO
2. **Slash Route**: URL-friendly route name (e.g., "MyCustomATO" becomes `/MyCustomATO/`)
3. **Default Voice**: Select from available TTS voices (Bruce NAMC, Selena NAMC, Daniel - Brooks AI HUB)
4. **Prompt Instructions**: Custom system prompt to define the ATO's personality and behavior
5. **Memory Scope**: Choose between ATO-only or Brooks AI HUB-wide memory access

## User Interface

### Creating a Custom ATO

1. Click the **"Make your own ATO /../"** button in the sidebar (positioned above Founders Edition)
2. Fill in the ATO details in the dialog:
   - Enter a name for your ATO
   - Choose a unique slash route
   - Select a default voice
   - Write prompt instructions (up to limit based on your account type)
   - Choose memory scope (ATO-only or hub-wide)
3. Click "Create ATO" to save

### Browsing ATOs

Click the **folder icon** next to the Memories button in the chat header to open the ATO browser:

- **Official ATO Slashes**: Shows the 3 most recently used official ATOs
- **Unofficial ATO Slashes**: Shows the 3 most recently used custom ATOs
- Use the search bar to filter ATOs by name or slash route
- Click an ATO to start a new chat with it
- Click the settings icon next to a custom ATO to edit its configuration

**Note**: The folder icon displays at 50% opacity when no custom ATOs exist.

### Editing Custom ATOs

1. Open the ATO browser (folder icon in chat header)
2. Click the settings (cog) icon next to the custom ATO you want to edit
3. Modify the ATO settings
4. Click "Update ATO" to save changes

## API Endpoints

### GET `/api/custom-ato`

Fetch all custom ATOs for the authenticated user.

**Response**: Array of custom ATO objects

```json
[
  {
    "id": "uuid",
    "name": "My Custom Assistant",
    "slashRoute": "MyCustomATO",
    "voiceId": "QOXGBQZ2d1ykGdEdFlgp",
    "voiceLabel": "Daniel - Brooks AI HUB",
    "promptInstructions": "You are a helpful assistant...",
    "memoryScope": "ato-only",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastUsedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### POST `/api/custom-ato`

Create a new custom ATO.

**Request Body**:

```json
{
  "name": "My Custom Assistant",
  "slashRoute": "MyCustomATO",
  "voiceId": "QOXGBQZ2d1ykGdEdFlgp",
  "voiceLabel": "Daniel - Brooks AI HUB",
  "promptInstructions": "You are a helpful assistant...",
  "memoryScope": "ato-only"
}
```

**Validation**:
- Checks monthly usage limits (3 for regular, 10 for Founders)
- Validates prompt instructions length (500 or 999 characters)
- Development mode bypasses limits

**Response**: Created custom ATO object (201) or error (400, 429, 500)

### PATCH `/api/custom-ato`

Update an existing custom ATO.

**Request Body**:

```json
{
  "id": "uuid",
  "name": "Updated Name",
  "voiceId": "new-voice-id",
  "voiceLabel": "New Voice",
  "promptInstructions": "Updated instructions...",
  "memoryScope": "hub-wide"
}
```

**Response**: Updated custom ATO object or error

### DELETE `/api/custom-ato?id={id}`

Delete a custom ATO.

**Query Parameters**:
- `id`: UUID of the custom ATO to delete

**Response**: `{ "success": true }` or error

## Database Schema

### `CustomAto` Table

```typescript
{
  id: uuid,                       // Primary key
  createdAt: timestamp,           // Creation timestamp
  updatedAt: timestamp,           // Last update timestamp
  lastUsedAt: timestamp,          // Last time ATO was used in chat
  userId: uuid,                   // Foreign key to User
  name: string,                   // Display name
  slashRoute: string,             // URL route name
  voiceId: string,                // ElevenLabs voice ID
  voiceLabel: string,             // Voice display name
  promptInstructions: text,       // Custom system prompt
  memoryScope: enum,              // "ato-only" | "hub-wide"
  isOfficial: boolean             // Reserved for official ATOs
}
```

### `User` Table Extension

Added `isFounder` boolean field to track Founders Edition status.

## Integration

### Agent Registry

Custom ATOs are integrated into the agent routing system via `custom-ato-registry.ts`:

- `customAtoToAgentConfig()`: Converts custom ATO to AgentConfig
- `getAgentConfigBySlashWithCustom()`: Looks up agent by slash (official or custom)
- `getAgentConfigByIdWithCustom()`: Looks up agent by ID (official or custom)

### Chat Routing

The chat API (`/api/chat/route.ts`) automatically:
1. Detects slash triggers in user messages
2. Loads matching custom ATOs for the user
3. Falls back to official agents if no custom match
4. Tracks `lastUsedAt` when a custom ATO is used

### Memory Scope

- **ATO-only**: Memories are filtered to only those tagged with the specific ATO's route
- **Hub-wide**: Memories from all routes are available to the ATO

## Development

### Running Tests

```bash
npm test
```

E2E tests are located in `tests/e2e/custom-ato.test.ts` and cover:
- Custom ATO button visibility
- Dialog functionality
- ATO browser functionality

### Environment Variables

No additional environment variables are required. Development mode is automatically detected via `NODE_ENV=development`.

## Troubleshooting

### Monthly limit reached

**Error**: `Monthly limit reached. You can create up to X custom ATOs per month.`

**Solution**: 
- Wait for the next month to reset the counter
- Upgrade to Founders Edition for higher limits
- Use development mode for unlimited creation

### Prompt instructions too long

**Error**: `Prompt instructions exceed maximum length of X characters`

**Solution**:
- Shorten your prompt instructions
- Upgrade to Founders Edition for 999 character limit

### Custom ATO not appearing in chat

**Troubleshooting**:
1. Verify the ATO was created successfully (check API response)
2. Refresh the browser
3. Check that you're using the correct slash route (e.g., `/MyCustomATO/`)
4. Ensure you're logged in as the user who created the ATO

## Future Enhancements

Potential future features:
- ATO sharing and marketplace
- Advanced tool permissions per ATO
- Custom voice training integration
- Analytics and usage tracking per ATO
- Template library for common ATO types
