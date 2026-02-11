import { notFound } from "next/navigation";
import { redirectSourceSummary } from "@/lib/redirect-sources";

export default function RedirectSourcesPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">
        Redirect Source Diagnostics (DEV only)
      </h1>
      <p className="text-sm text-muted-foreground">
        This page summarizes redirect sources discovered in repository
        config/code.
      </p>

      {redirectSourceSummary.map((item) => (
        <section className="rounded border p-4" key={item.source}>
          <h2 className="mb-2 font-mono text-sm font-semibold">
            {item.source}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {item.findings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
