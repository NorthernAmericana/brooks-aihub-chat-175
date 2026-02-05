import { NamcStoreClient } from "@/app/store/namc/namc-store-client";
import { listStoreProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const ENABLE_NAMC_PRODUCT_INGESTION = false;

export default async function NamcStorePage() {
  const products = ENABLE_NAMC_PRODUCT_INGESTION
    ? await listStoreProducts()
    : [];

  return (
    <NamcStoreClient
      products={products}
      showProductIngestion={ENABLE_NAMC_PRODUCT_INGESTION}
    />
  );
}
