import { useState, useEffect } from 'react'
import ApiService from '../services/ApiService'
import { handleError } from '../utils/errorHandler'

export const useAcquisizioni = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAcquisizioni = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.getAcquisizioni()
      setData(result)
    } catch (err) {
      const parsedError = handleError(err, {
        context: 'Caricamento acquisizioni',
        showToast: true,
      })
      setError(parsedError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAcquisizioni()
  }, [])

  const refetch = () => {
    fetchAcquisizioni()
  }

  return { data, loading, error, refetch }
}