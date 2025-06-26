import React from 'react';

interface SaveButtonProps {
  onClick: () => void;
  saving: boolean;
  disabled: boolean;
  className?: string;
  tooltip?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onClick, saving, disabled, className = '', tooltip }) => (
  <div className="relative group inline-block">
    <button
      className={`mb-4 px-4 py-2 rounded font-semibold shadow transition-colors ${
        saving || disabled
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-700 text-white'
      } ${className}`}
      onClick={onClick}
      disabled={saving || disabled}
    >
      {saving ? 'Saving...' : 'Save'}
    </button>
    {tooltip && (
      <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs bg-black text-white rounded shadow z-10 whitespace-nowrap">
        {tooltip}
      </span>
    )}
  </div>
);

export default SaveButton;
