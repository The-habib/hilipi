"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderTree, AlertCircle } from "lucide-react";
import type { Category } from "@/types/database.types";

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

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

      if (insertError) throw insertError;

      if (data) {
        setCategories((prev) => [...prev, data]);
        setName("");
        setSlug("");
        setDescription("");
        setSortOrder("0");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      {/* Create Category Form */}
      <Card className="md:col-span-1">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Create New Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
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
                placeholder="e.g. BLDC Motors & Drives"
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
                placeholder="bldc-motors-drives"
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
                placeholder="Brief description for category banner..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm"
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
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating..." : "Save Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Category List */}
      <Card className="md:col-span-2">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" /> Active Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length > 0 ? (
            <div className="divide-y text-sm">
              {categories.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <Badge variant={c.is_active ? "success" : "secondary"} className="text-[10px]">
                        {c.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      slug: <code className="text-foreground">/category/{c.slug}</code> • Order: {c.sort_order}
                    </p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                    )}
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
    </div>
  );
}
