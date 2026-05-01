import { redirect } from "next/navigation";
import { createAdminSession, verifyAdminPassword, getAdminSession } from "@/lib/session";

export const metadata = { title: "Admin · Sign in" };
export const dynamic = "force-dynamic";

async function loginAction(formData: FormData): Promise<void> {
  "use server";
  const password = String(formData.get("password") ?? "");
  // #region agent log
  fetch("http://127.0.0.1:7589/ingest/dca80672-932e-4ef8-bfcb-5f2627301044",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"e69d34"},body:JSON.stringify({sessionId:"e69d34",runId:"admin-login-debug-1",hypothesisId:"H3",location:"app/admin/login/page.tsx:10",message:"loginAction form payload",data:{passwordLength:password.length,passwordTrimmedLength:password.trim().length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const ok = await verifyAdminPassword(password);
  // #region agent log
  fetch("http://127.0.0.1:7589/ingest/dca80672-932e-4ef8-bfcb-5f2627301044",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"e69d34"},body:JSON.stringify({sessionId:"e69d34",runId:"admin-login-debug-1",hypothesisId:"H4",location:"app/admin/login/page.tsx:14",message:"loginAction verify result",data:{ok},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (!ok) {
    redirect("/admin/login?e=1");
  }
  await createAdminSession();
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const session = await getAdminSession();
  if (session.valid) redirect("/admin");
  const { e } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-deep px-6">
      <div className="bg-cream rounded-2xl border border-forest/10 shadow-xl p-10 w-full max-w-md">
        <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-3">
          — Admin
        </div>
        <h1 className="font-serif text-3xl text-forest-deep mb-6">Sign in</h1>

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
            />
          </div>

          {e === "1" && (
            <div className="text-sm text-clay">Wrong password.</div>
          )}

          <button type="submit" className="btn btn-primary w-full justify-center">
            Sign in →
          </button>
        </form>

        <a href="/" className="block mt-6 text-center text-sm text-char-soft hover:text-forest">
          ← back to the site
        </a>
      </div>
    </div>
  );
}
