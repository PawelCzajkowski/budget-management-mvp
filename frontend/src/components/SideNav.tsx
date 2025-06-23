import React, { useEffect, useState } from 'react';
import { budgetApi } from '../api/routes';

interface BudgetNavItem {
  id: string;
  title: string;
}

interface SideNavProps {
  onBudgetSelect: (budgetId: string) => void;
  onAddBudget: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ onBudgetSelect, onAddBudget }) => {
  const [budgets, setBudgets] = useState<BudgetNavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    budgetApi.getAllBudgetIds()
      .then((data) => {
        // data is [id, title][]
        setBudgets(data.map(({ id, title }) => ({ id, title })));
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load budgets');
        setLoading(false);
      });
  }, []);

  return (
    <aside className="h-screen w-48 bg-white border-r border-gray-200 flex flex-col p-6 shadow-lg">
      {/* User placeholder */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
          {/* Placeholder for user avatar */}
          <span className="text-2xl text-gray-400">👤</span>
        </div>
        <div className="h-4 w-20 bg-gray-100 rounded mb-1" />
        <div className="h-3 w-12 bg-gray-100 rounded" />
      </div>
      {/* Budgets List */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-4 tracking-wider">Budgets</h2>
        {loading && <div className="text-gray-400 text-sm">Loading...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
      {/* Add Budget Button */}
      <button
        className="my-1 w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
