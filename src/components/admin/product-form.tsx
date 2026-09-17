"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  Zap,
  Trash2,
  ArrowLeft,
  Info,
  DollarSign,
  Boxes,
  Image as ImageIcon,
  FileText,
  Eye,
} from "lucide-react";
import { productSchema } from "@/lib/validations/product";
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
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

    setError(null);
    setUploadProgressMsg(null);

    // 1. Strict MIME type check
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Invalid file format. Only JPG, PNG, WEBP, and GIF images are permitted.");
      e.target.value = "";
      return;
    }

    // 2. Strict file size check (5MB maximum)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 5MB limit. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      e.target.value = "";
      return;
    }

    // 3. Safe extension whitelist
    const rawExt = file.name.split(".").pop()?.toLowerCase() || "";
    const extMap: Record<string, string> = {
      jpg: "jpg",
      jpeg: "jpg",
      png: "png",
      webp: "webp",
      gif: "gif",
    };
    const fileExt = extMap[rawExt];
    if (!fileExt) {
      setError("Invalid file extension. Please select a valid image file.");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    setUploadProgressMsg("Uploading to storage...");

    try {
      const supabase = createClient();
      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setImageUrl(publicUrlData.publicUrl);
      setUploadProgressMsg("Image uploaded successfully!");
      setTimeout(() => setUploadProgressMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setError(`Image upload error: ${msg}. Make sure you are authenticated as an admin.`);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      sku: sku.trim().toUpperCase(),
      category_id: categoryId ? categoryId : null,
      description: description.trim() || null,
      price: parseFloat(price) || 0,
      unit: unit.trim().toUpperCase() || "PIECE",
      minimum_quantity: Math.max(1, parseInt(minQty, 10) || 1),
      stock_quantity: Math.max(0, parseInt(stockQty, 10) || 0),
      image_url: imageUrl.trim() || null,
      is_featured: isFeatured,
      is_active: isActive,
    };

    // Client-side Zod validation
    const validation = productSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      setError(`${firstIssue.path.join(".")}: ${firstIssue.message}`);
      setSubmitting(false);
      return;
    }

    const supabase = createClient();

    try {
      if (isEditing && initialData) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", initialData.id);

        if (updateError) {
          if (updateError.code === "23505") {
            if (updateError.message.includes("sku")) {
              throw new Error(`SKU "${payload.sku}" is already in use by another product. Please use a unique SKU.`);
            }
            if (updateError.message.includes("slug")) {
              throw new Error(`Slug "${payload.slug}" is already in use by another product. Please use a unique slug.`);
            }
          }
          throw updateError;
        }

        setSuccessMsg("Product updated successfully!");
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(payload);

        if (insertError) {
          if (insertError.code === "23505") {
            if (insertError.message.includes("sku")) {
              throw new Error(`SKU "${payload.sku}" is already in use by another product. Please use a unique SKU.`);
            }
            if (insertError.message.includes("slug")) {
              throw new Error(`Slug "${payload.slug}" is already in use by another product. Please use a unique slug.`);
            }
          }
          throw insertError;
        }

        setSuccessMsg("Product created successfully!");
      }

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Products List
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details: Sections 1, 2, 3, 5 */}
        <div className="md:col-span-2 space-y-6">
          {/* SECTION 1: BASIC INFORMATION */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> 1. Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
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
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: PRICING & MOQS */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> 2. Pricing & Wholesale Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
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
                    Unit of Sale *
                  </label>
                  <Input
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="PIECE, SET, PAIR, METER, KIT"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Minimum Order Quantity (MOQ) *
                </label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Customers in the storefront cannot add fewer than this number of units to their cart.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: INVENTORY */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" /> 3. Inventory & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Available Stock Quantity
                </label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Setting this to 0 marks the product as &quot;Out of Stock&quot; and prevents customer ordering.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: CONTENT & SPECS */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> 5. Content & Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground block">
                Technical Specifications & Notes
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={"Rated Voltage: 72V\nPeak Power: 3000W\nBrake Compatibility: Disc Brake\nConnector Type: Waterproof 9-Pin"}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Tip: Enter key specifications using &quot;Label: Value&quot; format on each line to render an automated technical specification table on the storefront.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Sections 4 & 6 */}
        <div className="space-y-6">
          {/* SECTION 4: MEDIA */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> 4. Media & Imagery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="aspect-square rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden relative">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Product preview"
                      className="h-full w-full object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground shadow-sm transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <Zap className="h-12 w-12 text-muted-foreground/30" />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">
                  Upload file (Max 5MB):
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingImage}
                    className="w-full gap-1.5 text-xs cursor-pointer"
                    onClick={() => document.getElementById("image-upload-input")?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImage ? "Uploading..." : imageUrl ? "Replace Image" : "Upload Image"}
                  </Button>
                  <input
                    id="image-upload-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {uploadProgressMsg && (
                  <p className="text-xs text-primary font-medium">{uploadProgressMsg}</p>
                )}
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

          {/* SECTION 6: VISIBILITY */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> 6. Catalog Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold block text-foreground">Active in Storefront</span>
                  <p className="text-[11px] text-muted-foreground">Uncheck to hide this part from public view</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer border-t pt-3">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold block text-foreground">Featured Component</span>
                  <p className="text-[11px] text-muted-foreground">Show in the homepage featured parts grid</p>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Form Submit & Cancel */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full h-10 font-semibold"
            >
              {submitting ? "Saving Product..." : isEditing ? "Save Changes" : "Publish Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              className="w-full text-xs h-9"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
