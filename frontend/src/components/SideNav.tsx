import React, { useEffect, useState, useRef } from 'react';
import { budgetApi } from '../api/routes';
import Login from './Login';

interface BudgetNavItem {
  id: string;
  title: string;
}

interface SideNavProps {
  onBudgetSelect: (budgetId: string) => void;
  onAddBudget: () => void;
  userName: string;
  onLogout?: () => void;
  onLogin?: () => void;
  isAuthenticated: boolean;
}

const SideNav: React.FC<SideNavProps> = ({ onBudgetSelect, onAddBudget, userName, isAuthenticated }) => {
  const [budgets, setBudgets] = useState<BudgetNavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setError(null); // Clear error before fetching
    if (!isAuthenticated) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    budgetApi.getAllBudgetIds()
      .then((data) => {
        // data is [id, title][]
        setBudgets(data.map(({ id, title }) => ({ id, title })));
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load budgets');
        setLoading(false);
      });
  }, [userName, isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <aside className="h-screen w-48 bg-white border-r border-gray-200 flex flex-col p-6 shadow-lg">
      {/* User section with dropdown */}
      <div className="flex flex-col items-center mb-8 relative">
        <div
          ref={avatarRef}
          className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 cursor-pointer relative"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <span className="text-2xl text-gray-400">👤</span>
          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-42 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 flex flex-col items-center">
              <div className="mb-2 text-gray-800 font-semibold truncate w-full text-center">{userName}</div>
              <Login />
            </div>
          )}
        </div>
        <div className="px-2 py-1 bg-gray-100 rounded-full mb-1 text-center text-sm text-gray-700 font-medium overflow-hidden truncate" title={userName}>{userName}</div>
      </div>
      {/* Budgets List */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-4 tracking-wider">Budgets</h2>
        {loading && <div className="text-gray-400 text-sm">Loading...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {/* Add Budget Button */}
        <button
          className="my-1 w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          onClick={onAddBudget}
        >
          + Add budget
        </button>
        <ul className="space-y-2">
          {budgets.map((budget) => (
            <li key={budget.id} onClick={() => onBudgetSelect(budget.id)}>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-800 font-medium transition-colors">
                {budget.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default SideNav;
