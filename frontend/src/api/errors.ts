import axios, { AxiosError, AxiosResponse } from 'axios';

export interface ApiError {
    code?: string;
    message: string;
    feature?: string;
    detail?: string;
}

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        // Handle rate limit errors (429)
        if (axiosError.response?.status === 429) {
            return axiosError.response.data.detail || axiosError.response.data.message || 'CSV import limit reached';
        }

        if (axiosError.response?.data) {
            const data = axiosError.response.data;
            if (typeof data === 'string') {
                return data;
            }
            // Handle structured error responses
            if (data.detail && typeof data.detail === 'object') {
                return data.detail.message || data.detail.code || 'An error occurred';
            }
            return data.message || data.detail || 'An error occurred';
        }
        return axiosError.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
}
