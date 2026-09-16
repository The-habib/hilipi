import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(1000).nullable().optional(),
  image_url: z.string().url("Invalid image URL").nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const updateCategorySchema = categorySchema.partial();

export type CategoryFormValues = z.infer<typeof categorySchema>;
