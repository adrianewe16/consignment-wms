'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Dealer } from '@/lib/supabase'
import DealerModal from '@/components/DealerModal'
import UploadSKUModal from '@/components/UploadSKUModal'
import StockInModal from '@/components/StockInModal'
import StockOutModal from '@/components/StockOutModal'
import InventoryTab from '@/components/InventoryTab'
import TimelineTab from '@/components/TimelineTab'
import ReconciliationTab from '@/components/ReconciliationTab'
import PasswordModal from '@/components/PasswordModal'
import {
  Users, Upload, ArrowDown, ArrowUp, ChevronDown,
  Package, Trash2, LayoutList, Clock, BarChart2
} from 'lucide-react'

type Tab = 'inventory' | 'timeline' | 'reconciliation'

export default function Home() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('inventory')
  const [refresh, setRefresh] = useState(0)

  const [showDealerModal, setShowDealerModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showStockIn, setShowStockIn] = useState(false)
  const [showStockOut, setShowStockOut] = useState(false)
  const [showDeleteDealer, setShowDeleteDealer] = useState(false)
  const [dealerDropdown, setDealerDropdown] = useState(false)

  const fetchDealers = async () => {
    const { data } = await supabase.from('dealers').select('*').order('name')
    setDealers(data || [])
    if (data && data.length > 0 && !selectedDealer) {
      setSelectedDealer(data[0])
    }
  }

  useEffect(() => { fetchDealers() }, [refresh])

  const handleDeleteDealer = async () => {
    if (!selectedDealer) return
    await supabase.from('dealers').delete().eq('id', selectedDealer.id)
    setSelectedDealer(null)
    setRefresh(r => r + 1)
  }

  const tabRefresh = () => setRefresh(r => r + 1)

  const TABS = [
    { id: 'inventory' as Tab, label: 'Inventory', icon: LayoutList },
    { id: 'timeline' as Tab, label: 'Timeline', icon: Clock },
    { id: 'reconciliation' as Tab, label: 'Reconciliation', icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-[#f8f8fc]">
      {/* Modals */}
      {showDealerModal && <DealerModal onClose={() => setShowDealerModal(false)} onSaved={() => setRefresh(r => r + 1)} />}
      {showUploadModal && <UploadSKUModal onClose={() => setShowUploadModal(false)} onSaved={() => setRefresh(r => r + 1)} />}
      {showStockIn && selectedDealer && (
        <StockInModal dealerId={selectedDealer.id} onClose={() => setShowStockIn(false)} onSaved={tabRefresh} />
      )}
      {showStockOut && selectedDealer && (
        <StockOutModal dealerId={selectedDealer.id} onClose={() => setShowStockOut(false)} onSaved={tabRefresh} />
      )}
      {showDeleteDealer && (
        <PasswordModal
          onConfirm={handleDeleteDealer}
          onCancel={() => setShowDeleteDealer(false)}
          message={`Dealer "${selectedDealer?.name}" and all its data will be deleted.`}
        />
      )}

      {/* Top Nav */}
      <header className="bg-[#1a1a2e] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-bold tracking-tight">Consignment WMS</span>
                <span className="text-white/40 text-xs ml-2">v1.0</span>
              </div>
            </div>

            {/* Management row */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDealerModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors font-medium"
              >
                <Users className="w-4 h-4" />
                Add Dealer
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload SKU
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dealer Selector + Actions Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Dealer selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dealer</span>
              <div className="relative">
                <button
                  onClick={() => setDealerDropdown(d => !d)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 transition-colors min-w-[200px]"
                >
                  {selectedDealer ? (
                    <span className="flex items-center gap-2 flex-1">
                      <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{selectedDealer.id}</span>
                      {selectedDealer.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">Select dealer…</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {dealerDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDealerDropdown(false)} />
                    <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[240px]">
                      {dealers.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-400">No dealers yet</p>
                      ) : dealers.map(d => (
                        <button key={d.id} onClick={() => { setSelectedDealer(d); setDealerDropdown(false) }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left transition-colors ${selectedDealer?.id === d.id ? 'bg-indigo-50' : ''}`}>
                          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{d.id}</span>
                          <span className="font-medium text-gray-900">{d.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {selectedDealer && (
                <button onClick={() => setShowDeleteDealer(true)} title="Delete dealer"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectedDealer && setShowStockIn(true)}
                disabled={!selectedDealer}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors font-medium shadow-sm"
              >
                <ArrowDown className="w-4 h-4" />
                Stock In
              </button>
              <button
                onClick={() => selectedDealer && setShowStockOut(true)}
                disabled={!selectedDealer}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors font-medium shadow-sm"
              >
                <ArrowUp className="w-4 h-4" />
                Stock Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {!selectedDealer ? (
          <div className="text-center py-24">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-500 mb-2">No dealer selected</h2>
            <p className="text-sm text-gray-400 mb-6">Add a dealer to get started</p>
            <button onClick={() => setShowDealerModal(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
              Add First Dealer
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#1a1a2e] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div key={`${selectedDealer.id}-${activeTab}-${refresh}`}>
              {activeTab === 'inventory' && <InventoryTab dealer={selectedDealer} />}
              {activeTab === 'timeline' && <TimelineTab dealer={selectedDealer} />}
              {activeTab === 'reconciliation' && <ReconciliationTab dealer={selectedDealer} />}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
