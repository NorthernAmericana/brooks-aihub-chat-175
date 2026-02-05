import { NamcStoreClient } from "@/app/store/namc/namc-store-client";
import { listStoreProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function NamcStorePage() {
  const products = await listStoreProducts();

  return <NamcStoreClient products={products} />;
}
