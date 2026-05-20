import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  }
})

export type Dealer = {
  id: string
  name: string
  created_at: string
}

export type Product = {
  sku: string
  name: string
  category: string | null
  srp: number
  created_at: string
}

export type DealerProduct = {
  dealer_id: string
  sku: string
  threshold: number
}

export type Movement = {
  id: string
  dealer_id: string
  sku: string
  type: 'in' | 'out'
  unit_type: 'stock' | 'show'
  qty: number
  date: string
  ref: string | null
  customer: string | null
  notes: string | null
  created_at: string
}

export type MovementWithProduct = Movement & {
  products: Product
}

export type InventoryRow = {
  sku: string
  name: string
  category: string | null
  srp: number
  unit_type: 'stock' | 'show'
  remaining: number
  threshold: number
  replenishment: number
}
