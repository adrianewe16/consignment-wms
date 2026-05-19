'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Dealer, InventoryRow } from '@/lib/supabase'
import { formatThb } from '@/lib/utils'
import { ArrowDownUp, AlertTriangle, FileText, ChevronUp, ChevronDown } from 'lucide-react'
import { generateStockTakePDF } from '@/lib/pdf'

interface Props {
  dealer: Dealer
}

type SortKey = 'name' | 'remaining' | 'replenishment'
type SortDir = 'asc' | 'desc'

export default function InventoryTab({ dealer }: Props) {
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [unitFilter, setUnitFilter] = useState<'stock' | 'show'>('stock')
  const [sortKey, setSortKey] = useState<SortKey>('replenishment')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [thresholds, setThresholds] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const fetchInventory = async () => {
    setLoading(true)

    // Get all movements for this dealer
    const { data: movements } = await supabase
      .from('movements')
      .select('sku, type, unit_type, qty')
      .eq('dealer_id', dealer.id)

    // Get all products
    const { data: products } = await supabase.from('products').select('*')

    // Get dealer_products for thresholds
    const { data: dp } = await supabase
      .from('dealer_products')
      .select('sku, threshold')
      .eq('dealer_id', dealer.id)

    const threshMap: Record<string, number> = {}
    dp?.forEach(d => { threshMap[d.sku] = d.threshold })
    setThresholds(threshMap)

    // Compute remaining per sku per unit_type
    const balances: Record<string, Record<string, number>> = {}
    movements?.forEach(m => {
      if (!balances[m.sku]) balances[m.sku] = { stock: 0, show: 0 }
      balances[m.sku][m.unit_type] += m.type === 'in' ? m.qty : -m.qty
    })

    // Build rows
    const skuSet = new Set([
      ...Object.keys(balances),
      ...(dp?.map(d => d.sku) || [])
    ])

    const productMap: Record<string, any> = {}
    products?.forEach(p => { productMap[p.sku] = p })

    const inventoryRows: InventoryRow[] = []
    skuSet.forEach(sku => {
      const product = productMap[sku]
      if (!product) return
      const remaining = (balances[sku]?.[unitFilter] || 0)
      const threshold = threshMap[sku] || 0
      const replenishment = Math.max(0, threshold - remaining)
      inventoryRows.push({
        sku,
        name: product.name,
        category: product.category,
        srp: product.srp,
        unit_type: unitFilter,
        remaining,
        threshold,
        replenishment
      })
    })

    setRows(inventoryRows)
    setLoading(false)
  }

  useEffect(() => { fetchInventory() }, [dealer.id, unitFilter])

  const sorted = [...rows].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
    return mul * (a[sortKey] - b[sortKey])
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : <ArrowDownUp className="w-3 h-3 opacity-30" />

  const updateThreshold = async (sku: string, val: number) => {
    setThresholds(t => ({ ...t, [sku]: val }))
    setSaving(sku)
    await supabase.from('dealer_products').upsert({ dealer_id: dealer.id, sku, threshold: val }, { onConflict: 'dealer_id,sku' })
    setSaving(null)
    await fetchInventory()
  }

  const handlePDF = async () => {
    const { data: allMovements } = await supabase.from('movements').select('sku, type, unit_type, qty').eq('dealer_id', dealer.id)
    const { data: products } = await supabase.from('products').select('*')
    const productMap: Record<string, any> = {}
    products?.forEach(p => { productMap[p.sku] = p })

    const balancesStock: Record<string, number> = {}
    const balancesShow: Record<string, number> = {}
    allMovements?.forEach(m => {
      if (m.unit_type === 'stock') balancesStock[m.sku] = (balancesStock[m.sku] || 0) + (m.type === 'in' ? m.qty : -m.qty)
      else balancesShow[m.sku] = (balancesShow[m.sku] || 0) + (m.type === 'in' ? m.qty : -m.qty)
    })

    const makeRows = (balances: Record<string, number>, ut: 'stock' | 'show'): InventoryRow[] =>
      Object.entries(balances).map(([sku, remaining]) => ({
        sku, name: productMap[sku]?.name || sku, category: productMap[sku]?.category || null,
        srp: productMap[sku]?.srp || 0, unit_type: ut, remaining, threshold: thresholds[sku] || 0, replenishment: 0
      }))

    generateStockTakePDF(dealer, makeRows(balancesStock, 'stock'), makeRows(balancesShow, 'show'))
  }

  const totalValue = sorted.reduce((s, r) => s + r.remaining * r.srp, 0)
  const lowStock = sorted.filter(r => r.replenishment > 0).length

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['stock', 'show'] as const).map(t => (
              <button key={t} onClick={() => setUnitFilter(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${unitFilter === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {lowStock > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">{lowStock} need replenishment</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Total value: <span className="font-semibold text-gray-900">{formatThb(totalValue)}</span></span>
          <button onClick={handlePDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800">
            <FileText className="w-3.5 h-3.5" /> Stock Take PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1">Product <SortIcon k="name" /></span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => toggleSort('remaining')}>
                <span className="flex items-center gap-1 justify-end">Remaining <SortIcon k="remaining" /></span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Threshold</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => toggleSort('replenishment')}>
                <span className="flex items-center gap-1 justify-end">Replenish <SortIcon k="replenishment" /></span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Value (฿)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Loading…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No inventory yet</td></tr>
            ) : sorted.map(row => (
              <tr key={row.sku} className={`hover:bg-gray-50 transition-colors ${row.replenishment > 0 ? 'bg-amber-50/40' : ''}`}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{row.sku}</span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3">
                  {row.category && <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">{row.category}</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-bold ${row.remaining <= 0 ? 'text-red-600' : row.replenishment > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {row.remaining}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min="0"
                    defaultValue={row.threshold}
                    onBlur={e => updateThreshold(row.sku, parseInt(e.target.value) || 0)}
                    className="w-16 text-right border border-gray-200 rounded px-2 py-0.5 text-sm outline-none focus:border-indigo-400"
                  />
                  {saving === row.sku && <span className="text-xs text-gray-400 ml-1">…</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.replenishment > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-full">
                      <AlertTriangle className="w-3 h-3" /> +{row.replenishment}
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">OK</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-600">{formatThb(row.remaining * row.srp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
