import Link from "next/link";
import { redirect } from "next/navigation";
import { destroyAdminSession, getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

async function logoutAction(): Promise<void> {
  "use server";
  await destroyAdminSession();
  redirect("/admin/login");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // /admin/login renders its own page outside this layout via route group convention,
  // so any layout child is by definition a protected route.
  const session = await getAdminSession();
  if (!session.valid) redirect("/admin/login");

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <Link href="/admin" className="font-serif font-bold text-xl">
              Padel Leaf · Admin
            </Link>
            <nav className="flex gap-4 text-sm text-cream/85">
              <Link href="/admin"            className="hover:text-sage">Today</Link>
              <Link href="/admin/bookings"   className="hover:text-sage">Bookings</Link>
              <Link href="/admin/customers"  className="hover:text-sage">Customers</Link>
              <Link href="/admin/messages"   className="hover:text-sage">Messages</Link>
              <Link href="/admin/block-outs" className="hover:text-sage">Block-outs</Link>
              <Link href="/admin/pricing"    className="hover:text-sage">Pricing</Link>
            </nav>
          </div>
          <form action={logoutAction}>
            <button className="text-sm text-cream/75 hover:text-sage">Sign out</button>
          </form>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
