'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Dealer } from '@/lib/supabase'
import { formatThb } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import { TrendingUp } from 'lucide-react'

interface Props {
  dealer: Dealer
}

interface AgingBucket {
  label: string
  items: AgingItem[]
  totalQty: number
  totalValue: number
}

interface AgingItem {
  sku: string
  name: string
  srp: number
  qty: number
  value: number
  age: number
}

interface BestSeller {
  sku: string
  name: string
  unitsSold: number
  revenue: number
}

export default function ReconciliationTab({ dealer }: Props) {
  const [buckets, setBuckets] = useState<AgingBucket[]>([])
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [totalOnHand, setTotalOnHand] = useState(0)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    fetchData()
  }, [dealer.id])

  const fetchData = async () => {
    setLoading(true)

    const { data: movements } = await supabase
      .from('movements')
      .select('sku, type, unit_type, qty, date')
      .eq('dealer_id', dealer.id)
      .eq('unit_type', 'stock')
      .order('date', { ascending: true })

    const { data: products } = await supabase.from('products').select('*')
    const productMap: Record<string, any> = {}
    products?.forEach(p => { productMap[p.sku] = p })

    // FIFO aging: track IN lots per SKU
    const lots: Record<string, { date: string; qty: number }[]> = {}
    const outQueue: Record<string, number> = {}

    // Best sellers: sum OUT qty per SKU
    const soldMap: Record<string, number> = {}

    movements?.forEach(m => {
      if (m.type === 'in') {
        if (!lots[m.sku]) lots[m.sku] = []
        lots[m.sku].push({ date: m.date, qty: m.qty })
      } else {
        outQueue[m.sku] = (outQueue[m.sku] || 0) + m.qty
        soldMap[m.sku] = (soldMap[m.sku] || 0) + m.qty
      }
    })

    // Apply FIFO consumption
    Object.entries(outQueue).forEach(([sku, totalOut]) => {
      let remaining = totalOut
      const skuLots = lots[sku] || []
      for (let i = 0; i < skuLots.length && remaining > 0; i++) {
        const consume = Math.min(skuLots[i].qty, remaining)
        skuLots[i].qty -= consume
        remaining -= consume
      }
    })

    // Build aging items
    const today = new Date()
    const b0: AgingItem[] = [], b1: AgingItem[] = [], b2: AgingItem[] = [], b3: AgingItem[] = []

    Object.entries(lots).forEach(([sku, skuLots]) => {
      const product = productMap[sku]
      if (!product) return
      skuLots.forEach(lot => {
        if (lot.qty <= 0) return
        const age = differenceInDays(today, new Date(lot.date))
        const item: AgingItem = { sku, name: product.name, srp: product.srp, qty: lot.qty, value: lot.qty * product.srp, age }
        if (age <= 30) b0.push(item)
        else if (age <= 60) b1.push(item)
        else if (age <= 90) b2.push(item)
        else b3.push(item)
      })
    })

    const mkBucket = (label: string, items: AgingItem[]): AgingBucket => ({
      label,
      items,
      totalQty: items.reduce((s, i) => s + i.qty, 0),
      totalValue: items.reduce((s, i) => s + i.value, 0)
    })

    const allBuckets = [
      mkBucket('0–30 days', b0),
      mkBucket('31–60 days', b1),
      mkBucket('61–90 days', b2),
      mkBucket('>90 days', b3),
    ]

    setBuckets(allBuckets)
    const tot = allBuckets.reduce((s, b) => s + b.totalQty, 0)
    const val = allBuckets.reduce((s, b) => s + b.totalValue, 0)
    setTotalOnHand(tot)
    setTotalValue(val)

    // Best sellers
    const bs: BestSeller[] = Object.entries(soldMap)
      .map(([sku, unitsSold]) => ({
        sku,
        name: productMap[sku]?.name || sku,
        unitsSold,
        revenue: unitsSold * (productMap[sku]?.srp || 0)
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5)

    setBestSellers(bs)
    setLoading(false)
  }

  const BUCKET_COLORS = [
    { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-400' },
    { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-400' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-400' },
    { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500' },
  ]

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading reconciliation…</div>

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total On Hand (FIFO)</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalOnHand}</p>
          <p className="text-xs text-gray-500 mt-0.5">Stock units remaining</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Value at SRP</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{formatThb(totalValue)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Inventory value in ฿</p>
        </div>
      </div>

      {/* Aging Buckets */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Aging Buckets (FIFO — Stock Units)</h3>
        <div className="grid grid-cols-2 gap-3">
          {buckets.map((bucket, idx) => {
            const colors = BUCKET_COLORS[idx]
            const pct = totalOnHand > 0 ? (bucket.totalQty / totalOnHand) * 100 : 0
            return (
              <div key={bucket.label} className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${colors.text} uppercase tracking-wide`}>{bucket.label}</span>
                  <span className={`text-xs font-semibold ${colors.text}`}>{pct.toFixed(0)}%</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-gray-900">{bucket.totalQty}</span>
                  <span className="text-xs text-gray-500 mb-0.5">units</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{formatThb(bucket.totalValue)}</p>
                <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full ${colors.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                {/* SKU breakdown */}
                {bucket.items.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {bucket.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 truncate max-w-[60%]">{item.name}</span>
                        <span className="text-xs font-medium text-gray-700">{item.qty} units</span>
                      </div>
                    ))}
                    {bucket.items.length > 3 && (
                      <p className="text-xs text-gray-400">+{bucket.items.length - 3} more SKUs</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Best Sellers */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Top 5 Best Sellers (Units Sold)</h3>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {bestSellers.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No sales recorded yet</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Units Sold</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bestSellers.map((bs, i) => (
                  <tr key={bs.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-gray-400'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{bs.sku}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{bs.name}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-indigo-600">{bs.unitsSold}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">{formatThb(bs.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
