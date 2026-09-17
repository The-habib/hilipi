"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FolderTree,
  AlertCircle,
  Edit,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import type { Category } from "@/types/database.types";

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // New Category State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Category State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete / Safety Check State
  const [deleteModalCategory, setDeleteModalCategory] = useState<Category | null>(null);
  const [assignedProductCount, setAssignedProductCount] = useState<number | null>(null);
  const [checkingProducts, setCheckingProducts] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setCreateError(null);

    const supabase = createClient();
    try {
      const { data, error: insertError } = await supabase
        .from("categories")
        .insert({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || null,
          sort_order: parseInt(sortOrder, 10) || 0,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(`Category slug "${slug}" already exists. Please choose a unique name or slug.`);
        }
        throw insertError;
      }

      if (data) {
        setCategories((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
        setName("");
        setSlug("");
        setDescription("");
        setSortOrder("0");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      setCreateError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Start Editing Category
  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description || "");
    setEditSortOrder(String(cat.sort_order));
    setEditError(null);
  };

  // Save Edited Category
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || editLoading) return;

    setEditLoading(true);
    setEditError(null);

    const supabase = createClient();
    try {
      const { data, error: updateError } = await supabase
        .from("categories")
        .update({
          name: editName.trim(),
          slug: editSlug.trim().toLowerCase(),
          description: editDescription.trim() || null,
          sort_order: parseInt(editSortOrder, 10) || 0,
        })
        .eq("id", editingCategory.id)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error(`Slug "${editSlug}" is already in use by another category.`);
        }
        throw updateError;
      }

      if (data) {
        setCategories((prev) =>
          prev
            .map((c) => (c.id === data.id ? data : c))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        setEditingCategory(null);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update category";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle is_active on category
  const handleToggleActive = async (cat: Category) => {
    const supabase = createClient();
    const newStatus = !cat.is_active;

    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: newStatus })
        .eq("id", cat.id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c))
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle category active status:", err);
      alert("Failed to update category status. Ensure you are signed in as admin.");
    }
  };

  // Initiate safe delete check
  const startDeleteCheck = async (cat: Category) => {
    setDeleteModalCategory(cat);
    setCheckingProducts(true);
    setAssignedProductCount(null);
    setDeleteError(null);

    const supabase = createClient();
    try {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", cat.id);

      if (error) throw error;
      setAssignedProductCount(count ?? 0);
    } catch (err) {
      console.error("Failed to check assigned products:", err);
      setAssignedProductCount(0);
    } finally {
      setCheckingProducts(false);
    }
  };

  // Deactivate instead of delete
  const handleDeactivateCategory = async () => {
    if (!deleteModalCategory) return;
    setDeleteLoading(true);
    setDeleteError(null);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: false })
        .eq("id", deleteModalCategory.id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => (c.id === deleteModalCategory.id ? { ...c, is_active: false } : c))
      );
      setDeleteModalCategory(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to deactivate category";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Confirm permanent delete
  const handleConfirmDelete = async () => {
    if (!deleteModalCategory) return;
    setDeleteLoading(true);
    setDeleteError(null);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteModalCategory.id);

      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== deleteModalCategory.id));
      setDeleteModalCategory(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      {/* Create Category Form */}
      <Card className="md:col-span-1 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <Plus className="h-4 w-4 text-primary" /> Create Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {createError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Category Name *
              </label>
              <Input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. BLDC Motors & Accessories"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                URL Slug *
              </label>
              <Input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="bldc-motors-accessories"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary for category banner..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Sort Order
              </label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Lower numbers appear first in the navigation.
              </p>
            </div>

            <Button type="submit" disabled={submitting} className="w-full shadow-sm">
              {submitting ? "Creating..." : "Save Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Category List */}
      <Card className="md:col-span-2 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <FolderTree className="h-4 w-4 text-primary" /> System Categories ({categories.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length > 0 ? (
            <div className="divide-y text-sm">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{c.name}</span>
                      <Badge variant={c.is_active ? "success" : "secondary"} className="text-[10px]">
                        {c.is_active ? "Active" : "Hidden"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        order: {c.sort_order}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Slug: <code className="text-foreground">/category/{c.slug}</code>
                    </p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    {/* Toggle Active */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(c)}
                      title={c.is_active ? "Hide category from storefront" : "Show category in storefront"}
                    >
                      {c.is_active ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-amber-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-emerald-500" />
                      )}
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(c)}
                      className="gap-1 text-xs h-8"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>

                    {/* Delete / Check */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startDeleteCheck(c)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete category safely"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No categories created yet. Add your first category using the form on the left.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Edit className="h-4 w-4 text-primary" /> Edit Category: {editingCategory.name}
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded bg-destructive/10 text-destructive text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-muted-foreground">
                  Category Name
                </label>
                <Input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-muted-foreground">
                  URL Slug
                </label>
                <Input
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-muted-foreground">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase text-muted-foreground">
                  Sort Order
                </label>
                <Input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Safety Check Confirmation Dialog */}
      {deleteModalCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-destructive font-semibold text-base">
                <AlertTriangle className="h-5 w-5" />
                <span>Delete Category Confirmation</span>
              </div>
              <button
                onClick={() => setDeleteModalCategory(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                You are managing category: <strong className="text-foreground">{deleteModalCategory.name}</strong>.
              </p>

              {checkingProducts ? (
                <div className="p-3 rounded-lg bg-muted/40 text-center">
                  Checking assigned products in catalog...
                </div>
              ) : assignedProductCount !== null && assignedProductCount > 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-1.5">
                  <p className="font-semibold">
                    Warning: {assignedProductCount} product(s) are currently assigned to this category!
                  </p>
                  <p>
                    If you delete this category, those products will lose their category assignment.
                    We strongly recommend <strong>Deactivating</strong> the category instead, which will hide it from the customer storefront without breaking your catalog relationships.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/40 border">
                  No products are assigned to this category. It is safe to permanently delete.
                </div>
              )}

              {deleteError && (
                <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalCategory(null)}
                disabled={deleteLoading}
                className="w-full sm:w-auto text-xs"
              >
                Cancel
              </Button>
              {assignedProductCount !== null && assignedProductCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeactivateCategory}
                  disabled={deleteLoading}
                  className="w-full sm:w-auto text-xs font-semibold"
                >
                  Deactivate Only
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={deleteLoading || checkingProducts}
                className="w-full sm:w-auto text-xs font-semibold"
              >
                {deleteLoading ? "Processing..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
