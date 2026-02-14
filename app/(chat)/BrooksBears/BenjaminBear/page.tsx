import Link from "next/link";

export default function BenjaminBearRoute() {
  return (
    <main className="flex min-h-dvh flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">
        Benjamin Bear session screen (placeholder)
      </h1>
      <Link
        href="/BrooksBears"
        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        ← Back
      </Link>
    </main>
  );
}
