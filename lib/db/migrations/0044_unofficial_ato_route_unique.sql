UPDATE "UnofficialAto"
SET "route" = NULLIF(
  lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(btrim("route", '/ '), '\\s+', '', 'g'),
        '/{2,}',
        '/',
        'g'
      ),
      '[^a-zA-Z0-9/_-]',
      '',
      'g'
    )
  ),
  ''
)
WHERE "route" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "UnofficialAto_route_unique_idx"
  ON "UnofficialAto" ("route")
  WHERE "route" IS NOT NULL;
