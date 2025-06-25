import axios, { HttpStatusCode } from 'axios';
import type { BudgetDTO, ComplexBudgetDTO } from '../types/Budget';
import type { LoginRequest, LoginResponse } from '../types/Auth';

// You might want to move this to an environment variable
const API_BASE_URL = 'http://localhost:8888';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock credentials - in a real app, this would come from auth context/service
const mockCredentials = {
  user_id: 'mock_user_id',
  token: 'mock_token',
};

// Attach JWT token to all requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const budgetApi = {
  /**
   * Get all budget IDs for the current user
   */
  getAllBudgetIds: async (): Promise<{ id: string; title: string }[]> => {
    const response = await api.get('/budgets', {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.data;
  },

  /**
   * Create a new budget
   */
  createBudget: async (budget: ComplexBudgetDTO): Promise<HttpStatusCode> => {
    const response = await api.post('/budgets', budget, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.status;
  },

  /**
   * Import budget from CSV file
   */
  importCsvBudget: async (file: File): Promise<BudgetDTO> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/budgets/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    });
    return response.data;
  },

  /**
   * Get a specific budget by ID
   */
  getBudget: async (budgetId: string): Promise<ComplexBudgetDTO> => {
    const response = await api.get(`/budgets/${budgetId}`, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.data;
  },

  /**
   * Delete a budget by ID
   */
  deleteBudget: async (budgetId: string): Promise<HttpStatusCode> => {
    const response = await api.delete(`/budgets/${budgetId}`, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.status;
  },

  /**
   * Update an existing budget by ID
   */
  updateBudget: async (budgetId: string, budget: ComplexBudgetDTO): Promise<void> => {
    await api.put(`/budgets/${budgetId}`, budget, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
  },

  /**
   * Validate period mismatch and get possible actions
   */
  validatePeriodMismatch: async (payload: any): Promise<any> => {
    const response = await api.post('/budgets/validate-period-mismatch', payload, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.data;
  },

  /**
   * Apply period corrections (move, savings, etc.)
   */
  applyPeriodCorrections: async (payload: any): Promise<any> => {
    const response = await api.post('/budgets/apply-period-corrections', payload, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.data;
  },
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const register = async (data: LoginRequest): Promise<void> => {
  await api.post('/auth/register', data);
};

// Error handling types
export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

// Add global response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: error.response?.data?.detail || 'An unexpected error occurred',
      detail: error.response?.data?.detail,
    };

    // You might want to handle certain status codes differently
    switch (apiError.status) {
      case 403:
        // Handle authorization errors
        console.error('Authorization error:', apiError.message);
        break;
      case 404:
        // Handle not found errors
        console.error('Resource not found:', apiError.message);
        break;
      default:
        // Handle other errors
        console.error('API error:', apiError);
    }

    return Promise.reject(apiError);
  }
);
