import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/";
  const showError = params.error === "1";

  return (
    <section className="app-panel mx-auto max-w-md space-y-5 p-6 md:p-8">
      <div className="space-y-2">
        <h1 className="app-wordmark text-white">ERA</h1>
        <p className="text-sm leading-6 text-white/55">Enter the shared site password to continue.</p>
      </div>

      {showError ? (
        <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">Incorrect password. Try again.</p>
      ) : null}

      <form action="/api/site-auth" className="space-y-4" method="post">
        <input name="next" type="hidden" value={nextPath} />
        <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
          <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Password</span>
          <input autoComplete="current-password" className="app-input" name="password" required type="password" />
        </label>
        <button className="app-button w-full" type="submit">
          Continue
        </button>
      </form>

      <p className="text-xs leading-5 text-white/40">
        Password is configured with the <code className="text-white/55">ERA_SITE_PASSWORD</code> environment variable on the
        server (for example in Vercel project settings).
      </p>

      <Link className="font-mono-ui text-[11px] uppercase tracking-[0.16em] text-white/45 hover:text-white" href="/">
        Back
      </Link>
    </section>
  );
}
