'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function UploadSKUModal({ onClose, onSaved }: Props) {
  const [rows, setRows] = useState<any[]>([])
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data as any[]
        setRows(parsed)
        setPreview(parsed.slice(0, 5))
        setError('')
      },
      error: (err) => setError(err.message)
    })
  }

  const handleUpload = async () => {
    if (!rows.length) return
    setLoading(true)
    let ok = 0, fail = 0

    // Upsert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50).map(r => ({
        sku: String(r.sku || r.SKU || '').trim(),
        name: String(r.name || r.Name || r.product || '').trim(),
        category: String(r.category || r.Category || '').trim() || null,
        srp: parseFloat(r.srp || r.SRP || r.price || '0') || 0,
      })).filter(r => r.sku && r.name)

      const { error: err, data } = await supabase.from('products').upsert(batch, { onConflict: 'sku' })
      if (err) fail += batch.length
      else ok += batch.length
    }

    setLoading(false)
    setResult({ ok, fail })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Upload SKU Catalog</h3>
            <p className="text-xs text-gray-500 mt-0.5">CSV with columns: sku, name, category, srp</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {!result ? (
          <>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onDragOver={e => e.preventDefault()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Drop CSV here or <span className="text-indigo-600 font-medium">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">Upserts on SKU — existing products will be updated</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            {preview.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Preview ({rows.length} rows)</p>
                <div className="overflow-auto rounded-lg border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>{Object.keys(preview[0]).map(k => <th key={k} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{k}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {Object.values(r).map((v: any, j) => <td key={j} className="px-3 py-1.5 text-gray-700">{v}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpload} disabled={loading || !rows.length} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Uploading…' : `Upload ${rows.length} Products`}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-gray-900 text-lg">Upload Complete</p>
            <p className="text-sm text-gray-500 mt-1">{result.ok} products saved{result.fail > 0 ? `, ${result.fail} failed` : ''}</p>
            <button onClick={() => { onSaved(); onClose() }} className="mt-5 px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
