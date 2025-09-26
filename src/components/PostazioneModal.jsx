import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

function PostazioneModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  postazione = null, 
  title = "Nuova Postazione" 
}) {
  const [formData, setFormData] = useState({
    codLineaProd: '',
    codPostazione: ''
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (postazione) {
      setFormData({
        codLineaProd: postazione.codLineaProd || '',
        codPostazione: postazione.codPostazione || ''
      })
    } else {
      setFormData({
        codLineaProd: '',
        codPostazione: ''
      })
    }
  }, [postazione, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.codLineaProd.trim() || !formData.codPostazione.trim()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="codLineaProd" className="block text-sm font-medium text-gray-700 mb-2">
              Codice Linea Produzione *
            </label>
            <input
              type="text"
              id="codLineaProd"
              value={formData.codLineaProd}
              onChange={(e) => setFormData(prev => ({ ...prev, codLineaProd: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Inserisci codice linea"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="codPostazione" className="block text-sm font-medium text-gray-700 mb-2">
              Codice Postazione *
            </label>
            <input
              type="text"
              id="codPostazione"
              value={formData.codPostazione}
              onChange={(e) => setFormData(prev => ({ ...prev, codPostazione: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Inserisci codice postazione"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.codLineaProd.trim() || !formData.codPostazione.trim()}
            >
              {loading ? 'Salvando...' : (postazione ? 'Aggiorna' : 'Crea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostazioneModal