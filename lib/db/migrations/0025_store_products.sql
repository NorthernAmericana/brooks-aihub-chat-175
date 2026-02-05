CREATE TABLE "store_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" varchar(32) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "price" integer NOT NULL,
  "image_url" text,
  "external_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "store_products" ("type", "title", "description", "price", "image_url", "external_url")
VALUES
  (
    'merch',
    'NAMC Signature Tee',
    'Premium cotton tee featuring the official NAMC insignia.',
    3200,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&auto=format&fit=crop&q=80',
    'https://northernamericana.com/products/namc-signature-tee'
  ),
  (
    'digital_media',
    'NAMC Story Pack Vol. 1',
    'Digital lore bundle with timelines, world notes, and starter media.',
    1200,
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80',
    NULL
  ),
  (
    'digital_code',
    'NAMC Founder Access Code',
    'One-time code for exclusive drops and behind-the-scenes collections.',
    2500,
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&auto=format&fit=crop&q=80',
    NULL
  );
