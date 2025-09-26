const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

class ApiService {
  static async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  static async getById(endpoint, id) {
    return this.get(`${endpoint}/${id}`)
  }

  static async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API POST Error:', error)
      throw error
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
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API PUT Error:', error)
      throw error
    }
  }

  static async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.status === 204 ? null : await response.json()
    } catch (error) {
      console.error('API DELETE Error:', error)
      throw error
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
}

export default ApiService