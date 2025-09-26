import { useState, useEffect } from 'react'
import ApiService from '../services/ApiService'

export const useAcquisizioniFilter = (codLinea, codPostazione) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAcquisizioni = async () => {
    if (!codLinea || !codPostazione) {
      setData([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.getAcquisizioniFiltered(codLinea, codPostazione)
      
      // Transform the data to match the expected field names from your component
      const transformedData = result.map(item => ({
        ...item,
        // Map API fields to component expected fields
        codicE_ARTICOLO: item.codiceArticolo || item.codicE_ARTICOLO,
        codicE_ORDINE: item.codiceOrdine || item.codicE_ORDINE || `ORD-${item.id}`,
        esitO_CQ_ARTICOLO: item.esitoCqArticolo !== undefined ? item.esitoCqArticolo : item.esitO_CQ_ARTICOLO,
        scostamentO_CQ_ARTICOLO: item.scostamentoCqArticolo || item.scostamentO_CQ_ARTICOLO || 0,
        dT_INS: item.dataInserimento || item.dT_INS
      }))
      
      setData(transformedData)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching filtered acquisizioni:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAcquisizioni()
  }, [codLinea, codPostazione])

  return {
    data,
    loading,
    error,
    refetch: fetchAcquisizioni
  }
}