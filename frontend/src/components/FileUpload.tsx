import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { budgetApi } from '../api/routes';
import type { ApiError } from '../api/errors';
import { useNotification } from '../context/NotificationContext';

interface FileUploadProps {
  onDataReceived: (data: any) => void;
}

const FileUpload = ({ onDataReceived }: FileUploadProps) => {
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const data = await budgetApi.importCsvBudget(file);
      onDataReceived(data);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Error loading data. Please try again.';
      showError(errorMessage);
      console.error('Error:', apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-upload p-6 rounded-lg text-center bg-white">
      <div className="text-center text-md mb-4">
        Import data from CSV file
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={loading}
        className="block w-fit border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400
      file:bg-gray-50 file:border-0
      file:me-4
      file:py-2 file:px-4
      dark:file:bg-neutral-700 dark:file:text-neutral-400"
      />
      {loading && <div className="text-blue-600">Loading...</div>}
    </div>
  );
};

export default FileUpload;
