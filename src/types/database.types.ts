export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          created_at: string
          customer_name: string
          id: string
          note: string | null
          order_number: string
          phone: string
          status: string
          subtotal: number
          updated_at: string
          whatsapp_message: string | null
        }
        Insert: {
          address: string
          created_at?: string
          customer_name: string
          id?: string
          note?: string | null
          order_number: string
          phone: string
          status?: string
          subtotal: number
          updated_at?: string
          whatsapp_message?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          customer_name?: string
          id?: string
          note?: string | null
          order_number?: string
          phone?: string
          status?: string
          subtotal?: number
          updated_at?: string
          whatsapp_message?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          minimum_quantity: number
          name: string
          price: number
          sku: string
          slug: string
          stock_quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          minimum_quantity?: number
          name: string
          price: number
          sku: string
          slug: string
          stock_quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          minimum_quantity?: number
          name?: string
          price?: number
          sku?: string
          slug?: string
          stock_quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          store_name: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_atomic: {
        Args: {
          p_address: string
          p_customer_name: string
          p_items: Json
          p_note: string
          p_order_id: string
          p_order_number: string
          p_phone: string
          p_whatsapp_message?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Product = Database["public"]["Tables"]["products"]["Row"]
export type Order = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]
export type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"]
export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"]

export type ProductWithCategory = Product & {
  categories: Category | null
}
