import React, { useState, useEffect } from 'react';
import { Database, ChevronDown, Loader2, AlertCircle, Calendar, Package, Eye, ChevronLeft, ChevronRight, Search, X, FileBox, Newspaper } from 'lucide-react';
import { useLineePostazioni } from '../hooks/useLineePostazioni';
import { useAcquisizioniFilter } from '../hooks/useAcquisizioniFilter';

const Acquisizioni = () => {
  const [selectedLinea, setSelectedLinea] = useState('');
  const [selectedPostazione, setSelectedPostazione] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Use the hook to get API data
  const { loading, error, getLinee, getPostazioniForLinea } = useLineePostazioni();

  // Use the acquisizioni filter hook
  const {
    data: acquisizioniData,
    loading: acquisizioniLoading,
    error: acquisizioniError
  } = useAcquisizioniFilter(selectedLinea, selectedPostazione);

  // Get available linee and postazioni
  const linee = getLinee();
  const postazioni = selectedLinea ? getPostazioniForLinea(selectedLinea) : [];

  // Reset postazione when linea changes
  useEffect(() => {
    setSelectedPostazione('');
  }, [selectedLinea]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLinea, selectedPostazione, itemsPerPage, searchTerm]);

  // Filter data based on search term
  const filteredData = acquisizioniData.filter(item => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      item.id?.toString().toLowerCase().includes(searchLower) ||
      item.codicE_ARTICOLO?.toLowerCase().includes(searchLower) ||
      item.codicE_ORDINE?.toLowerCase().includes(searchLower) ||
      (item.esitO_CQ_ARTICOLO ? 'positivo' : 'negativo').includes(searchLower) ||
      item.scostamentO_CQ_ARTICOLO?.toString().includes(searchLower) ||
      new Date(item.dT_INS).toLocaleString('it-IT').toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination with filtered data
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Database className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Acquisizione</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 p-2">Gestisci le acquisizioni del sistema</p>

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
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">Errore nel caricamento dei dati: {error}</span>
            </div>
          </div>
        )}

        {/* Dropdowns Container */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
            {/* First Dropdown - Linea di Produzione */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Linea di Produzione
              </label>
              <div className="relative group">
                <select
                  value={selectedLinea}
                  onChange={(e) => setSelectedLinea(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-gray-900 transition-all duration-200 hover:border-gray-300 group-hover:shadow-md text-sm sm:text-base"
                >
                  <option value="">Seleziona una linea...</option>
                  {linee.map((linea) => (
                    <option key={linea.value} value={linea.value}>
                      {linea.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none transition-transform group-hover:text-blue-500" />
              </div>

            </div>

            {/* Second Dropdown - Postazione */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Postazione
              </label>
              <div className="relative group">
                <select
                  value={selectedPostazione}
                  onChange={(e) => setSelectedPostazione(e.target.value)}
                  disabled={!selectedLinea || postazioni.length === 0}
                  className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-white border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer text-gray-900 transition-all duration-200 text-sm sm:text-base ${!selectedLinea || postazioni.length === 0
                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                    : 'border-gray-200 hover:border-gray-300 group-hover:shadow-md'
                    }`}
                >
                  <option value="">
                    {!selectedLinea
                      ? 'Prima seleziona una linea...'
                      : postazioni.length === 0
                        ? 'Nessuna postazione disponibile'
                        : 'Seleziona una postazione...'
                    }
                  </option>
                  {postazioni.map((postazione) => (
                    <option key={postazione.value} value={postazione.value}>
                      {postazione.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none transition-transform ${!selectedLinea || postazioni.length === 0
                  ? 'text-gray-300'
                  : 'text-gray-400 group-hover:text-green-500'
                  }`} />
              </div>

            </div>
          </div>
        )}



      </div>

      {/* Acquisizioni Results Table */}
      {selectedLinea && selectedPostazione && (
        <div className="mt-2 sm:mt-6 bg-white rounded-lg shadow-md  sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Risultati Acquisizioni
            </h2>
          </div>

          {/* Loading state for acquisizioni */}
          {acquisizioniLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Caricamento acquisizioni...</span>
            </div>
          )}

          {/* Error state for acquisizioni */}
          {acquisizioniError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">Errore: {acquisizioniError}</span>
              </div>
            </div>
          )}

          {/* Results table */}
          {!acquisizioniLoading && !acquisizioniError && (
            <>
              {acquisizioniData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nessuna acquisizione trovata per la combinazione selezionata.</p>
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
                        placeholder="Cerca in tutti i campi..."
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
                          {searchTerm && totalItems !== acquisizioniData.length && (
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
                                ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Codice Articolo
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Codice Ordine
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Esito CQ
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Scostamento
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data Inserimento
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.codicE_ARTICOLO}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.codicE_ORDINE}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.esitO_CQ_ARTICOLO
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {item.esitO_CQ_ARTICOLO ? 'Positivo' : 'Negativo'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.scostamentO_CQ_ARTICOLO}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    {new Date(item.dT_INS).toLocaleString('it-IT')}
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
                        {currentItems.map((item) => (
                          <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                            {/* Status Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg ${item.esitO_CQ_ARTICOLO
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-red-500 text-white shadow-sm'
                                  }`}>
                                  {item.esitO_CQ_ARTICOLO ? '✓ Positivo' : '✗ Negativo'}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  ID: {item.id}
                                </span>
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-4 space-y-3">
                              {/* Date and Time Information */}
                              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="text-sm font-medium">
                                    {new Date(item.dT_INS).toLocaleDateString('it-IT')}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                  {new Date(item.dT_INS).toLocaleTimeString('it-IT', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>

                              {/* Order Information */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-100">
                                  <div className="flex items-center text-blue-700">
                                    <Newspaper className="h-4 w-4 mr-2" />
                                    <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Ordine</span>
                                  </div>
                                  <span className="text-sm font-semibold text-blue-800 font-mono">
                                    {item.codicE_ORDINE}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg border border-purple-100">
                                  <div className="flex items-center text-purple-700">
                                    <FileBox className="h-4 w-4 mr-2" />
                                    <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">Articolo</span>
                                  </div>
                                  <span className="text-sm font-semibold text-purple-800 font-mono">
                                    {item.codicE_ARTICOLO}
                                  </span>
                                </div>

                                {/* Percentage Badge */}
                                <div className="flex justify-center pt-1">
                                  <span className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg border border-purple-100">
    
                                    {item.scostamentO_CQ_ARTICOLO}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Empty State inside scrollable area */}
                        {currentItems.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="mb-2">
                              {searchTerm
                                ? `Nessuna acquisizione corrisponde alla ricerca "${searchTerm}"`
                                : "Nessuna acquisizione trovata per la combinazione selezionata."
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
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Acquisizioni;