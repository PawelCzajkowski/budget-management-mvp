import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import type { Budget, Expense, Period, BudgetItem } from '../types/Budget';

type ExpenseDropdownProps = {
  expenses: Expense[];
  isOpen: boolean;
  onToggle: () => void;
};

const ExpenseDropdown: React.FC<ExpenseDropdownProps> = ({ expenses, isOpen, onToggle }) => {
  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
      </button>

      {/* Show expenses when dropdown is open */}
      {isOpen && (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
          {expenses.map((expense, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="font-medium text-gray-800">{expense.name}</div>
              <div className="flex items-center gap-4 mt-1 text-gray-600">
                {/* <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{expense.owner || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard size={12} />
                  <span>{expense.account_number}</span>
                </div> */}
                <div className="flex items-center gap-1 font-medium text-green-600">
                  {/* <DollarSign size={12} /> */}
                  <span>{parseFloat(expense.amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BudgetTable = ({ budget }: { budget: Budget }) => {
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});

  const toggleExpanded = (itemIndex: number, periodIndex: number) => {
    const key = `${itemIndex}-${periodIndex}`;
    setExpandedCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      {/* Budget Header */}
      <div className="mb-6">
        <p className="text-3xl font-bold text-gray-900 mb-2">{budget.title}</p>
        <p className="text-gray-600">{budget.description}</p>
      </div>

      {/* Budget Table */}
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Budget Item
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Account Number
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Owner
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Category
              </th>
              {budget.period_names.map((period: string) => (
                <th key={period} className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b">
                  {period}
                </th>
              ))}
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {budget.list_of_budget_items.map((item: BudgetItem, itemIndex: number) => (
              <tr key={itemIndex} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                  </div>
                </td>
                <td className="px-6 py-4 border-b">
                  <div className="text-gray-700">{item.account_number}</div>
                </td>
                <td className="px-6 py-4 border-b">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-700">{item.owner || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 border-b">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                </td>
                {item.periods.map((period: Period, periodIndex: number) => (
                  <td key={periodIndex} className="px-6 py-4 border-b">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {period.planned_amount}
                      </div>
                      {period.expense_list.length > 0 && (
                        <ExpenseDropdown
                          expenses={period.expense_list}
                          isOpen={!!expandedCells[`${itemIndex}-${periodIndex}`]}
                          onToggle={() => toggleExpanded(itemIndex, periodIndex)}
                        />
                      )}
                    </div>
                  </td>
                ))}
                <td className="px-6 py-4 border-b text-center">
                  <div className="font-bold text-lg text-green-600">
                    {(item.summary)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={4} className="px-6 py-4 text-right font-semibold text-gray-700">
                Period Totals:
              </td>
              {budget.period_names.map((periodName: string) => {
                const periodTotal = budget.list_of_budget_items.reduce((sum, item) => {
                  const period = item.periods.find(p => p.label === periodName);
                  return sum + (period ? parseFloat(period.planned_amount) : 0);
                }, 0);
                return (
                  <td key={periodName} className="px-6 py-4 text-center font-bold text-gray-900">
                    {(periodTotal.toString())}
                  </td>
                );
              })}
              <td className="px-6 py-4 text-center font-bold text-xl text-green-600">
                {(
                  budget.list_of_budget_items.reduce((sum, item) => sum + parseFloat(item.summary), 0).toString()
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-600">Total Budget Items</div>
          <div className="text-2xl font-bold text-blue-900">{budget.list_of_budget_items.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-600">Total Budget</div>
          <div className="text-2xl font-bold text-green-900">
            {(
              budget.list_of_budget_items.reduce((sum, item) => sum + parseFloat(item.summary), 0).toString()
            )}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-600">Planning Periods</div>
          <div className="text-2xl font-bold text-purple-900">{budget.period_names.length}</div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTable;