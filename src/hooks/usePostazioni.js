import { useState, useEffect } from 'react'
import ApiService from '../services/ApiService'
import toast from 'react-hot-toast'

export const usePostazioni = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPostazioni = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.getPostazioni()
      setData(result)
    } catch (err) {
      setError(err.message)
      setData([]) // Always set data to empty array on error
      console.error('Error fetching postazioni:', err)
    } finally {
      setLoading(false)
    }
  }

  const createPostazione = async (postazioneData) => {
    try {
      const newPostazione = await ApiService.createPostazione(postazioneData)
      setData(prev => [...prev, newPostazione])
      toast.success('Postazione creata con successo!')
      return newPostazione
    } catch (err) {
      toast.error(`Errore nella creazione: ${err.message}`)
      throw err
    }
  }

  const updatePostazione = async (codLineaProd, codPostazione, postazioneData) => {
    try {
      const updatedPostazione = await ApiService.updatePostazione(codLineaProd, codPostazione, postazioneData)
      setData(prev => prev.map(item => 
        item.codLineaProd === codLineaProd && item.codPostazione === codPostazione 
          ? updatedPostazione 
          : item
      ))
      toast.success('Postazione aggiornata con successo!')
      return updatedPostazione
    } catch (err) {
      toast.error(`Errore nell'aggiornamento: ${err.message}`)
      throw err
    }
  }

  const deletePostazione = async (codLineaProd, codPostazione) => {
    try {
      await ApiService.deletePostazione(codLineaProd, codPostazione)
      setData(prev => prev.filter(item => 
        !(item.codLineaProd === codLineaProd && item.codPostazione === codPostazione)
      ))
      toast.success('Postazione eliminata con successo!')
    } catch (err) {
      toast.error(`Errore nell'eliminazione: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    fetchPostazioni()
  }, [])

  const refetch = () => {
    fetchPostazioni()
  }

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    createPostazione, 
    updatePostazione, 
    deletePostazione 
  }
}