import { useState } from 'react';
import type { ChangeEvent } from 'react';
import mockData from '../../mock/get-complex-budget.json';
import { budgetApi } from '../api/routes';
import type { ApiError } from '../api/routes';

interface FileUploadProps {
  onDataReceived: (data: any) => void;
}

const FileUpload = ({ onDataReceived }: FileUploadProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await budgetApi.importCsvBudget(file);
      onDataReceived(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Error loading data. Please try again.');
      console.error('Error:', apiError);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMockData = () => {
    setLoading(true);
    setError(null);
    
    try {
      onDataReceived(mockData);
    } catch (err) {
      setError('Error loading mock data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-upload">
      <button 
        onClick={handleUseMockData}
        disabled={loading}
        style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}
      >
        Load Mock Data
      </button>
      <div>- or -</div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={loading}
        style={{ marginTop: '1rem' }}
      />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default FileUpload;
