import React, { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import { Database, ChevronDown, Loader2, AlertCircle, Calendar, Package, Eye, ChevronLeft, ChevronRight, Search, X, FileBox, Newspaper, Camera, CheckCircle } from 'lucide-react';
import { useLineePostazioni } from '../hooks/useLineePostazioni';
import { useAcquisizioniFilter } from '../hooks/useAcquisizioniFilter';
import ApiService from '../services/ApiService';
import { handleError, logError } from '../utils/errorHandler';

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

  // Filter data based on search term — scan all fields (including nested) for a match
  const filteredData = acquisizioniData.filter(item => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    // Helper: recursively walk item and collect textual representations
    const seen = new Set();
    const parts = [];
    const walk = (val) => {
      if (val === null || val === undefined) return;
      // avoid circular
      if (typeof val === 'object') {
        if (seen.has(val)) return;
        seen.add(val);
        // handle Date objects
        if (val instanceof Date) {
          parts.push(val.toLocaleString('it-IT'));
          return;
        }
        for (const k of Object.keys(val)) {
          try { walk(val[k]); } catch (e) { /* ignore */ }
        }
        return;
      }
      if (typeof val === 'boolean') {
        parts.push(val ? 'positivo' : 'negativo');
        return;
      }
      // numbers, strings, etc.
      parts.push(String(val));
    };

    walk(item);

    const haystack = parts.join(' ').toLowerCase();
    return haystack.includes(searchLower);
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

  // Modal for item details
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // Image states for modal
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Analysis modal state
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analyzedImage, setAnalyzedImage] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [currentAnalyzingItem, setCurrentAnalyzingItem] = useState(null);
  const analyzedImageObjectUrlRef = useRef(null);

  const openDetail = (item) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailItem(null);
  };

  // Analyze photo via QualityControlVisual API
  const handleAnalyzePhoto = async (item) => {
    setAnalysisError(null);
    setAnalysisLoading(true);
    setAnalyzedImage(null);
    setCurrentAnalyzingItem(item);
    setIsAnalysisModalOpen(true);

    const filename = (() => {
      const photoField = item.fotoAcquisizione || item.fotO_SUPERIORE || item.fotO_FRONTALE;
      if (!photoField) return null;
      const s = String(photoField || '');
      const parts = s.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1] : null;
    })();

    try {
      if (!filename) {
        throw new Error('Nessuna immagine disponibile da analizzare');
      }

      if (import.meta.env.DEV) {
        console.log('[Analysis] Sending filename:', filename);
      }
      
      const resultBlob = await ApiService.forwardImageToQualityControl(filename);
      
      if (import.meta.env.DEV) {
        console.log('[Analysis] Received analyzed image');
      }

      const objectURL = URL.createObjectURL(resultBlob);
      try { 
        if (analyzedImageObjectUrlRef.current) {
          URL.revokeObjectURL(analyzedImageObjectUrlRef.current);
        }
      } catch (e) {
        logError(e, 'Failed to revoke previous analyzed image URL');
      }
      analyzedImageObjectUrlRef.current = objectURL;
      setAnalyzedImage(objectURL);
    } catch (err) {
      const parsedError = handleError(err, {
        context: 'Analisi immagine',
        showToast: false, // Error shown in modal
      });
      setAnalysisError(parsedError.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Cleanup analyzed image on unmount
  useEffect(() => {
    return () => {
      try {
        if (analyzedImageObjectUrlRef.current) {
          URL.revokeObjectURL(analyzedImageObjectUrlRef.current);
        }
      } catch (e) {
        logError(e, 'Failed to cleanup analyzed image URL on unmount');
      }
    };
  }, []);

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
                                Spine Contate
                              </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Spine Attese
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data Inserimento
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(item)}>
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
                                  {/* Spine Contate */}
                                  {item.numSpineContate ?? item.num_spine_contate ?? 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {/* Spine Attese */}
                                  {item.numSpineAttese ?? item.num_spine_attese ?? 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    {item.dT_INS ? new Date(item.dT_INS).toLocaleString('it-IT') : '-'}
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
                          <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => openDetail(item)}>
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

                             
                                <div className="flex justify-between gap-3 pt-1">
                                  <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                                    <span className="text-xs text-gray-600">Spine Contate</span>
                                    <strong className="text-sm text-gray-900">{item.numSpineContate ?? item.num_spine_contate ?? 0}</strong>
                                  </div>
                                  <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                                    <span className="text-xs text-gray-600">Spine Attese</span>
                                    <strong className="text-sm text-gray-900">{item.numSpineAttese ?? item.num_spine_attese ?? 'N/A'}</strong>
                                  </div>
                                </div>

                                {/* Analizza Foto Button */}
                                {(item.fotoAcquisizione || item.fotO_SUPERIORE || item.fotO_FRONTALE) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAnalyzePhoto(item);
                                    }}
                                    className="w-full mt-3 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Analizza Foto
                                  </button>
                                )}
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
      {/* Detail modal */}
      <Modal open={detailOpen} title={detailItem ? `Acquisizione ${detailItem.codicE_ARTICOLO}` : ''} onBackdropClick={closeDetail} footer={<button onClick={closeDetail} className="px-3 py-1 bg-blue-600 text-white rounded">Chiudi</button>}>
        {detailItem ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {/* single-photo block */}
                <div className="mt-6 w-full max-w-xl mx-auto">
                
                  <div className="rounded border overflow-hidden bg-white">
                    {(() => {
                      if (!detailItem) return null;
                      const s = String(detailItem.fotoAcquisizione || detailItem.fotoAcquisizione || '');
                      const parts = s.split('/').filter(Boolean);
                      const name = parts.length ? parts[parts.length - 1] : '';
                      if (!name) return (
                        <div className="flex flex-col items-center justify-center h-56 bg-gray-50 text-gray-400 p-4">
                          <Camera className="w-12 h-12 mb-2" />
                          <div className="text-sm">Immagine non disponibile</div>
                        </div>
                      );
                      const base = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, '');
                      const displayPhoto = `${base}/api/images/public/${encodeURIComponent(name)}`;

                      return (
                        <>
                          {!imgError && (
                            <div className="relative">
                              {!imgLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                  <div className="animate-pulse flex items-center gap-3 text-gray-400">
                                    <Camera className="w-6 h-6" />
                                    <span>Caricamento immagine…</span>
                                  </div>
                                </div>
                              )}
                              <img
                                src={displayPhoto}
                                alt="Foto acquisizione"
                                className={`w-full h-56 object-cover cursor-pointer transition-transform duration-300 ${imgLoaded ? 'transform hover:scale-105' : ''}`}
                                onClick={() => setIsLightboxOpen(true)}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgError(true)}
                              />
                              <div className="absolute left-2 top-2 bg-black bg-opacity-40 text-white text-xs px-2 py-1 rounded">{decodeURIComponent(displayPhoto.split('/').pop() || '')}</div>
                            </div>
                          )}
                          {imgError && (
                            <div className="flex flex-col items-center justify-center h-56 bg-gray-50 text-gray-400 p-4">
                              <Camera className="w-12 h-12 mb-2" />
                              <div className="text-sm">Immagine non disponibile</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Lightbox modal */}
                  {isLightboxOpen && detailItem && (() => {
                    const filename = String(detailItem.fotoAcquisizione || '').split('/').filter(Boolean).pop();
                    if (!filename) return null;
                    const base = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, '');
                    const displayPhoto = `${base}/api/images/public/${encodeURIComponent(filename)}`;
                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setIsLightboxOpen(false)}>
                        <div className="max-w-[90%] max-h-[90%]" onClick={(e) => e.stopPropagation()}>
                          <img src={displayPhoto} alt="Foto ingrandita" className="w-full h-auto max-h-[90vh] object-contain rounded shadow-lg" />
                          <div className="text-right mt-2">
                            <button onClick={() => setIsLightboxOpen(false)} className="px-3 py-1 bg-white text-gray-800 rounded">Chiudi</button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Analizza Foto Button in Detail Modal */}
                {(detailItem.fotoAcquisizione || detailItem.fotO_SUPERIORE || detailItem.fotO_FRONTALE) && (
                  <button
                    onClick={() => handleAnalyzePhoto(detailItem)}
                    className="w-full mt-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Analizza Foto
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div><strong>Codice Articolo:</strong> {detailItem.codicE_ARTICOLO ?? detailItem.codiceArticolo}</div>
                <div><strong>Codice Ordine:</strong> {detailItem.codicE_ORDINE}</div>
                <div><strong>ID Catasta:</strong> {detailItem.idCatasta ?? detailItem.idCatasta}</div>
                <div><strong>Linea:</strong> {detailItem.codLinea ?? detailItem.codLinea ?? detailItem.codicE_LINEA}</div>
                <div><strong>Postazione:</strong> {detailItem.codPostazione ?? detailItem.codicE_POSTAZIONE}</div>
                <div><strong>Abilita CQ:</strong> {detailItem.abilitaCq !== undefined ? (detailItem.abilitaCq ? 'Sì' : 'No') : (detailItem.abilitA_CQ ? 'Sì' : 'No')}</div>
                <div><strong>Esito CQ Articolo:</strong> {detailItem.esitoCqArticolo ?? detailItem.esitO_CQ_ARTICOLO ?? 'N/A'}</div>
                <div><strong>Spine Contate:</strong> {detailItem.numSpineContate ?? detailItem.num_spine_contate ?? 0}</div>
                <div><strong>Spine Attese:</strong> {detailItem.numSpineAttese ?? detailItem.num_spine_attese ?? 'N/A'}</div>
                <div><strong>Data Inserimento:</strong> {detailItem.dT_INS ? new Date(detailItem.dT_INS).toLocaleString('it-IT') : '-'}</div>
              </div>
            </div>

           
              <div>
                <h4 className="font-semibold">Descrizione</h4>
                <p className="text-sm text-gray-700">{detailItem.descrizione}</p>
              </div>
          
          </div>
        ) : null}
      </Modal>

      {/* Analysis Modal */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-[100] p-2" onClick={() => setIsAnalysisModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-bold text-black">
                    Analisi Foto - {currentAnalyzingItem?.codicE_ARTICOLO || 'N/A'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAnalysisModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {analysisLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
                  <p className="text-lg text-gray-900 font-medium">Analisi in corso...</p>
                  <p className="text-sm text-gray-600 mt-2">Elaborazione immagine tramite Quality Control API</p>
                </div>
              )}

              {analysisError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-red-800 font-semibold mb-2">Errore durante l'analisi</h4>
                    <p className="text-red-700">{analysisError}</p>
                  </div>
                </div>
              )}

              {analyzedImage && !analysisLoading && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">Analisi completata con successo</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    <img
                      src={analyzedImage}
                      alt="Foto analizzata"
                      className="w-full h-auto object-contain rounded shadow-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsAnalysisModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Chiudi
              </button>
              {analyzedImage && (
                <a
                  href={analyzedImage}
                  download="foto-analizzata.jpg"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Scarica
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Acquisizioni;