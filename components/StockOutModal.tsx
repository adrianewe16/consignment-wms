'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/supabase'
import { X } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  dealerId: string
  onClose: () => void
  onSaved: () => void
}

export default function StockOutModal({ dealerId, onClose, onSaved }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [sku, setSku] = useState('')
  const [unitType, setUnitType] = useState<'stock' | 'show'>('stock')
  const [qty, setQty] = useState(1)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [customer, setCustomer] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('products').select('*').order('name').then(({ data }) => setProducts(data || []))
  }, [])

  const handleSave = async () => {
    if (!sku) return setError('Select a product')
    setLoading(true)
    const { error: err } = await supabase.from('movements').insert({
      dealer_id: dealerId,
      sku,
      type: 'out',
      unit_type: unitType,
      qty,
      date,
      customer: customer.trim() || null,
      notes: notes.trim() || null,
    })
    setLoading(false)
    if (err) return setError(err.message)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Stock Out</h3>
            <p className="text-xs text-gray-500">Record a sale or outgoing unit</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Product</label>
            <select value={sku} onChange={e => setSku(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400">
              <option value="">— Select SKU —</option>
              {products.map(p => <option key={p.sku} value={p.sku}>{p.sku} · {p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Unit Type</label>
              <select value={unitType} onChange={e => setUnitType(e.target.value as 'stock' | 'show')}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400">
                <option value="stock">Stock</option>
                <option value="show">Show</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</label>
            <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name (optional)"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none" />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Saving…' : 'Confirm Stock Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
