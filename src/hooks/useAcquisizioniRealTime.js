import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import acquisizioniService from '../services/acquisizioniService';

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
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttemptRef = useRef(0);

  // Fetch initial data from REST API
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await acquisizioniService.getLatestAcquisizioni();
      setAcquisizioni(data);
      setLastUpdated(new Date().toISOString());
      
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(`Errore nel caricamento dei dati: ${err.message}`);
      // Don't show error toast here as it's already shown in the service
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
      
      // Fetch fresh data after reconnection
      fetchInitialData();
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
        const newAcquisizioni = Array.isArray(data) ? data : [data];
        console.log('📋 Processing acquisizioni:', newAcquisizioni.length, 'records');
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
        setAcquisizioni(prev => {
          const newRecord = Array.isArray(data) ? data[0] : data;
          const updated = [newRecord, ...prev];
          console.log('➕ Added new record, total:', updated.length);
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
      await fetchInitialData();
      
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
    if (connection && connectionState === 'Connected') {
      try {
        await connection.invoke(method, ...args);
        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        toast.error('Errore nell\'invio del messaggio');
        return false;
      }
    } else {
      toast.error('Connessione non disponibile');
      return false;
    }
  }, [connection, connectionState]);

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
    refreshData: fetchInitialData,
    
    // Status helpers
    isConnected: connectionState === 'Connected',
    isConnecting: connectionState === 'Connecting',
    isReconnecting: connectionState === 'Reconnecting',
    isDisconnected: connectionState === 'Disconnected',
  };
};

export default useAcquisizioniRealtime;
