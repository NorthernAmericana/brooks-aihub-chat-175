CREATE TABLE "RouteRegistry" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "slash" text NOT NULL,
  "description" text
);

INSERT INTO "RouteRegistry" ("id", "label", "slash")
VALUES
  ('brooks-ai-hub', 'Brooks AI HUB', 'Brooks AI HUB'),
  ('nat', 'Northern Americana Tech', 'NAT'),
  ('brooks-bears', 'BrooksBears', 'BrooksBears'),
  ('brooks-bears-benjamin', 'Benjamin Bear', 'BrooksBears/BenjaminBear'),
  ('my-car-mind', 'MyCarMindATO', 'MyCarMindATO'),
  ('my-car-mind-driver', 'MyCarMindATO Driver', 'MyCarMindATO/Driver'),
  ('my-car-mind-trucker', 'MyCarMindATO Trucker', 'MyCarMindATO/Trucker'),
  ('my-car-mind-delivery-driver', 'MyCarMindATO Delivery Driver', 'MyCarMindATO/DeliveryDriver'),
  ('my-car-mind-traveler', 'MyCarMindATO Traveler', 'MyCarMindATO/Traveler'),
  ('my-flower-ai', 'MyFlowerAI', 'MyFlowerAI'),
  ('brooks-ai-hub-summaries', 'Brooks AI HUB Summaries', 'Brooks AI HUB/Summaries'),
  ('namc', 'NAMC AI Media Curator', 'NAMC'),
  ('namc-lore-playground', 'NAMC Lore Playground', 'NAMC/Lore-Playground'),
  ('default', 'Default', 'default');
