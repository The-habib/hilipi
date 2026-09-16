import { formatCurrency } from "@/lib/utils";

export interface WhatsAppOrderItem {
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export interface WhatsAppOrderPayload {
  order_number: string;
  store_name: string;
  currency?: string;
  customer_name: string;
  phone: string;
  address: string;
  note?: string | null;
  items: WhatsAppOrderItem[];
  subtotal: number;
}

/**
 * Builds a clean, formatted plain text message for WhatsApp ordering.
 */
export function buildWhatsAppMessage(payload: WhatsAppOrderPayload): string {
  const currency = payload.currency || "USD";
  const lines: string[] = [];

  lines.push(`⚡ *NEW ORDER: ${payload.order_number}*`);
  lines.push(`🏪 *${payload.store_name}*`);
  lines.push(`─────────────────────────`);
  lines.push(`📋 *ORDER ITEMS:*`);

  payload.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.product_name}*\n` +
      `   Qty: ${item.quantity} ${item.unit} × ${formatCurrency(item.unit_price, currency)} = *${formatCurrency(item.subtotal, currency)}*`
    );
  });

  lines.push(`─────────────────────────`);
  lines.push(`💰 *TOTAL AMOUNT:* *${formatCurrency(payload.subtotal, currency)}*`);
  lines.push(`─────────────────────────`);
  lines.push(`👤 *CUSTOMER DETAILS:*`);
  lines.push(`• Name: ${payload.customer_name}`);
  lines.push(`• Phone: ${payload.phone}`);
  lines.push(`• Delivery Address:\n${payload.address}`);

  if (payload.note && payload.note.trim()) {
    lines.push(`• Notes: ${payload.note.trim()}`);
  }

  lines.push(`─────────────────────────`);
  lines.push(`_Thank you for ordering with ${payload.store_name}! Please confirm stock and delivery timeline._`);

  return lines.join("\n");
}

/**
 * Formats a phone number for wa.me URL (removes spaces, hyphens, and brackets).
 */
export function sanitizeWhatsAppNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^0-9]/g, "");
}

/**
 * Generates the complete click-to-chat WhatsApp URL with URL-encoded message.
 */
export function generateWhatsAppUrl(
  whatsappNumber: string,
  payload: WhatsAppOrderPayload
): string {
  const cleanPhone = sanitizeWhatsAppNumber(whatsappNumber);
  const message = buildWhatsAppMessage(payload);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
