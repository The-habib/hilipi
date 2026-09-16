"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, AlertCircle, MessageSquare } from "lucide-react";
import type { StoreSettings } from "@/types/database.types";

export function SettingsForm({ initialSettings }: { initialSettings: StoreSettings | null }) {
  const router = useRouter();

  const [storeName, setStoreName] = useState(initialSettings?.store_name || "EV Spare Parts Direct");
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsapp_number || "+1234567890");
  const [phone, setPhone] = useState(initialSettings?.phone || "");
  const [email, setEmail] = useState(initialSettings?.email || "");
  const [address, setAddress] = useState(initialSettings?.address || "");
  const [currency, setCurrency] = useState(initialSettings?.currency || "USD");

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    const supabase = createClient();
    const payload = {
      store_name: storeName.trim(),
      whatsapp_number: whatsappNumber.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      currency: currency.trim() || "USD",
    };

    try {
      if (initialSettings?.id) {
        const { error: updateError } = await supabase
          .from("store_settings")
          .update(payload)
          .eq("id", initialSettings.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("store_settings")
          .insert(payload);

        if (insertError) throw insertError;
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update store settings";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Check className="h-4 w-4 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-600" /> WhatsApp Dispatch Configuration
          </CardTitle>
          <CardDescription className="text-xs">
            This number receives all customer order requests from the cart.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Store WhatsApp Number (with country code) *
            </label>
            <Input
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+1234567890 or +919876543210"
            />
            <p className="text-[11px] text-muted-foreground">
              Include full international country code without spaces. e.g. +14155552671
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Store Identity & Contact Details</CardTitle>
          <CardDescription className="text-xs">
            Displayed on storefront header, footer, and generated WhatsApp messages
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Store Brand Name *
            </label>
            <Input
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. EV Parts Direct"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Public Support Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (800) 555-0199"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Support Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@evparts.example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Warehouse / Hub Address
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Industrial Zone, EV Hub, Bay 4"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Store Currency Code
            </label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="USD, EUR, INR, GBP"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} size="lg" className="w-full">
        {saving ? "Saving Changes..." : "Save Store Settings"}
      </Button>
    </form>
  );
}
