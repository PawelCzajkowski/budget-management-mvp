import React from 'react';

interface SaveButtonProps {
  onClick: () => void;
  saving: boolean;
  className?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onClick, saving}) => (
  <button
    className={'mb-4 px-4 py-2 rounded !bg-blue-600 text-white font-semibold shadow hover:!bg-blue-700 transition-colors'}
    onClick={onClick}
    disabled={saving}
  >
    {saving ? 'Saving...' : 'Save'}
  </button>
);

export default SaveButton;
