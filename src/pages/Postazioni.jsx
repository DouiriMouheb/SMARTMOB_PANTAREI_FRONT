import React, { useState, useEffect } from 'react'
import { usePostazioni } from '../hooks/usePostazioni'
import Modal from '../components/Modal'
import { Monitor, Loader2, AlertCircle, Calendar, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

function Postazioni() {
  const { data, loading, error, refetch, createPostazione, updatePostazione, deletePostazione } = usePostazioni()
  const [modalOpen, setModalOpen] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    codLineaProd: '',
    codPostazione: ''
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, searchTerm])

  // Filter data based on search term
  const filteredData = data.filter(item => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      item.codLineaProd?.toLowerCase().includes(searchLower) ||
      item.codPostazione?.toLowerCase().includes(searchLower) ||
      new Date(item.dataInserimento).toLocaleString('it-IT').toLowerCase().includes(searchLower)
    )
  })

  // Calculate pagination with filtered data
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredData.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleCreateNew = () => {
    setForm({
      codLineaProd: '',
      codPostazione: ''
    })
    setCreateMode(true)
    setEditMode(false)
    setSelectedRow(null)
    setModalOpen(true)
  }

  const handleEdit = (postazione) => {
    setForm({
      codLineaProd: postazione.codLineaProd || '',
      codPostazione: postazione.codPostazione || ''
    })
    setSelectedRow(postazione)
    setEditMode(true)
    setCreateMode(false)
    setModalOpen(true)
  }

  const handleView = (postazione) => {
    setSelectedRow(postazione)
    setCreateMode(false)
    setEditMode(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (saving) return
    
    const isValid = form.codLineaProd.trim() && form.codPostazione.trim()
    
    if (!isValid) return

    setSaving(true)
    try {
      if (createMode) {
        await createPostazione(form)
      } else if (editMode && selectedRow) {
        await updatePostazione(selectedRow.codLineaProd, selectedRow.codPostazione, {
          ...form,
          dataInserimento: selectedRow.dataInserimento
        })
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error saving postazione:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (postazione) => {
    setDeleteConfirm(postazione)
    setShowDeleteConfirm(true)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteConfirm(null)
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirm && !deleting) {
      setDeleting(true)
      try {
        await deletePostazione(deleteConfirm.codLineaProd, deleteConfirm.codPostazione)
        setShowDeleteConfirm(false)
        setDeleteConfirm(null)
      } catch (error) {
        console.error('Error deleting postazione:', error)
      } finally {
        setDeleting(false)
      }
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setCreateMode(false)
    setEditMode(false)
    setSelectedRow(null)
    setForm({
      codLineaProd: '',
      codPostazione: ''
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('it-IT')
  }

  const getModalFooter = () => {
    if (createMode || editMode) {
      const isValid = form.codLineaProd.trim() && form.codPostazione.trim()

      return (
        <>
          <button 
            type="button" 
            className="px-3 py-1 bg-gray-300 rounded" 
            onClick={handleCloseModal}
            disabled={saving}
          >
            Annulla
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded flex items-center ${
              isValid && !saving 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isValid || saving}
            onClick={handleSave}
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : null}
            {saving ? 'Salvando...' : (createMode ? 'Crea' : 'Salva')}
          </button>
        </>
      )
    } else {
      return (
        <>
          <button
            type="button"
            className="px-3 py-1 bg-blue-500 text-white rounded flex items-center"
            onClick={() => handleEdit(selectedRow)}
          >
            <Edit size={16} className="mr-1" />
            Modifica
          </button>
          <button
            type="button"
            className="px-3 py-1 bg-red-600 text-white rounded flex items-center"
            onClick={() => handleDeleteClick(selectedRow)}
          >
            <Trash2 size={16} className="mr-1" />
            Elimina
          </button>
          <button 
            type="button" 
            className="px-3 py-1 bg-gray-300 rounded" 
            onClick={handleCloseModal}
          >
            Chiudi
          </button>
        </>
      )
    }
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Postazioni</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 p-2">Gestisci le postazioni del sistema</p>

        {/* Add Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Nuova Postazione
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Caricamento dati...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Errore nel caricamento dei dati: {error}</span>
          </div>
        </div>
      )}

      {/* Results Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Lista Postazioni
            </h2>
          </div>

          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nessuna postazione trovata.</p>
            </div>
          ) : (
            <>
              {/* Search Bar - Fixed at Top */}
              <div className="mb-4 sm:mb-6">
                <div className="relative w-full sm:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cerca postazioni..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white text-sm sm:text-base"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items per page selector and total count - Fixed at Top */}
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                      Per pagina:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>

                    <div className="text-xs text-gray-600 font-medium text-center sm:text-right">
                      Totale: {totalItems}
                      {searchTerm && totalItems !== data.length && (
                        <span className="text-blue-600 ml-1">(filtrati)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex flex-col h-[calc(100vh-400px)] min-h-[400px]">
                {/* Desktop Table View - Hidden on Mobile */}
                <div className="hidden md:block overflow-x-auto flex-1">
                  <div className="overflow-y-auto h-full">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Codice Linea
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Codice Postazione
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Inserimento
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Azioni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((item, index) => (
                          <tr 
                            key={`${item.codLineaProd}-${item.codPostazione}`} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleView(item)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {item.codLineaProd}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                {item.codPostazione}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                {new Date(item.dataInserimento).toLocaleString('it-IT')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleView(item)}
                                  className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                  title="Visualizza"
                                >
                                  <Monitor size={16} />
                                </button>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Modifica"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Elimina"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View - Scrollable Container */}
                <div className="md:hidden flex-1 overflow-y-auto px-1">
                  <div className="space-y-3 pb-4">
                    {currentItems.map((item, index) => (
                      <div 
                        key={`${item.codLineaProd}-${item.codPostazione}`} 
                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleView(item)}
                      >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500 text-white shadow-sm">
                              Postazione
                            </span>
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleView(item)}
                                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                title="Visualizza"
                              >
                                <Monitor size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Modifica"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Elimina"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 space-y-3">
                          {/* Date Information */}
                          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="text-sm font-medium">
                                {new Date(item.dataInserimento).toLocaleDateString('it-IT')}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              {new Date(item.dataInserimento).toLocaleTimeString('it-IT', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          {/* Code Information */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="flex items-center text-blue-700">
                                <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Linea</span>
                              </div>
                              <span className="text-sm font-semibold text-blue-800 font-mono">
                                {item.codLineaProd}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-100">
                              <div className="flex items-center text-green-700">
                                <span className="text-xs text-green-600 font-medium uppercase tracking-wide">Postazione</span>
                              </div>
                              <span className="text-sm font-semibold text-green-800 font-mono">
                                {item.codPostazione}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Empty State inside scrollable area */}
                    {currentItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="mb-2">
                          {searchTerm
                            ? `Nessuna postazione corrisponde alla ricerca "${searchTerm}"`
                            : "Nessuna postazione trovata."
                          }
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Cancella Ricerca
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pagination Controls - Fixed at Bottom */}
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 shadow-sm'
                      }`}
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Prec</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                      let page;
                      if (totalPages <= 3) {
                        page = i + 1;
                      } else if (currentPage <= 2) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        page = totalPages - 2 + i;
                      } else {
                        page = currentPage - 1 + i;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${currentPage === page
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {totalPages > 3 && currentPage < totalPages - 1 && (
                      <>
                        <span className="px-1 text-gray-400 text-xs">•••</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 shadow-sm'
                      }`}
                  >
                    <span className="hidden xs:inline">Succ</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <div className="text-xs text-gray-600 font-medium bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 text-center sm:text-left">
                  <span className="sm:hidden">
                    {totalItems > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalItems)} di {totalItems}
                  </span>
                  <span className="hidden sm:inline">
                    Mostrando {totalItems > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalItems)} di {totalItems} elementi
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Modal */}
      <Modal 
        open={modalOpen} 
        title={createMode ? "Nuovo Record" : (editMode ? "Modifica Record" : "Dettagli Record")}
        footer={getModalFooter()}
      >
        {createMode && (
          <div className="flex flex-col gap-4">
            {/* Cod. Linea Prod */}
            <div>
              <label className="font-semibold block mb-1">Cod. Linea Prod: <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.codLineaProd}
                onChange={(e) => setForm(prev => ({ ...prev, codLineaProd: e.target.value }))}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  form.codLineaProd.length > 50 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci codice linea produzione"
                maxLength={50}
              />
              <div className="text-xs text-gray-500 mt-1">
                {form.codLineaProd.length}/50 caratteri
                {form.codLineaProd.length > 50 && (
                  <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                )}
              </div>
            </div>

            {/* Cod. Postazione */}
            <div>
              <label className="font-semibold block mb-1">Cod. Postazione: <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.codPostazione}
                onChange={(e) => setForm(prev => ({ ...prev, codPostazione: e.target.value }))}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  form.codPostazione.length > 50 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci codice postazione"
                maxLength={50}
              />
              <div className="text-xs text-gray-500 mt-1">
                {form.codPostazione.length}/50 caratteri
                {form.codPostazione.length > 50 && (
                  <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                )}
              </div>
            </div>
          </div>
        )}

        {editMode && (
          <div className="flex flex-col gap-4">
            {/* Cod. Linea Prod */}
            <div>
              <label className="font-semibold block mb-1">Cod. Linea Prod: <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.codLineaProd}
                onChange={(e) => setForm(prev => ({ ...prev, codLineaProd: e.target.value }))}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  form.codLineaProd.length > 50 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci codice linea produzione"
                maxLength={50}
              />
              <div className="text-xs text-gray-500 mt-1">
                {form.codLineaProd.length}/50 caratteri
                {form.codLineaProd.length > 50 && (
                  <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                )}
              </div>
            </div>

            {/* Cod. Postazione */}
            <div>
              <label className="font-semibold block mb-1">Cod. Postazione: <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.codPostazione}
                onChange={(e) => setForm(prev => ({ ...prev, codPostazione: e.target.value }))}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  form.codPostazione.length > 50 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci codice postazione"
                maxLength={50}
              />
              <div className="text-xs text-gray-500 mt-1">
                {form.codPostazione.length}/50 caratteri
                {form.codPostazione.length > 50 && (
                  <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                )}
              </div>
            </div>
          </div>
        )}

        {!createMode && !editMode && selectedRow && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold block mb-1">Cod. Linea Prod:</label>
                <p className="p-2 bg-gray-50 rounded border">{selectedRow.codLineaProd}</p>
              </div>
              <div>
                <label className="font-semibold block mb-1">Cod. Postazione:</label>
                <p className="p-2 bg-gray-50 rounded border">{selectedRow.codPostazione}</p>
              </div>
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Data Inserimento:</label>
                <p className="p-2 bg-gray-50 rounded border">{formatDate(selectedRow.dataInserimento)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        open={showDeleteConfirm} 
        title="Conferma Eliminazione"
        size="md"
        footer={
          <>
            <button 
              type="button" 
              className="px-3 py-1 bg-gray-300 rounded" 
              onClick={handleCancelDelete}
              disabled={deleting}
            >
              Annulla
            </button>
            <button
              type="button"
              className="px-3 py-1 bg-red-500 text-white rounded flex items-center"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? (
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : <Trash2 size={16} className="mr-1" />}
              Elimina
            </button>
          </>
        }
      >
        <div className="text-center py-4">
          <p className="text-lg mb-2">Sei sicuro di voler eliminare questo record?</p>
          <p className="text-gray-600 mb-4">Questa azione non può essere annullata.</p>
          {deleteConfirm && (
            <div className="bg-gray-50 p-3 rounded text-left">
              <p className="text-sm">
                <strong>Linea:</strong> {deleteConfirm.codLineaProd}<br />
                <strong>Postazione:</strong> {deleteConfirm.codPostazione}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Postazioni