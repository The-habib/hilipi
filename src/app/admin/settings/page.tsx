import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store & WhatsApp Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure WhatsApp dispatch receiver, contact info, and store branding
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
