import axios from 'axios';
// Get API base URL from environment variables or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://7bt2ch2nna.execute-api.eu-north-1.amazonaws.com/v1';
// Log API URL in development mode
if (import.meta.env.DEV) {
    console.log('API Base URL:', API_BASE_URL);
}
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
let currentToken = null;
export function setApiAuthToken(token) {
    currentToken = token;
}
// Attach JWT token to all requests if present
api.interceptors.request.use((config) => {
    if (currentToken) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    return config;
});
export const budgetApi = {
    /**
     * Get all budget IDs for the current user
     */
    getAllBudgetIds: async () => {
        const response = await api.get('/budgets');
        return response.data;
    },
    /**
     * Create a new budget
     */
    createBudget: async (budget) => {
        const response = await api.post('/budgets', budget);
        return response.status;
    },
    /**
     * Import budget from CSV file
     */
    importCsvBudget: async (file) => {
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
    getBudget: async (budgetId) => {
        const response = await api.get(`/budgets/${budgetId}`);
        return response.data;
    },
    /**
     * Delete a budget by ID
     */
    deleteBudget: async (budgetId) => {
        const response = await api.delete(`/budgets/${budgetId}`);
        return response.status;
    },
    /**
     * Update an existing budget by ID
     */
    updateBudget: async (budgetId, budget) => {
        await api.put(`/budgets/${budgetId}`, budget);
    },
    /**
     * Validate period mismatch and get possible actions
     */
    validatePeriodMismatch: async (payload) => {
        const response = await api.post('/budgets/validate-period-mismatch', payload);
        return response.data;
    },
    /**
     * Apply period corrections (move, savings, etc.)
     */
    applyPeriodCorrections: async (payload) => {
        const response = await api.post('/budgets/apply-period-corrections', payload);
        return response.data;
    },
};
// Add global response interceptor for error handling
api.interceptors.response.use((response) => response, (error) => {
    const apiError = {
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
});
