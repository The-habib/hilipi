import { z } from "zod";

export const orderItemInputSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const checkoutFormSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(7, "Phone number must be at least 7 digits").max(20),
  address: z.string().min(5, "Delivery address must be at least 5 characters").max(500),
  note: z.string().max(500).optional().nullable(),
});

export const createOrderSchema = checkoutFormSchema.extend({
  items: z.array(orderItemInputSchema).min(1, "Order must contain at least one item"),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
