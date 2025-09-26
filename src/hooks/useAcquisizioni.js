import { useState, useEffect } from 'react'
import ApiService from '../services/ApiService'

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
      setError(err.message)
      console.error('Error fetching acquisizioni:', err)
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