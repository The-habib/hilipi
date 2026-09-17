import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        storeName={settings?.store_name ?? "EV Spare Parts"}
        whatsappNumber={settings?.whatsapp_number}
      />
      <main className="flex-1">{children}</main>
      <Footer
        storeName={settings?.store_name}
        phone={settings?.phone}
        email={settings?.email}
        address={settings?.address}
      />
    </div>
  );
}
