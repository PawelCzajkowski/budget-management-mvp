import React from 'react';

interface DeleteButtonProps {
  onClick: () => void;
  processing: boolean;
  className?: string;
  tooltip?: string;
  disabled?: boolean;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, processing, className = '', tooltip, disabled = false }) => (
  <div className="relative group inline-block">
    <button
      className={`mb-4 px-4 py-2 rounded bg-red-400 text-white font-semibold shadow hover:bg-red-700 transition-colors ${className} ${(processing || disabled) ? 'cursor-not-allowed opacity-70' : ''}`}
      onClick={onClick}
      disabled={processing || disabled}
    >
      {processing ? 'Deleting...' : 'Delete Budget'}
    </button>
    {tooltip && (
      <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs bg-black text-white rounded shadow z-10 whitespace-nowrap">
        {tooltip}
      </span>
    )}
  </div>
);

export default DeleteButton;
