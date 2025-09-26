import { useState, useEffect } from 'react'
import ApiService from '../services/ApiService'

export const useLineePostazioni = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.getPostazioniPerLinea()
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching linee postazioni:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Get unique linee for dropdown
  const getLinee = () => {
    return data.map(item => ({
      value: item.coD_LINEA_PROD,
      label: item.coD_LINEA_PROD
    }))
  }

  // Get postazioni for a specific linea
  const getPostazioniForLinea = (codLinea) => {
    const linea = data.find(item => item.coD_LINEA_PROD === codLinea)
    if (!linea || !linea.coD_POSTAZIONE || linea.coD_POSTAZIONE.length === 0) {
      return []
    }

    // Parse the comma-separated string of postazioni
    const postazioniString = linea.coD_POSTAZIONE[0] || ''
    const postazioni = postazioniString.split(',').filter(p => p.trim())
    
    return postazioni.map(postazione => ({
      value: postazione.trim(),
      label: postazione.trim()
    }))
  }

  return {
    data,
    loading,
    error,
    getLinee,
    getPostazioniForLinea,
    refetch: fetchData
  }
}