"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Check,
  AlertCircle,
  MessageSquare,
  Building2,
  Image as ImageIcon,
  Coins,
  Upload,
  Trash2,
} from "lucide-react";
import type { StoreSettings } from "@/types/database.types";

export function SettingsForm({ initialSettings }: { initialSettings: StoreSettings | null }) {
  const router = useRouter();

  // 1. Business Information
  const [storeName, setStoreName] = useState(initialSettings?.store_name || "HILIPI");
  const [phone, setPhone] = useState(initialSettings?.phone || "");
  const [email, setEmail] = useState(initialSettings?.email || "");
  const [address, setAddress] = useState(initialSettings?.address || "");

  // 2. WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsapp_number || "+91 89276 81165");

  // 3. Branding
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);

  // 4. Store
  const [currency, setCurrency] = useState(initialSettings?.currency || "USD");

  // Mutation states
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLogoMsg(null);

    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      setError("Invalid file format for logo. Only JPG, PNG, WEBP, and GIF are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file size exceeds 5MB limit.");
      e.target.value = "";
      return;
    }

    setUploadingLogo(true);
    setLogoMsg("Uploading logo...");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `branding/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setLogoUrl(urlData.publicUrl);
      setLogoMsg("Logo uploaded successfully!");
      setTimeout(() => setLogoMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload logo";
      setError(`Failed — Try again: ${msg}`);
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

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
      logo_url: logoUrl.trim() || null,
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
      setError(`Failed — Try again: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3.5 rounded-lg bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Check className="h-4 w-4 shrink-0" />
          <span>Saved! Your store settings have been updated.</span>
        </div>
      )}

      {/* SECTION 1: BUSINESS INFORMATION */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> BUSINESS INFORMATION
          </CardTitle>
          <CardDescription className="text-xs">
            Core store identity and commercial contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Store name *
            </label>
            <Input
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. HILIPI"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional customer phone"
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank if no landline or separate support phone exists yet.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional customer email"
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank if no official business email exists yet.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Address
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional workshop or warehouse address"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave blank if no physical address is published yet.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: WHATSAPP */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-600" /> WHATSAPP
          </CardTitle>
          <CardDescription className="text-xs">
            The WhatsApp number where all customer inquiries, product questions, and cart orders arrive.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              WhatsApp number *
            </label>
            <Input
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+91 89276 81165"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Enter with international country code. Known HILIPI number: <strong>+91 89276 81165</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: BRANDING */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" /> BRANDING
          </CardTitle>
          <CardDescription className="text-xs">
            Store logo displayed on header and customer receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground block">
              Logo
            </label>

            {logoUrl ? (
              <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                <div className="h-16 w-16 rounded border bg-card flex items-center justify-center overflow-hidden p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Store logo" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{logoUrl}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-upload-input")?.click()}
                      disabled={uploadingLogo}
                      className="text-xs h-7"
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogoUrl("")}
                      className="text-xs h-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No logo uploaded yet. Upload a square or rectangular PNG, JPG, or WebP logo (max 5MB).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("logo-upload-input")?.click()}
                  disabled={uploadingLogo}
                  className="text-xs gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </Button>
              </div>
            )}

            <input
              id="logo-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {logoMsg && <p className="text-xs text-primary font-medium">{logoMsg}</p>}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: STORE */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" /> STORE
          </CardTitle>
          <CardDescription className="text-xs">
            Default currency settings for wholesale pricing and catalog display.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Currency *
            </label>
            <Input
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="e.g. USD, INR, EUR, GBP"
              className="text-sm font-mono max-w-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Standard 3-letter currency code (e.g. USD for US Dollars, INR for Indian Rupees).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={saving || uploadingLogo}
          size="lg"
          className="w-full font-semibold shadow-sm h-11"
        >
          {saving ? "Saving..." : "Save Store Settings"}
        </Button>
      </div>
    </form>
  );
}
