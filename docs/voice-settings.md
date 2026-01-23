# Voice Settings and TTS Playback System

## Overview
This document describes the voice settings and text-to-speech (TTS) playback system implemented in the Brooks AI Hub chat application.

## Features

### 1. Route-Based Default Voices
- **NAMC Route** (`/NAMC/`): Defaults to **Bruce NAMC** voice
  - Alternative option: **Selena NAMC**
  - Voice IDs:
    - Bruce NAMC: `By89qnNqll35EKDmc3Hm`
    - Selena NAMC: `7fJYplvotvPf1yl7PLLP`
- **All Other Routes**: Default to **Daniel - Brooks AI HUB** voice
  - Voice ID: `QOXGBQZ2d1ykGdEdFlgp`

### 2. Per-Chat Voice Settings
- Each chat session maintains its own voice settings
- Settings include:
  - `ttsEnabled`: Whether TTS is enabled for this chat (default: true)
  - `ttsVoiceId`: The ElevenLabs voice ID to use
  - `ttsVoiceLabel`: Human-readable voice name
- Settings are persisted in the database and apply across sessions

### 3. Smooth TTS Playback
- Audio is fully buffered before playback to prevent stuttering
- Pressing the speaker button while audio is playing stops the current audio and restarts
- No duplicate audio streams can play simultaneously

### 4. Searchable Voice Selector
- Voice selector component with built-in search functionality
- Search box appears automatically when more than 3 voice options are available
- Currently shows all available voices for the route

## Architecture

### Database Schema
The `Chat` table includes the following TTS-related fields:
```typescript
{
  routeKey: text("routeKey"),           // Agent route (e.g., "namc", "default")
  ttsEnabled: boolean("ttsEnabled").default(true),
  ttsVoiceId: text("ttsVoiceId"),      // ElevenLabs voice ID
  ttsVoiceLabel: text("ttsVoiceLabel"), // Human-readable voice name
}
```

### Key Components

#### 1. Voice Configuration (`lib/voice.ts`)
Defines available voices and route-specific defaults:
- `getDefaultVoice(routeKey)`: Returns default voice for a route
- `getVoiceOptions(routeKey)`: Returns available voices for a route
- `getChatRouteKey(chat)`: Gets route key from chat (prefers persisted value)

#### 2. Voice Settings Panel (`components/voice-settings-panel.tsx`)
User interface for managing voice settings:
- Lists all user's chats with their voice configurations
- Shows route-specific defaults
- Allows enabling/disabling TTS per chat
- Voice selector with search (when > 3 options)

#### 3. Voice Selector (`components/voice-selector.tsx`)
Reusable component for voice selection:
- Searchable dropdown using Command component
- Shows default voice indicator
- Auto-hides search when ≤ 3 options

#### 4. Message Actions (`components/message-actions.tsx`)
Handles TTS playback from chat messages:
- Fetches chat settings to determine voice
- Buffers audio before playback
- Prevents duplicate playback
- Manages audio lifecycle

### API Endpoints

#### GET `/api/chat-settings?chatId=<id>`
Retrieves voice settings for a chat:
```json
{
  "ttsEnabled": true,
  "ttsVoiceId": "By89qnNqll35EKDmc3Hm",
  "ttsVoiceLabel": "Bruce NAMC"
}
```

#### PATCH `/api/chat-settings`
Updates voice settings for a chat:
```json
{
  "chatId": "uuid",
  "ttsEnabled": true,
  "ttsVoiceId": "By89qnNqll35EKDmc3Hm",
  "ttsVoiceLabel": "Bruce NAMC"
}
```

#### POST `/api/tts/elevenlabs`
Generates speech from text:
```json
{
  "text": "Message to speak",
  "voiceId": "By89qnNqll35EKDmc3Hm"
}
```

## User Flow

### Creating a New Chat
1. User sends first message with route (e.g., `/NAMC/ Hello`)
2. System extracts route key from message
3. Default voice for route is automatically set
4. Chat is created with:
   - `routeKey`: "namc"
   - `ttsEnabled`: true
   - `ttsVoiceId`: "By89qnNqll35EKDmc3Hm" (Bruce NAMC)
   - `ttsVoiceLabel`: "Bruce NAMC"

### Playing TTS
1. User clicks speaker icon on a message
2. System fetches chat settings to get voice configuration
3. If TTS is disabled, shows error message
4. If enabled:
   - Stops any currently playing audio
   - Sends text + voiceId to TTS API
   - Buffers audio completely
   - Plays audio smoothly without stuttering

### Changing Voice Settings
1. User navigates to Settings page
2. Sees list of all chats with their voice configurations
3. Can toggle TTS on/off per chat
4. Can select different voice from available options
5. Changes are immediately saved to database
6. Next TTS playback uses new settings

## Implementation Details

### Audio Buffering
```typescript
// Wait for audio to be fully buffered
await new Promise<void>((resolve, reject) => {
  audio.addEventListener("canplaythrough", () => resolve(), {
    once: true,
  });
  audio.addEventListener("error", () => {
    reject(new Error("Audio load failed"));
  });
  audio.load();
});
```

### Preventing Duplicate Playback
```typescript
// Track currently playing audio
const currentAudioRef = useRef<{
  audio: HTMLAudioElement;
  url: string;
} | null>(null);

// Stop current audio before starting new playback
if (currentAudioRef.current) {
  const { audio, url } = currentAudioRef.current;
  audio.pause();
  audio.currentTime = 0;
  URL.revokeObjectURL(url);
  currentAudioRef.current = null;
}
```

## Future Enhancements
- Add more voice options for different routes
- Support voice previews before selection
- Add voice speed/pitch controls
- Support language-specific voices
- Add voice cloning capabilities

## Testing
To test voice settings:
1. Create a chat with `/NAMC/` route - should default to Bruce NAMC
2. Create a chat without route prefix - should default to Daniel
3. Go to Settings and verify voice options match route
4. Change voice and verify it persists
5. Click speaker button multiple times rapidly - should restart audio, not overlap
6. Disable TTS for a chat - speaker button should show error message
