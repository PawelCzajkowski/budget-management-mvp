import React from 'react';

type ToggleProps = {
    text?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

const Toggle: React.FC<ToggleProps> = ({ text, checked, onChange }) => (
    <div className="flex items-center mb-4">
        <label className="relative flex items-center p-2 text-md">
            {text}
            <input
                type="checkbox"
                className="absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            <span className="w-12 h-8 flex items-center flex-shrink-0 ml-4 p-1 bg-gray-300 rounded-full duration-300 ease-in-out peer-checked:bg-green-400 after:w-6 after:h-6 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-4"></span>
        </label>
    </div>
);

export default Toggle;