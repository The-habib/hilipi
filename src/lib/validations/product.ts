import { z } from "zod";

export const productSchema = z.object({
  category_id: z.string().uuid("Invalid category ID").nullable().optional(),
  name: z.string().min(2, "Product name must be at least 2 characters").max(200),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  sku: z.string().min(2, "SKU must be at least 2 characters").max(50),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().nonnegative("Price must be greater than or equal to 0"),
  unit: z.string().min(1, "Unit is required").default("PIECE"),
  minimum_quantity: z.number().int().min(1, "Minimum quantity must be at least 1").default(1),
  stock_quantity: z.number().int().min(0, "Stock quantity cannot be negative").default(0),
  image_url: z
    .string()
    .url("Invalid image URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const updateProductSchema = productSchema.partial();

export type ProductFormValues = z.infer<typeof productSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
