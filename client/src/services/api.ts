import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login if needed
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// API endpoints for document management
export const documentApi = {
  // Get document by ID
  getDocument: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response.data;
  },

  // Create new document
  createDocument: async (documentData: { title: string; content?: string }) => {
    const response = await apiClient.post('/documents', documentData);
    return response.data;
  },

  // Update document
  updateDocument: async (documentId: string, updateData: { title?: string; content?: string }) => {
    const response = await apiClient.put(`/documents/${documentId}`, updateData);
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentId: string) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  // List user documents
  listDocuments: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },
};

// API endpoints for collaboration
export const collabApi = {
  // Send steps to server
  sendSteps: async (documentId: string, version: number, steps: any[], clientID: string) => {
    const response = await apiClient.post('/collab/steps', {
      documentId,
      version,
      steps,
      clientID,
    });
    return response.data;
  },

  // Get steps since version
  getSteps: async (documentId: string, version: number) => {
    const response = await apiClient.get(`/collab/steps/${documentId}/${version}`);
    return response.data;
  },

  // Get current document state
  getDocumentState: async (documentId: string) => {
    const response = await apiClient.get(`/collab/document/${documentId}`);
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  // Check if API is available
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },

  // Handle API errors
  handleError: (error: any) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        return {
          message: error.response.data?.message || 'Server error occurred',
          status: error.response.status,
          data: error.response.data,
        };
      } else if (error.request) {
        // Network error
        return {
          message: 'Network error - please check your connection',
          status: 0,
        };
      }
    }
    
    return {
      message: error.message || 'An unexpected error occurred',
      status: 500,
    };
  },
};

export default apiClient;