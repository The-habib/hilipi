import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/layout/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname !== "/admin/login") {
    if (!user) {
      redirect("/admin/login");
    }

    // Verify the authenticated user has an active admin record
    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!adminRecord) {
      redirect("/admin/login?error=unauthorized");
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav userEmail={user?.email} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
