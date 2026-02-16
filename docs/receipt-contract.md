# Receipt Contract (v0)

This document defines the shared receipt event contract used by **Main** and **Console** clients.

## Compatibility expectations

- Both clients must treat receipts as **immutable append-only events**.
- A stored receipt must not be changed in place.
- If a correction is needed, emit a new receipt and set `supersedesReceiptId` to the original receipt ID.
- Clients must be tolerant of unknown future fields and should read only fields they depend on.

## Schema versioning

- Current version: `schemaVersion: "0"`.
- Parsers branch by `schemaVersion`, so newer versions can be introduced without breaking v0 consumers.
- Main and Console should reject unknown versions with a clear error and avoid partial writes.

## Required v0 fields

- `schemaVersion`
- `receiptId`
- `sessionId`
- `turnId`
- `timestamp` (ISO-8601 with timezone offset)
- `actor`
- `action`
- `inputs`
- `outputs`
- `policyDecision`
- `sourceRefs`

## Client behavior

- **Main** should produce receipts following v0 and only issue corrections as follow-up events.
- **Console** should validate receipts at ingest and display correction chains using `supersedesReceiptId`.
