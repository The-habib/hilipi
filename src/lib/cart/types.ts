export interface CartItem {
  product_id: string;
  product_name: string;
  slug: string;
  sku: string;
  price: number;
  unit: string;
  minimum_quantity: number;
  stock_quantity: number;
  quantity: number;
  image_url?: string | null;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    unit: string;
    minimum_quantity: number;
    stock_quantity: number;
    image_url?: string | null;
  }, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}
