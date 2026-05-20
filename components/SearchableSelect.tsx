'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
  sublabel?: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  emptyMessage = 'No SKU found — try a different keyword',
  className = ''
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.value.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel || '').toLowerCase().includes(search.toLowerCase())
  )

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-300 outline-none focus:border-indigo-400 text-left"
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selected ? (
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex-shrink-0">{selected.value}</span>
              <span className="truncate">{selected.sublabel || selected.label}</span>
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden" style={{ minWidth: '480px' }}>
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by SKU or product name…"
              className="flex-1 text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {value && (
              <button
                onClick={() => { onChange(''); setOpen(false); setSearch('') }}
                className="w-full px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-50 border-b border-gray-100"
              >
                — Clear selection —
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-500 font-medium">No SKU found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
              </div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${value === o.value ? 'bg-indigo-50' : ''}`}
                >
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex-shrink-0 w-44 truncate">{o.value}</span>
                  <span className="text-sm text-gray-800">{o.sublabel || o.label}</span>
                </button>
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
