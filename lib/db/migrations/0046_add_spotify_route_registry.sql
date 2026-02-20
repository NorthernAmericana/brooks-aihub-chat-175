INSERT INTO "RouteRegistry" ("id", "label", "slash", "description")
VALUES (
  'spotify',
  'Spotify',
  'Spotify',
  'Chat-first Spotify taste assistant with compact playback controls.'
)
ON CONFLICT ("id") DO UPDATE
SET
  "label" = EXCLUDED."label",
  "slash" = EXCLUDED."slash",
  "description" = EXCLUDED."description";
