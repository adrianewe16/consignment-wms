'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function DealerModal({ onClose, onSaved }: Props) {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!id.trim() || !name.trim()) return setError('Both fields required')
    setLoading(true)
    const { error: err } = await supabase.from('dealers').insert({ id: id.trim().toUpperCase(), name: name.trim() })
    setLoading(false)
    if (err) return setError(err.message)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Add Dealer</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dealer ID</label>
            <input value={id} onChange={e => setId(e.target.value)} placeholder="e.g. DLR001"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 uppercase" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dealer Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full dealer name"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving…' : 'Add Dealer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
