import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Zap, ExternalLink, Package } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, categories(*)")
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Maintain hardware inventory, pricing, MOQ, and specifications
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add New Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">
            All Products ({products?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="p-4">Part</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">MOQ</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded border bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt="" className="h-full w-full object-contain" />
                            ) : (
                              <Zap className="h-4 w-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground line-clamp-1">{p.name}</div>
                            <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {p.categories?.name || "Uncategorized"}
                      </td>
                      <td className="p-4 font-medium">
                        {formatCurrency(Number(p.price), currency)}
                        <span className="text-xs text-muted-foreground ml-1">/{p.unit}</span>
                      </td>
                      <td className="p-4 text-xs font-medium">
                        {p.minimum_quantity} {p.unit}s
                      </td>
                      <td className="p-4 text-xs">
                        {p.stock_quantity > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {p.stock_quantity}
                          </span>
                        ) : (
                          <span className="text-destructive font-medium">Out</span>
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
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/product/${p.slug}`} target="_blank">
                            <Button variant="ghost" size="icon" title="View in Store">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/products/${p.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground space-y-3">
              <Package className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p>No products added to the database yet.</p>
              <Link href="/admin/products/new">
                <Button size="sm">Create First Product</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
