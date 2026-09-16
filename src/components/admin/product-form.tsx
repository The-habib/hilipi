"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Zap } from "lucide-react";
import type { Category, Product } from "@/types/database.types";

interface ProductFormProps {
  categories: Category[];
  initialData?: Product;
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData ? String(initialData.price) : "0");
  const [unit, setUnit] = useState(initialData?.unit || "PIECE");
  const [minQty, setMinQty] = useState(initialData ? String(initialData.minimum_quantity) : "1");
  const [stockQty, setStockQty] = useState(initialData ? String(initialData.stock_quantity) : "10");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name if creating new
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  // Upload image to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setImageUrl(publicUrlData.publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setError(`Image upload error: ${msg}. If RLS blocks upload, authenticate as admin first.`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    const payload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      sku: sku.trim().toUpperCase(),
      category_id: categoryId || null,
      description: description.trim() || null,
      price: parseFloat(price) || 0,
      unit: unit.trim().toUpperCase() || "PIECE",
      minimum_quantity: Math.max(1, parseInt(minQty, 10) || 1),
      stock_quantity: Math.max(0, parseInt(stockQty, 10) || 0),
      image_url: imageUrl || null,
      is_featured: isFeatured,
      is_active: isActive,
    };

    try {
      if (isEditing && initialData) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", initialData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(payload);

        if (insertError) throw insertError;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Product Name *
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. 72V 3000W BLDC Hub Motor"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    URL Slug *
                  </label>
                  <Input
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="72v-3000w-bldc-hub-motor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    SKU Code *
                  </label>
                  <Input
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="EVM-723000-HUB"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Description & Specifications
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed voltage ratings, connector types, dimensions, thermal thresholds..."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & MOQ */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Pricing & Wholesale Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Unit Price *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Unit Type *
                  </label>
                  <Input
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="PIECE, SET, PAIR, METER, KIT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Minimum Order Qty (MOQ) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    The cart enforces that customers cannot order fewer than this amount.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Available Stock Qty
                  </label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings (Image, Visibility) */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Product Image
              </h3>

              <div className="aspect-square rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Product preview" className="h-full w-full object-contain" />
                ) : (
                  <Zap className="h-12 w-12 text-muted-foreground/30" />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">
                  Upload file to Supabase Storage:
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      className="w-full gap-1.5 text-xs cursor-pointer"
                      onClick={() => document.getElementById("image-upload-input")?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingImage ? "Uploading..." : "Select Image"}
                    </Button>
                  </label>
                  <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Or direct image URL:</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Catalog Visibility
              </h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <div>
                  <span className="text-sm font-medium">Active / Published</span>
                  <p className="text-xs text-muted-foreground">Visible to customers in storefront</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer border-t pt-3">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <div>
                  <span className="text-sm font-medium">Featured Item</span>
                  <p className="text-xs text-muted-foreground">Highlighted on store homepage</p>
                </div>
              </label>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
