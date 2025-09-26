import toast from 'react-hot-toast';

// Updated API base URL to match the correct server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

class AcquisizioniService {
  constructor() {
    this.baseUrl = API_BASE_URL;
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
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error fetching latest acquisizioni:', error);
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
