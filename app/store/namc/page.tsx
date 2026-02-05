import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { listStoreProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function formatPrice(priceInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceInCents / 100);
}

export default async function NamcStorePage() {
  const products = await listStoreProducts();

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#1a1115] via-[#140f16] to-[#110c14]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#1a1115]/90 px-4 py-3 backdrop-blur-sm">
        <Link
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          href="/store"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <Image
              alt="NAMC icon"
              className="h-full w-full object-cover"
              height={36}
              src="/icons/namc-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">NAMC</h1>
            <p className="text-xs text-white/60">Lore, media, and worlds</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                <Image
                  alt="NAMC icon"
                  className="h-full w-full object-cover"
                  height={64}
                  src="/icons/namc-appicon.png"
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">NAMC Store</h2>
                <p className="text-sm text-white/60">
                  Northern Americana Media Collection
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <Link
                className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 py-3 text-sm font-semibold text-white transition hover:bg-pink-600 md:w-56"
                href="/NAMC"
              >
                Enter NAMC
              </Link>
              <Link
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:w-56"
                href="/store"
              >
                Back to store
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Products</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {products.map((product) => {
              const actionLabel =
                product.type === "merch"
                  ? "Buy now"
                  : product.type === "digital_media"
                    ? "Open"
                    : "Redeem";

              return (
                <article
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  key={product.id}
                >
                  <div className="relative mb-3 h-40 overflow-hidden rounded-xl bg-white/10">
                    {product.imageUrl ? (
                      <Image
                        alt={product.title}
                        className="h-full w-full object-cover"
                        fill
                        src={product.imageUrl}
                        unoptimized
                      />
                    ) : null}
                  </div>

                  <div className="text-xs uppercase tracking-wide text-pink-200/80">
                    {product.type.replace("_", " ")}
                  </div>
                  <h4 className="mt-1 text-base font-semibold text-white">
                    {product.title}
                  </h4>
                  {product.description ? (
                    <p className="mt-2 text-sm text-white/70">
                      {product.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-base font-bold text-white">
                      {formatPrice(product.price)}
                    </div>
                    {product.type === "merch" && product.externalUrl ? (
                      <a
                        className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-600"
                        href={product.externalUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {actionLabel}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                        type="button"
                      >
                        {actionLabel}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
