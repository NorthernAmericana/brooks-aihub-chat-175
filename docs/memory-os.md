# Memory OS Schema

## Memory record fields

Each memory record represents a normalized, addressable unit of knowledge. The canonical record shape is:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string (UUID) | Unique identifier for the memory record. |
| `source_type` | string enum | Origin of the memory (e.g., `chat`, `document`, `file`, `web`, `integration`, `manual`). |
| `source_uri` | string | Stable URI or locator for the original source (URL, file URI, database key, etc.). |
| `owner_id` | string | User identifier that owns the memory. |
| `org_id` | string | Organization identifier that scopes the memory. |
| `product_id` | string | Product identifier for multi-product isolation. |
| `created_at` | string (ISO 8601) | Creation timestamp of the memory record. |
| `updated_at` | string (ISO 8601) | Last update timestamp of the memory record. |
| `tags` | string[] | Optional classification labels. |
| `raw_text` | string | Original content captured verbatim from the source. |
| `normalized_text` | string | Normalized/cleaned content used for indexing and retrieval. |
| `embeddings_ref` | string \| null | Reference to embeddings storage (vector DB key or blob handle). |

## Access control rules

Memory access is governed by a hierarchy of scopes. Access checks must pass all applicable scopes.

1. **User scope (owner)**
   - Read/write is permitted when `owner_id` matches the authenticated user.
   - Users cannot access records owned by other users unless an explicit org-level grant exists.
2. **Org scope**
   - `org_id` must match the authenticated organization context.
   - Org admins can read/write all records in the org unless restricted by product scope.
3. **Product scope**
   - `product_id` must match the active product context for the request.
   - Cross-product access is forbidden even within the same org unless an explicit allowlist exists.

## Ingestion contract

### Payload shape

```json
{
  "records": [
    {
      "id": "optional-uuid",
      "source_type": "chat",
      "source_uri": "chat://conversation/123#message/456",
      "owner_id": "user_123",
      "org_id": "org_456",
      "product_id": "product_789",
      "created_at": "2024-02-25T18:05:00.000Z",
      "updated_at": "2024-02-25T18:05:00.000Z",
      "tags": ["support", "priority"],
      "raw_text": "Raw transcript text...",
      "normalized_text": "normalized transcript text...",
      "embeddings_ref": "vecdb:memories/uuid"
    }
  ]
}
```

### Required metadata

The ingestion layer must supply the following fields for each record:

- `source_type`
- `source_uri`
- `owner_id`
- `org_id`
- `product_id`
- `raw_text`

`tags`, `normalized_text`, `embeddings_ref`, `id`, `created_at`, and `updated_at` are optional at ingestion time. If omitted, the ingestion pipeline will generate or compute them.

### Size limits

- Maximum `raw_text` length: **50,000 characters** per record.
- Maximum `normalized_text` length: **50,000 characters** per record.
- Maximum tags: **25** entries; each tag must be **<= 64** characters.
- Maximum batch size: **100 records** per request.
- Maximum payload size: **512 KB** (JSON-encoded).

Violating limits should return a `413 Payload Too Large` error with a structured message describing the failed constraint(s).
