import axios from 'axios';
import type { BudgetDTO, Budget } from '../types/Budget';

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

export const budgetApi = {
  /**
   * Get all budget IDs for the current user
   */
  getAllBudgetIds: async (): Promise<[string, string][]> => {
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
  createBudget: async (budget: BudgetDTO): Promise<BudgetDTO> => {
    const response = await api.post('/budgets', budget, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.data;
  },

  /**
   * Import budget from CSV file
   */
  importCsvBudget: async (file: File): Promise<BudgetDTO> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/budgets/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
    return response.data;
  },

  /**
   * Get a specific budget by ID
   */
  getBudget: async (budgetId: string): Promise<Budget> => {
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
  deleteBudget: async (budgetId: string): Promise<void> => {
    await api.delete(`/budgets/${budgetId}`, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
  },

  /**
   * Update an existing budget by ID
   */
  updateBudget: async (budgetId: string, budget: BudgetDTO): Promise<void> => {
    await api.put(`/budgets/${budgetId}`, budget, {
      headers: {
        Authorization: `Bearer ${mockCredentials.token}`,
      },
    });
  },
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
