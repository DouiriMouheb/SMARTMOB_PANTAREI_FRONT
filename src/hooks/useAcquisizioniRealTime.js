import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import acquisizioniService from '../services/acquisizioniService';
import { handleError, logError } from '../utils/errorHandler';

// Updated API base URL to match the correct server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;
const HUB_URL = `${API_BASE_URL}/hubs/acquisizioni`;

const useAcquisizioniRealtime = () => {
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState('Disconnected');
  const [acquisizioni, setAcquisizioni] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const selectedLineaRef = useRef(null);
  const selectedPostazioneRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttemptRef = useRef(0);
  const subscribeSupportedRef = useRef(null); // null = unknown, false = not supported, true = supported
  const subscribeMethodRef = useRef(null); // store the working method name or false
  const subscribeCandidates = [
    'SubscribeToLineaPostazione',
    'SubscribeLineaPostazione',
    'SubscribeToPostazione',
    'Subscribe',
    'SubscribeToLineaEPostazione'
  ];

  // Try to subscribe using several candidate method names. Cache the successful one.
  const trySubscribe = useCallback(async (hub, linea, postazione) => {
    if (!hub || !linea || !postazione) return false;

    // If we've already determined there's no supported method, skip
    if (subscribeMethodRef.current === false) return false;

    // If we already have a working method, try it directly
    if (typeof subscribeMethodRef.current === 'string') {
      try {
        await hub.invoke(subscribeMethodRef.current, linea, postazione);
        subscribeSupportedRef.current = true;
        return true;
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg.includes('Method does not exist') || msg.includes('HubException')) {
          // fall through to try other candidates
          subscribeMethodRef.current = null;
          subscribeSupportedRef.current = null;
        } else {
          console.warn('Subscribe attempt failed for method', subscribeMethodRef.current, err);
          return false;
        }
      }
    }

    // Probe candidates
    for (const candidate of subscribeCandidates) {
      try {
        await hub.invoke(candidate, linea, postazione);
        subscribeMethodRef.current = candidate;
        subscribeSupportedRef.current = true;
        console.log('Subscribed using hub method:', candidate);
        return true;
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg.includes('Method does not exist') || msg.includes('HubException')) {
          // try next candidate
          continue;
        }
        // other errors, log and stop
        console.warn('Error invoking candidate subscribe method', candidate, err);
        return false;
      }
    }

    // none succeeded
    subscribeMethodRef.current = false;
    subscribeSupportedRef.current = false;
    console.debug('No subscribe method available on hub');
    return false;
  }, []);

  // Fetch initial data from REST API
  const fetchInitialData = useCallback(async (linea = null, postazione = null) => {
    try {
      setIsLoading(true);
      setError(null);
      // If linea/postazione are not provided, we should not call the generic /latest endpoint
      // because the server expects a specific selection and may return 400. Instead, clear data.
      if (!linea || !postazione) {
        setAcquisizioni([]);
        setLastUpdated(null);
        return;
      }

      const data = await acquisizioniService.getLatestSingleAcquisizione(linea, postazione);
      setAcquisizioni(data);
      setLastUpdated(new Date().toISOString());
      
    } catch (err) {
      const parsedError = handleError(err, {
        context: 'Caricamento dati realtime',
        showToast: false, // Don't show toast for initial load, component will display error
      });
      setError(parsedError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create SignalR connection
  const createConnection = useCallback(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // Add any authentication options if needed
        // accessTokenFactory: () => token
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < 3) {
            return 2000; // Retry after 2 seconds for first 3 attempts
          } else if (retryContext.previousRetryCount < 5) {
            return 5000; // Retry after 5 seconds for next 2 attempts
          } else {
            return 10000; // Retry after 10 seconds for further attempts
          }
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    return newConnection;
  }, []);

  // Setup connection event handlers
  const setupConnectionHandlers = useCallback((hubConnection) => {
    // Handle connection state changes
    hubConnection.onclose((error) => {
      setConnectionState('Disconnected');
      setConnectionId(null);
      if (error) {
        console.error('SignalR connection closed with error:', error);
        setError(`Connessione interrotta: ${error.message}`);
        toast.error('Connessione SignalR interrotta');
      } else {
        console.log('SignalR connection closed');
        toast.info('Connessione SignalR chiusa');
      }
    });

    hubConnection.onreconnecting((error) => {
      setConnectionState('Reconnecting');
      console.log('SignalR reconnecting...', error);
      toast.loading('Riconnessione in corso...', { id: 'reconnecting' });
    });

    hubConnection.onreconnected((connectionId) => {
      setConnectionState('Connected');
      setConnectionId(connectionId);
      setError(null);
      reconnectAttemptRef.current = 0;
      console.log('SignalR reconnected with ID:', connectionId);
      toast.success('Riconnesso con successo!', { id: 'reconnecting' });
      
      // Fetch fresh data after reconnection using stored selection refs (if present)
      fetchInitialData(selectedLineaRef.current, selectedPostazioneRef.current);
    });

    // Listen for real-time events
    hubConnection.on('Connected', (id) => {
      console.log('✅ SignalR Connected event received with ID:', id);
      setConnectionId(id);
     
    });

    hubConnection.on('AcquisizioniUpdated', (data) => {
      console.log('🔄 AcquisizioniUpdated event received:', data);
      console.log('📊 Data type:', typeof data, 'Is Array:', Array.isArray(data));
      try {
        const raw = Array.isArray(data) ? data : [data];
        const newAcquisizioni = raw.map(item => acquisizioniService.normalizeAcquisizione(item));
        console.log('📋 Processing acquisizioni:', newAcquisizioni.length, 'records (normalized)');
        setAcquisizioni(newAcquisizioni);
        setLastUpdated(new Date().toISOString());
       
      } catch (err) {
        console.error('❌ Error processing AcquisizioniUpdated:', err);
        toast.error('Errore nell\'elaborazione degli aggiornamenti real-time');
      }
    });

    // Listen for any other potential events
    hubConnection.on('NewAcquisizione', (data) => {
      console.log('➕ NewAcquisizione event received:', data);
      try {
        const rawRecord = Array.isArray(data) ? data[0] : data;
        const newRecord = acquisizioniService.normalizeAcquisizione(rawRecord);
        setAcquisizioni(prev => {
          const updated = [newRecord, ...prev];
          console.log('➕ Added new normalized record, total:', updated.length);
          return updated;
        });
        setLastUpdated(new Date().toISOString());
        toast.success('➕ Nuova acquisizione ricevuta!', {
          duration: 4000,
          icon: '➕'
        });
      } catch (err) {
        console.error('❌ Error processing NewAcquisizione:', err);
        toast.error('Errore nell\'elaborazione della nuova acquisizione');
      }
    });

    // Handle other potential events
    hubConnection.on('Error', (errorMessage) => {
      console.error('❌ SignalR Error event:', errorMessage);
      setError(errorMessage);
      toast.error(`Errore dal server: ${errorMessage}`);
    });

    // Debug: Listen for any event to see what's being sent
    hubConnection.onreceive = (data) => {
      console.log('📡 Raw SignalR message received:', data);
    };

  }, [fetchInitialData]);

  // Connect to SignalR hub
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const hubConnection = createConnection();
      setupConnectionHandlers(hubConnection);

      setConnectionState('Connecting');
      await hubConnection.start();
      
      setConnection(hubConnection);
      setConnectionState('Connected');
      reconnectAttemptRef.current = 0;
      
      console.log('SignalR connected successfully');
      toast.success('Connesso al server in tempo reale');
      
  // Fetch initial data after successful connection
      await fetchInitialData(selectedLineaRef.current, selectedPostazioneRef.current);

      // If we already have a selected linea/postazione (set by refreshData or UI), subscribe on the hub so server will push updates
      if (selectedLineaRef.current && selectedPostazioneRef.current) {
        try {
          // best-effort - don't block overall connect if subscribe fails
          await trySubscribe(hubConnection, selectedLineaRef.current, selectedPostazioneRef.current);
        } catch (err) {
          console.warn('Auto-subscribe failed:', err);
        }
      }
      
    } catch (err) {
      console.error('SignalR connection failed:', err);
      setConnectionState('Disconnected');
      setError(`Errore di connessione: ${err.message}`);
      toast.error('Errore nella connessione SignalR');
      
      // Attempt manual reconnection with exponential backoff
      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttemptRef.current) * 1000; // Exponential backoff
        reconnectAttemptRef.current++;
        
        toast.loading(`Tentativo di riconnessione ${reconnectAttemptRef.current}/${maxReconnectAttempts} in ${delay/1000}s...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        toast.error('Impossibile stabilire la connessione dopo diversi tentativi');
      }
    } finally {
      setIsLoading(false);
    }
  }, [createConnection, setupConnectionHandlers, fetchInitialData]);

  // Disconnect from SignalR hub
  const disconnect = useCallback(async () => {
    if (connection) {
      try {
        await connection.stop();
        setConnection(null);
        setConnectionState('Disconnected');
        setConnectionId(null);
        console.log('SignalR disconnected');
        toast.info('Disconnesso dal server');
      } catch (err) {
        console.error('Error disconnecting:', err);
        toast.error('Errore durante la disconnessione');
      }
    }
    
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [connection]);

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    if (connection && connectionState !== 'Disconnected') {
      await disconnect();
    }
    reconnectAttemptRef.current = 0;
    await connect();
  }, [connection, connectionState, disconnect, connect]);

  // Send message to hub (if needed for future functionality)
  const sendMessage = useCallback(async (method, ...args) => {
    if (!(connection && connectionState === 'Connected' && connection.state === 'Connected')) {
      // Connection not ready
      return false;
    }

    try {
      await connection.invoke(method, ...args);
      // If we successfully invoked a subscribe method, mark it supported
      if (method === 'SubscribeToLineaPostazione') subscribeSupportedRef.current = true;
      return true;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.error('Error sending message:', err);

      // If the server reports the method doesn't exist, record that and suppress toast noise
      if (msg.includes('Method does not exist') || msg.includes('HubException')) {
        if (method === 'SubscribeToLineaPostazione') {
          subscribeSupportedRef.current = false;
        }
        console.debug('Hub method not supported:', method, msg);
        return false;
      }

      toast.error('Errore nell\'invio del messaggio');
      return false;
    }
  }, [connection, connectionState]);

  // Refresh data helper (can pass linea/postazione to target a single latest)
  const refreshData = useCallback(async (linea = null, postazione = null) => {
    // store refs so connect will reuse them
    selectedLineaRef.current = linea;
    selectedPostazioneRef.current = postazione;
    await fetchInitialData(linea, postazione);
  }, [fetchInitialData]);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    connection,
    connectionState,
    connectionId,
    isLoading,
    error,
    
    // Data
    acquisizioni,
    lastUpdated,
    recordCount: acquisizioni.length,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    sendMessage,
    refreshData,
    subscribe: (linea, postazione) => trySubscribe(connection, linea, postazione),
    
    // Status helpers
    isConnected: connectionState === 'Connected',
    isConnecting: connectionState === 'Connecting',
    isReconnecting: connectionState === 'Reconnecting',
    isDisconnected: connectionState === 'Disconnected',
  };
};

export default useAcquisizioniRealtime;
