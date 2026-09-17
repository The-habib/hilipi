"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit,
  ExternalLink,
  Zap,
  Package,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import type { Category, Product } from "@/types/database.types";

type ProductWithCategory = Product & {
  categories: Category | null;
};

interface ProductListProps {
  initialProducts: ProductWithCategory[];
  categories: Category[];
  currency: string;
}

export function ProductList({
  initialProducts,
  categories,
  currency,
}: ProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithCategory[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Dialog state for delete / archive
  const [confirmModalProduct, setConfirmModalProduct] = useState<ProductWithCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Filter products in memory for responsive real-time interaction
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || p.category_id === selectedCategory;

      // Status filter
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && p.is_active) ||
        (selectedStatus === "inactive" && !p.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Quick toggle active / inactive
  const handleToggleActive = async (product: ProductWithCategory) => {
    setActionLoadingId(product.id);
    const supabase = createClient();
    const newStatus = !product.is_active;

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: newStatus })
        .eq("id", product.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: newStatus } : p))
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status. Ensure you are signed in as admin.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Safe Deactivate
  const handleDeactivate = async () => {
    if (!confirmModalProduct) return;
    setDeleteLoading(true);
    setDialogError(null);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", confirmModalProduct.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === confirmModalProduct.id ? { ...p, is_active: false } : p
        )
      );
      setConfirmModalProduct(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to deactivate product";
      setDialogError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async () => {
    if (!confirmModalProduct) return;
    setDeleteLoading(true);
    setDialogError(null);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", confirmModalProduct.id);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== confirmModalProduct.id));
      setConfirmModalProduct(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete product";
      setDialogError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Products Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Maintain catalog specifications, wholesale MOQ, pricing, and stock levels
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Add New Product
          </Button>
        </Link>
      </div>

      {/* Filters Toolbar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Draft / Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Products Listing Card */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Catalog Items ({filteredProducts.length} of {products.length})
          </CardTitle>
          {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            >
              Reset Filters
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length > 0 ? (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="p-4">Part Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Unit Price</th>
                      <th className="p-4">MOQ</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded border bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                              {p.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <Zap className="h-5 w-5 text-muted-foreground/40" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-semibold text-foreground line-clamp-1">
                                {p.name}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                SKU: {p.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {p.categories?.name || "Uncategorized"}
                        </td>
                        <td className="p-4 font-semibold text-foreground">
                          {formatCurrency(Number(p.price), currency)}
                          <span className="text-xs text-muted-foreground ml-1 font-normal">
                            /{p.unit}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-medium">
                          {p.minimum_quantity} {p.unit}s
                        </td>
                        <td className="p-4 text-xs">
                          {p.stock_quantity > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {p.stock_quantity} in stock
                            </span>
                          ) : (
                            <span className="text-destructive font-medium">Out of stock</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={p.is_active ? "success" : "secondary"}>
                              {p.is_active ? "Active" : "Draft"}
                            </Badge>
                            {p.is_featured && (
                              <Badge variant="default" className="text-[10px]">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionLoadingId === p.id}
                              onClick={() => handleToggleActive(p)}
                              title={p.is_active ? "Deactivate (hide from store)" : "Activate (show in store)"}
                            >
                              {p.is_active ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground hover:text-amber-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-emerald-500" />
                              )}
                            </Button>

                            {/* View in Store */}
                            <Link href={`/product/${p.slug}`} target="_blank">
                              <Button variant="ghost" size="icon" title="View in Store">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </Link>

                            {/* Edit */}
                            <Link href={`/admin/products/${p.id}/edit`}>
                              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                                <Edit className="h-3.5 w-3.5" /> Edit
                              </Button>
                            </Link>

                            {/* Delete/Archive Modal Trigger */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmModalProduct(p)}
                              className="text-muted-foreground hover:text-destructive"
                              title="Archive or Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Card List */}
              <div className="block md:hidden divide-y">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-16 rounded border bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Zap className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 justify-between">
                          <Badge variant={p.is_active ? "success" : "secondary"} className="text-[10px]">
                            {p.is_active ? "Active" : "Draft"}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {p.sku}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                          {p.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {p.categories?.name || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-muted/20 p-2.5 rounded-md">
                      <div>
                        <span className="text-muted-foreground">Price: </span>
                        <strong className="text-foreground font-semibold">
                          {formatCurrency(Number(p.price), currency)}
                        </strong>
                        <span className="text-muted-foreground">/{p.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">MOQ: </span>
                        <strong>{p.minimum_quantity}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock: </span>
                        <strong className={p.stock_quantity > 0 ? "text-emerald-600" : "text-destructive"}>
                          {p.stock_quantity}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoadingId === p.id}
                        onClick={() => handleToggleActive(p)}
                        className="text-xs h-8"
                      >
                        {p.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Link href={`/admin/products/${p.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmModalProduct(p)}
                        className="text-destructive text-xs h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground space-y-3">
              <Package className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p>No products match the selected search or filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                }}
              >
                Clear Search Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete / Archive Confirmation Dialog (Phase 7) */}
      {confirmModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-base">
                <AlertTriangle className="h-5 w-5" />
                <span>Product Removal Options</span>
              </div>
              <button
                onClick={() => setConfirmModalProduct(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                You are managing: <strong className="text-foreground">{confirmModalProduct.name}</strong> (SKU:{" "}
                <span className="font-mono text-foreground">{confirmModalProduct.sku}</span>).
              </p>

              <div className="p-3 rounded-lg bg-muted/40 border space-y-1.5">
                <p className="font-semibold text-foreground">Historical Order Integrity:</p>
                <p>
                  • <strong>Deactivate (Recommended):</strong> Immediately hides this part from the public catalog and cart while preserving historical order logs and reporting accuracy.
                </p>
                <p>
                  • <strong>Permanent Delete:</strong> Removes the product record from the catalog. Historical order items will retain line snapshot details, but the original product reference will be unlinked.
                </p>
              </div>

              {dialogError && (
                <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                  {dialogError}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmModalProduct(null)}
                disabled={deleteLoading}
                className="w-full sm:w-auto text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                disabled={deleteLoading}
                className="w-full sm:w-auto text-xs font-semibold"
              >
                Deactivate Only
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handlePermanentDelete}
                disabled={deleteLoading}
                className="w-full sm:w-auto text-xs font-semibold"
              >
                {deleteLoading ? "Processing..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
