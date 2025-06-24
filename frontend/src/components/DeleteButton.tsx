import React from 'react';

interface DeleteButtonProps {
  onClick: () => void;
  processing: boolean;
  className?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, processing }) => (
  <button
    className={'mb-4 px-4 py-2 rounded bg-red-400 text-white font-semibold shadow hover:bg-red-700 transition-colors'}
    onClick={onClick}
    disabled={processing}
  >
    {processing ? 'Deleting...' : 'Delete Budget'}
  </button>
);

export default DeleteButton;
