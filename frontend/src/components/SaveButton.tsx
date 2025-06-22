import React from 'react';

interface SaveButtonProps {
  onClick: () => void;
  saving: boolean;
  disabled: boolean;
  className?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onClick, saving, disabled, className = '' }) => (
  <button
    className={`mb-4 px-4 py-2 rounded font-semibold shadow transition-colors ${
      saving || !disabled
        ? 'bg-gray-300 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-700 text-white'
    } ${className}`}
    onClick={onClick}
    disabled={saving || !disabled}
  >
    {saving ? 'Saving...' : 'Save'}
  </button>
);

export default SaveButton;
