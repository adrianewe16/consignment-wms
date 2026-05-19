'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/supabase'
import { X, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface StockLine {
  sku: string
  unit_type: 'stock' | 'show'
  qty: number
}

interface Props {
  dealerId: string
  onClose: () => void
  onSaved: () => void
}

export default function StockInModal({ dealerId, onClose, onSaved }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<StockLine[]>([{ sku: '', unit_type: 'stock', qty: 1 }])
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('products').select('*').order('name').then(({ data }) => setProducts(data || []))
  }, [])

  const addLine = () => setLines(l => [...l, { sku: '', unit_type: 'stock', qty: 1 }])
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof StockLine, value: any) => {
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line))
  }

  const handleSave = async () => {
    const validLines = lines.filter(l => l.sku && l.qty > 0)
    if (!validLines.length) return setError('Add at least one line')
    setLoading(true)

    const movements = validLines.map(l => ({
      dealer_id: dealerId,
      sku: l.sku,
      type: 'in' as const,
      unit_type: l.unit_type,
      qty: l.qty,
      date,
      ref: ref.trim() || null,
      notes: notes.trim() || null,
    }))

    const { error: err } = await supabase.from('movements').insert(movements)
    
    // Ensure dealer_products entry exists
    for (const l of validLines) {
      await supabase.from('dealer_products').upsert({ dealer_id: dealerId, sku: l.sku, threshold: 0 }, { onConflict: 'dealer_id,sku', ignoreDuplicates: true })
    }

    setLoading(false)
    if (err) return setError(err.message)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Stock In</h3>
            <p className="text-xs text-gray-500">Multi-SKU batch — shared ST ref + date</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">ST / Reference No.</label>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="ST-2025-001"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            <span className="col-span-5">Product / SKU</span>
            <span className="col-span-3">Unit Type</span>
            <span className="col-span-3">Qty</span>
            <span className="col-span-1"></span>
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <select value={line.sku} onChange={e => updateLine(i, 'sku', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-green-400">
                  <option value="">— Select SKU —</option>
                  {products.map(p => <option key={p.sku} value={p.sku}>{p.sku} · {p.name}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <select value={line.unit_type} onChange={e => updateLine(i, 'unit_type', e.target.value as 'stock' | 'show')}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-green-400">
                  <option value="stock">Stock</option>
                  <option value="show">Show</option>
                </select>
              </div>
              <div className="col-span-3">
                <input type="number" min="1" value={line.qty} onChange={e => updateLine(i, 'qty', parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-green-400" />
              </div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={addLine} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium mt-2">
            <Plus className="w-4 h-4" /> Add Line
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes"
            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
        </div>

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Saving…' : 'Confirm Stock In'}
          </button>
        </div>
      </div>
    </div>
  )
}
