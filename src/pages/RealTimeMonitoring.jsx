import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  ChevronDown,
  Loader2,
  AlertCircle,
  Package,
  Eye,
  Clock,
  CheckCircle,
  Wifi,
  Camera
} from 'lucide-react';
import { useLineePostazioni } from '../hooks/useLineePostazioni';
import useAcquisizioniRealtime from '../hooks/useAcquisizioniRealTime';

const RealtimeLatestSingle = () => {
  const [selectedLinea, setSelectedLinea] = useState('');
  const [selectedPostazione, setSelectedPostazione] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { loading: dropdownLoading, error: dropdownError, getLinee, getPostazioniForLinea } = useLineePostazioni();

  const {
    acquisizioni,
    isLoading,
    error,
    connectionState,
    reconnect,
    sendMessage,
    subscribe,
    refreshData,
    lastUpdated,
    recordCount,
  } = useAcquisizioniRealtime();

  // track current subscribed pair to avoid re-subscribing when provided functions change identity
  const subscribedRef = useRef({ linea: null, postazione: null });
  const lastSeenUpdateRef = useRef(null);
  const lastSeenCountRef = useRef(null);

  useEffect(() => {
    if (!selectedLinea || !selectedPostazione) {
      // clear tracked subscription when selection is cleared
      subscribedRef.current = { linea: null, postazione: null };
      return;
    }

    // only refresh/subscribe when the selected pair actually changes
    const already = subscribedRef.current;
    if (already.linea === selectedLinea && already.postazione === selectedPostazione) return;

    // call refresh and subscribe (best-effort) once per new selection
    try {
      if (typeof refreshData === 'function') refreshData(selectedLinea, selectedPostazione);
    } catch (e) {
      // swallow - best effort
    }

    try {
      if (typeof subscribe === 'function') {
        subscribe(selectedLinea, selectedPostazione);
      } else if (sendMessage) {
        sendMessage('SubscribeToLineaPostazione', selectedLinea, selectedPostazione);
      }
    } catch (e) {
      // swallow
    }

    subscribedRef.current = { linea: selectedLinea, postazione: selectedPostazione };
    // intentionally only depend on selection so this effect won't retrigger when hook functions change identity
  }, [selectedLinea, selectedPostazione]);

  // If the realtime hook exposes a global update marker (lastUpdated/recordCount),
  // refresh the latest selection once when those change. Use refs to avoid
  // re-triggering for the same value and prevent loops.
  useEffect(() => {
    if (!selectedLinea || !selectedPostazione) return;

    // nothing to do if neither marker is provided
    if (lastUpdated == null && recordCount == null) return;

    // bail if we've already seen these values
    if (lastUpdated != null && lastSeenUpdateRef.current === lastUpdated) return;
    if (recordCount != null && lastSeenCountRef.current === recordCount) return;

    // mark seen
    if (lastUpdated != null) lastSeenUpdateRef.current = lastUpdated;
    if (recordCount != null) lastSeenCountRef.current = recordCount;

    // best-effort refresh for the currently selected pair
    try {
      if (typeof refreshData === 'function') refreshData(selectedLinea, selectedPostazione);
    } catch (e) {
      // ignore
    }
  }, [lastUpdated, recordCount, selectedLinea, selectedPostazione, refreshData]);

  const latestData = acquisizioni.find((a) =>
    ((a.codicE_LINEA === selectedLinea) || (a.codLinea === selectedLinea)) &&
    ((a.codicE_POSTAZIONE === selectedPostazione) || (a.codPostazione === selectedPostazione))
  );
  const linee = getLinee();
  const postazioni = selectedLinea ? getPostazioniForLinea(selectedLinea) : [];

  // prefer the nested `original` object when backend includes both legacy and normalized data
  const source = latestData?.original ?? latestData ?? {};

  // normalize fields coming from different API shapes (prefer `source`, fall back to legacy keys)
  const articleCode = source?.codiceArticolo ?? latestData?.codicE_ARTICOLO ?? 'N/A';
  const abilitaCq = source?.abilitaCq ?? latestData?.abilitA_CQ ?? null;
  const esitoCq = source?.esitoCqArticolo ?? latestData?.esitO_CQ_ARTICOLO ?? null;
  const numSpineContate = (source?.numSpineContate ?? latestData?.numSpineContate) ?? 0;
  const numSpineAttese = (source?.numSpineAttese ?? latestData?.numSpineAttese) ?? 0;
  const fotoSuperiore = source?.fotoSuperiore ?? source?.fotO_SUPERIORE ?? source?.fotoAcquisizione ?? latestData?.fotO_SUPERIORE ?? latestData?.fotoAcquisizione ?? null;
  const fotoFrontale = source?.fotoFrontale ?? source?.fotO_FRONTALE ?? source?.fotoAcquisizione ?? latestData?.fotO_FRONTALE ?? latestData?.fotoAcquisizione ?? null;
  // prefer one image source: superior, then frontale, then generic filename
  const singlePhoto = fotoSuperiore ?? fotoFrontale ?? (source?.fotoAcquisizione ?? latestData?.fotoAcquisizione ?? null);
  // Simplified: always build full URL as <origin>/api/images/public/<filename>
  const displayPhoto = (() => {
    if (!singlePhoto) return null;
    const s = String(singlePhoto || '');
    const parts = s.split('/').filter(Boolean);
    const name = parts.length ? parts[parts.length - 1] : '';
    if (!name) return null;
    // use Vite env base URL if present, otherwise fall back to page origin
    const base = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, '');
    return `${base}/api/images/public/${encodeURIComponent(name)}`;
  })();

  // normalize description robustly: prefer source, then scan keys for anything containing 'descriz' (case-insensitive)
  const descrizione = (() => {
    if (!latestData) return '';
    // prefer source fields
    if (source?.descrizione) return source.descrizione;
    if (source?.descrizionE) return source.descrizionE;
    // scan source keys first
    const scan = (obj) => {
      if (!obj) return undefined;
      const keys = Object.keys(obj);
      for (const k of keys) {
        if (/descriz/i.test(k) && obj[k]) return obj[k];
      }
      return undefined;
    };
    const fromSource = scan(source);
    if (fromSource) return fromSource;
    // fallback: scan the top-level latestData for legacy key names
    const fromLatest = scan(latestData);
    return fromLatest ?? '';
  })();

  // DEBUG: log values to help diagnose why descrizione may be empty in the UI
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[RealtimeLatestSingle] selected:', { selectedLinea, selectedPostazione });
      // eslint-disable-next-line no-console
      console.log('[RealtimeLatestSingle] acquisizioni length:', Array.isArray(acquisizioni) ? acquisizioni.length : String(acquisizioni));
      // eslint-disable-next-line no-console
      console.log('[RealtimeLatestSingle] latestData keys:', latestData ? Object.keys(latestData) : null);
      // eslint-disable-next-line no-console
      console.log('[RealtimeLatestSingle] latestData (raw):', latestData);
      // eslint-disable-next-line no-console
      console.log('[RealtimeLatestSingle] descrizione (normalized):', descrizione);
    } catch (e) {
      // ignore logging errors
    }
  }, [acquisizioni, latestData, descrizione, selectedLinea, selectedPostazione]);

  const formatDate = (dateString) => {
    // treat missing/empty/null dates as no-data
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleString('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateString || '-';
    }
  };

  const handleImageOpen = (imageUrl) => {
    if (imageUrl) window.open(imageUrl, '_blank');
  };

  const getQualityStatus = (esito) => {
    if (esito === null || esito === undefined) return { color: 'bg-gray-400', text: 'NON TESTATO', icon: '-' };
    return esito ? { color: 'bg-green-500', text: 'APPROVATO', icon: '✓' } : { color: 'bg-red-500', text: 'RESPINTO', icon: '✗' };
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Monitoraggio Real-time</h1>
        </div>

        {!dropdownLoading && !dropdownError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Linea di Produzione</label>
              <div className="relative">
                <select value={selectedLinea} onChange={(e) => setSelectedLinea(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer text-gray-900">
                  <option value="">Seleziona una linea...</option>
                  {linee.map((linea) => (
                    <option key={linea.value} value={linea.value}>
                      {linea.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Postazione</label>
              <div className="relative">
                <select value={selectedPostazione} onChange={(e) => setSelectedPostazione(e.target.value)} disabled={!selectedLinea || postazioni.length === 0} className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer text-gray-900 ${!selectedLinea || postazioni.length === 0 ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}`}>
                  <option value="">{!selectedLinea ? 'Prima seleziona una linea...' : postazioni.length === 0 ? 'Nessuna postazione disponibile' : 'Seleziona una postazione...'}</option>
                  {postazioni.map((postazione) => (
                    <option key={postazione.value} value={postazione.value}>
                      {postazione.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {dropdownLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Caricamento opzioni...</span>
        </div>
      )}

      {dropdownError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Errore nel caricamento delle opzioni: {dropdownError}</span>
          </div>
        </div>
      )}

      {selectedLinea && selectedPostazione && (
        <div className="bg-white rounded-lg shadow-md">
          {isLoading && !latestData && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Caricamento dati in tempo reale...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button onClick={reconnect} className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Riprova</button>
            </div>
          )}

          {!isLoading && !error && !latestData && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Nessuna acquisizione trovata</p>
              <p className="text-sm">Non ci sono ancora acquisizioni per questa combinazione.</p>
            </div>
          )}

          {latestData && (
            <div className="bg-white border-2 rounded-xl p-4 border-gray-200">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                <div className="flex-shrink-0 lg:w-2/4 space-y-6">
                

                  <div className="text-center lg:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center lg:justify-start gap-6">
                      <div className="min-w-0 flex-1">
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Codice Articolo</label>
                        <div className="flex items-center justify-center sm:justify-start space-x-3">
                          <Package className="w-6 h-6 text-gray-400" />
                          <span className="text-2xl font-bold text-gray-900 truncate">{articleCode}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Abilita CQ</label>
                        <div className="flex items-center justify-center sm:justify-start space-x-3">
                          <CheckCircle className="w-6 h-6 text-gray-400" />
                          <span className="text-2xl font-bold text-gray-900">{abilitaCq !== null ? (abilitaCq ? 'Sì' : 'No') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center lg:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center lg:justify-start gap-6">
                      <div className="min-w-0 flex-1">
                        <label className="block text-lg font-semibold text-gray-700 mb-2">numSpineContate</label>
                        <div className="flex items-center justify-center sm:justify-start space-x-3">
                          <Package className="w-6 h-6 text-gray-400" />
                          <span className="text-2xl font-bold text-gray-900 truncate">{numSpineContate}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <label className="block text-lg font-semibold text-gray-700 mb-2">numSpineAttese</label>
                        <div className="flex items-center justify-center sm:justify-start space-x-3">
                          <CheckCircle className="w-6 h-6 text-gray-400" />
                          <span className="text-2xl font-bold text-gray-900">{numSpineAttese}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                   <div className="text-center lg:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center lg:justify-start gap-6">
                      <div className="min-w-0 flex-1">
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Descrizione</label>
                        <div className="flex items-center justify-center sm:justify-start space-x-3">
                          <Package className="w-6 h-6 text-gray-400" />
                          <span className="text-2xl font-bold text-gray-900 truncate">{descrizione || 'N/A'}</span>
                        </div>
                      </div>

                 
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-3 text-center lg:text-left">
                    <div className="text-lg text-gray-600">
                      <strong>Data:</strong> {formatDate(latestData?.dataInserimento ?? latestData?.dT_INS)}
                    </div>
                    {descrizione ? (
                      <div className="text-sm text-gray-700 mt-2">{descrizione}</div>
                    ) : null}
                  </div>
                  {/* single-photo block */}
                  <div className="mt-6 w-full max-w-xl mx-auto">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">Foto Acquisizione</h4>
                    <div className="rounded border overflow-hidden bg-white">
                      {displayPhoto && !imgError ? (
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
                      ) : (
                        <div className="flex flex-col items-center justify-center h-56 bg-gray-50 text-gray-400 p-4">
                          <Camera className="w-12 h-12 mb-2" />
                          <div className="text-sm">Immagine non disponibile</div>
                        </div>
                      )}
                    </div>

                    {/* Lightbox modal */}
                    {isLightboxOpen && displayPhoto && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setIsLightboxOpen(false)}>
                        <div className="max-w-[90%] max-h-[90%]" onClick={(e) => e.stopPropagation()}>
                          <img src={displayPhoto} alt="Foto ingrandita" className="w-full h-auto max-h-[90vh] object-contain rounded shadow-lg" />
                          <div className="text-right mt-2">
                            <button onClick={() => setIsLightboxOpen(false)} className="px-3 py-1 bg-white text-gray-800 rounded">Chiudi</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center lg:w-2/4">
                  <label className="block text-xl font-bold text-gray-700 mb-4 text-center">Esito CQ Articolo</label>
                  <div className={`w-80 h-80 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem] rounded-2xl ${getQualityStatus(esitoCq).color} shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-3xl`}>
                    <span className="text-white font-bold text-6xl lg:text-7xl xl:text-8xl">{getQualityStatus(esitoCq).icon}</span>
                  </div>
                  <div className="mt-4 text-lg font-semibold text-center text-gray-600">{getQualityStatus(esitoCq).text}</div>
                  
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeLatestSingle;