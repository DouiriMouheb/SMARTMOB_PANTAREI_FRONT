import toast from 'react-hot-toast';

// Updated API base URL to match the correct server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

class AcquisizioniService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Normalize server response to the UI expected shape
  normalizeAcquisizione(serverObj) {
    if (!serverObj) return serverObj;

    // Provide safe accessors and fallbacks
    // If server provides a fotoAcquisizione identifier, expose it as a full public URL
    const fotoFile = serverObj.fotoAcquisizione || null;
    const fotoUrl = fotoFile ? `${this.baseUrl}/api/images/public/${encodeURIComponent(fotoFile)}` : null;

    return {
      // keep original id
      id: serverObj.id ?? serverObj.ID ?? null,

      // server uses camelCase like codLinea / codPostazione
      codicE_LINEA: serverObj.codLinea ?? serverObj.codicE_LINEA ?? null,
      codicE_POSTAZIONE: serverObj.codPostazione ?? serverObj.codicE_POSTAZIONE ?? null,

      // article/order codes
      codicE_ARTICOLO: serverObj.codiceArticolo ?? serverObj.codicE_ARTICOLO ?? null,
      codicE_ORDINE: serverObj.codiceOrdine ?? serverObj.codicE_ORDINE ?? null,

  // photos - if the server provides fotoAcquisizione (single image), map it to fotO_SUPERIORE
  // and leave fotO_FRONTALE null to reflect the single-image setup
  fotO_SUPERIORE: serverObj.fotO_SUPERIORE ?? fotoUrl,
  fotO_FRONTALE: serverObj.fotO_FRONTALE ?? null,

      // boolean flags and results
      abilitA_CQ: serverObj.abilitaCq ?? serverObj.abilitA_CQ ?? null,
      esitO_CQ_ARTICOLO: serverObj.esitoCqArticolo ?? serverObj.esitO_CQ_ARTICOLO ?? null,

      // timestamps
      dT_INS: serverObj.dataInserimento ?? serverObj.dT_INS ?? serverObj.dataAggiornamento ?? null,
      dT_AGG: serverObj.dataAggiornamento ?? null,

      // any other fields preserved for safety
      original: serverObj,
    };
  }

  // Fetch latest acquisizioni from REST API
  async getLatestAcquisizioni() {
    try {
      const response = await fetch(`${this.baseUrl}/api/acquisizioni/latest`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : [data];
      return items.map(item => this.normalizeAcquisizione(item));
    } catch (error) {
      console.error('Error fetching latest acquisizioni:', error);
      toast.error(`Errore nel caricamento dei dati: ${error.message}`);
      throw error;
    }
  }

  // Fetch the latest single acquisizione for a specific linea/postazione
  async getLatestSingleAcquisizione(linea, postazione) {
    try {
      if (!linea || !postazione) {
        throw new Error('Linea e postazione sono richieste');
      }

      const response = await fetch(`${this.baseUrl}/api/acquisizioni/latest-single/linea/${encodeURIComponent(linea)}/postazione/${encodeURIComponent(postazione)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

  const data = await response.json();
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => this.normalizeAcquisizione(item));
    } catch (error) {
      console.error('Error fetching latest single acquisizione:', error);
      toast.error(`Errore nel caricamento dei dati: ${error.message}`);
      throw error;
    }
  }

  // Fetch acquisizioni by ID
  async getAcquisizioneById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/api/acquisizioni/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching acquisizione by ID:', error);
      toast.error(`Errore nel caricamento dell'acquisizione: ${error.message}`);
      throw error;
    }
  }

  // Fetch acquisizioni with pagination
  async getAcquisizioni(page = 1, pageSize = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/api/acquisizioni?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching acquisizioni:', error);
      toast.error(`Errore nel caricamento delle acquisizioni: ${error.message}`);
      throw error;
    }
  }

  // Fetch acquisizioni by date range
  async getAcquisizioniByDateRange(startDate, endDate) {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`${this.baseUrl}/api/acquisizioni/range?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching acquisizioni by date range:', error);
      toast.error(`Errore nel caricamento delle acquisizioni per periodo: ${error.message}`);
      throw error;
    }
  }

  // Export acquisizioni data
  async exportAcquisizioni(format = 'csv') {
    try {
      const response = await fetch(`${this.baseUrl}/api/acquisizioni/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting acquisizioni:', error);
      toast.error(`Errore nell'esportazione: ${error.message}`);
      throw error;
    }
  }

  // Health check for the API
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Validate connection to SignalR hub
  async validateSignalRConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/signalr/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('SignalR validation failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const acquisizioniService = new AcquisizioniService();
export default acquisizioniService;
