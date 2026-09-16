import { z } from "zod";

export const storeSettingsSchema = z.object({
  store_name: z.string().min(2, "Store name is required").max(100),
  whatsapp_number: z.string().min(7, "WhatsApp number is required").max(20),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  logo_url: z.string().url("Invalid logo URL").nullable().optional(),
  currency: z.string().min(1).max(10).default("USD"),
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;
