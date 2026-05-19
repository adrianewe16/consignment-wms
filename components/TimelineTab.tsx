'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Dealer, MovementWithProduct } from '@/lib/supabase'
import { DATE_PRESETS, getPresetDates } from '@/lib/utils'
import { generateMovementPDF } from '@/lib/pdf'
import { FileText, Trash2, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import PasswordModal from './PasswordModal'

interface Props {
  dealer: Dealer
}

export default function TimelineTab({ dealer }: Props) {
  const [movements, setMovements] = useState<MovementWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all')
  const [productFilter, setProductFilter] = useState('')
  const [products, setProducts] = useState<{ sku: string; name: string }[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchMovements = async () => {
    setLoading(true)
    let q = supabase
      .from('movements')
      .select('*, products(sku, name, category, srp, created_at)')
      .eq('dealer_id', dealer.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (dateFrom) q = q.gte('date', dateFrom)
    if (dateTo) q = q.lte('date', dateTo)
    if (typeFilter !== 'all') q = q.eq('type', typeFilter)
    if (productFilter) q = q.eq('sku', productFilter)

    const { data } = await q
    setMovements((data as MovementWithProduct[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.from('products').select('sku, name').order('name').then(({ data }) => setProducts(data || []))
  }, [])

  useEffect(() => { fetchMovements() }, [dealer.id, dateFrom, dateTo, typeFilter, productFilter])

  const applyPreset = (days: number) => {
    const { from, to } = getPresetDates(days)
    setDateFrom(from)
    setDateTo(to)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('movements').delete().eq('id', deleteTarget)
    setDeleteTarget(null)
    fetchMovements()
  }

  const totalIn = movements.filter(m => m.type === 'in').reduce((s, m) => s + m.qty, 0)
  const totalOut = movements.filter(m => m.type === 'out').reduce((s, m) => s + m.qty, 0)

  return (
    <div>
      {deleteTarget && (
        <PasswordModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          message="This movement will be permanently deleted."
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Date presets */}
        <div className="flex flex-wrap gap-1">
          {DATE_PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.days)}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
          <span className="text-gray-400 text-xs">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
        </div>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400">
          <option value="all">All types</option>
          <option value="in">IN only</option>
          <option value="out">OUT only</option>
        </select>

        <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400">
          <option value="">All products</option>
          {products.map(p => <option key={p.sku} value={p.sku}>{p.sku} · {p.name}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-4">
          <div className="text-xs">
            <span className="text-green-600 font-bold">↑ {totalIn} in</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-red-600 font-bold">↓ {totalOut} out</span>
          </div>
          <button
            onClick={() => generateMovementPDF(dealer, movements, dateFrom, dateTo)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">Loading…</td></tr>
            ) : movements.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No movements found</td></tr>
            ) : movements.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {format(new Date(m.date), 'dd MMM yyyy')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    m.type === 'in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {m.type === 'in' ? '↑ IN' : '↓ OUT'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{m.sku}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{m.products?.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.unit_type === 'stock' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {m.unit_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.ref || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.customer || '—'}</td>
                <td className={`px-4 py-3 text-right text-sm font-bold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.type === 'in' ? '+' : '-'}{m.qty}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setDeleteTarget(m.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
