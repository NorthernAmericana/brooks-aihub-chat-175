export type SessionVisibility = "public" | "private";

export type SessionType = "chat" | "video-call";

export type Session = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: SessionVisibility;
  routeKey: string | null;
  sessionType: SessionType;
  ttsEnabled: boolean | null;
  ttsVoiceId: string | null;
  ttsVoiceLabel: string | null;
};
