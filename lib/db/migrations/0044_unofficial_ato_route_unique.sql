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

-- Resolve collisions created by normalization by keeping the oldest claim.
UPDATE "UnofficialAto" AS dup
SET "route" = NULL
FROM (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "route"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS "rowNumber"
  FROM "UnofficialAto"
  WHERE "route" IS NOT NULL
) AS ranked
WHERE dup."id" = ranked."id"
  AND ranked."rowNumber" > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "UnofficialAto_route_unique_idx"
  ON "UnofficialAto" ("route")
  WHERE "route" IS NOT NULL;
