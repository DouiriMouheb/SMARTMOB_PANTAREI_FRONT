const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Custom API Error class with enhanced error information
 */
class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

class ApiService {
  /**
   * Handle API response and throw appropriate errors
   */
  static async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData = null;

      // Try to parse error response body
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const text = await response.text();
          if (text) errorMessage = text;
        }
      } catch (parseError) {
        // If parsing fails, use default error message
        if (import.meta.env.DEV) {
          console.warn('Failed to parse error response:', parseError);
        }
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Handle successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response;
  }

  static async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      return await this.handleResponse(response);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`API GET Error [${endpoint}]:`, error);
      }
      throw error;
    }
  }

  static async getById(endpoint, id) {
    return this.get(`${endpoint}/${id}`);
  }

  static async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`API POST Error [${endpoint}]:`, error);
      }
      throw error;
    }
  }

  static async put(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`API PUT Error [${endpoint}]:`, error);
      }
      throw error;
    }
  }

  static async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });
      
      if (response.status === 204) {
        return null;
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`API DELETE Error [${endpoint}]:`, error);
      }
      throw error;
    }
  }

  // Acquisizioni specific methods
  static async getAcquisizioni() {
    return this.get('/api/Acquisizioni')
  }

  static async getAcquisizioneById(id) {
    return this.getById('/api/Acquisizioni', id)
  }

  // Postazioni specific methods
  static async getPostazioni() {
    return this.get('/api/Postazioni')
  }

  static async getPostazioneById(codLineaProd, codPostazione) {
    return this.get(`/api/Postazioni/${codLineaProd}/${codPostazione}`)
  }

  static async createPostazione(data) {
    return this.post('/api/Postazioni', data)
  }

  static async updatePostazione(codLineaProd, codPostazione, data) {
    return this.put(`/api/Postazioni/${codLineaProd}/${codPostazione}`, data)
  }

  static async deletePostazione(codLineaProd, codPostazione) {
    return this.delete(`/api/Postazioni/${codLineaProd}/${codPostazione}`)
  }

  // PostazioniPerLinea specific methods
  static async getPostazioniPerLinea() {
    return this.get('/api/PostazioniPerLinea')
  }

  // Acquisizioni with filtering
  static async getAcquisizioniFiltered(codLinea, codPostazione) {
    if (!codLinea || !codPostazione) {
      return []
    }
    return this.get(`/api/Acquisizioni/${codLinea}/${codPostazione}`)
  }

  // Forward image to QualityControlVisual API (server-side relay to avoid CORS)
  static async forwardImageToQualityControl(filename) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/QualityControl/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`Quality control forward failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
      }

      // Return the processed image as blob
      return await response.blob()
    } catch (error) {
      console.error('Quality Control Forward Error:', error)
      throw error
    }
  }
}

export default ApiService