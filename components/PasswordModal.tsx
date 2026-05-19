'use client'
import { useState } from 'react'
import { X, Lock } from 'lucide-react'

const DELETE_PASSWORD = '3913'

interface Props {
  onConfirm: () => void
  onCancel: () => void
  message?: string
}

export default function PasswordModal({ onConfirm, onCancel, message = 'This action cannot be undone.' }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (value === DELETE_PASSWORD) {
      onConfirm()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Delete Confirmation</h3>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <input
          type="password"
          value={value}
          onChange={e => { setValue(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter password"
          autoFocus
          className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-400'
          }`}
        />
        {error && <p className="text-red-500 text-xs mt-1">Incorrect password</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
