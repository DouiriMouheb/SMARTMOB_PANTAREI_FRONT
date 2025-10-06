import { useState, useEffect } from 'react'
import ApiService from '../services/ApiService'
import toast from 'react-hot-toast'
import { handleError } from '../utils/errorHandler'

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
      const parsedError = handleError(err, {
        context: 'Caricamento postazioni',
        showToast: true,
      })
      setError(parsedError.message)
      setData([]) // Always set data to empty array on error
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
      handleError(err, {
        context: 'Creazione postazione',
        showToast: true,
      })
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
      handleError(err, {
        context: 'Aggiornamento postazione',
        showToast: true,
      })
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
      handleError(err, {
        context: 'Eliminazione postazione',
        showToast: true,
      })
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