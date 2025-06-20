import React, { useState, useEffect } from 'react';
import type { Budget, Expense } from '../types/Budget';
import { ChevronDown, ChevronRight, DollarSign, User, CreditCard } from 'lucide-react';

interface EditableCellProps {
  value: string | number;
  onSave: (value: string) => void;
  cellId?: string;
  type?: 'text' | 'currency';
  className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, type = 'text', className = '' }) => {
  const [editValue, setEditValue] = useState<string>(value.toString());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const formatCurrency = (amount: string | number): string => {
    let num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) num = 0;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'currency' ? 'number' : 'text'}
        value={type === 'currency' ? editValue.toString().replace(/[^0-9.]/g, '') : editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleBlur}
        className={`w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        step={type === 'currency' ? '0.01' : undefined}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-blue-50 rounded px-1 py-1 transition-colors ${className}`}
      title="Click to edit"
    >
      {type === 'currency' ? formatCurrency(value) : value || 'Click to add...'}
    </div>
  );
};

interface EditableBudgetTableProps {
  budget: Budget;
  onChange?: (budget: Budget) => void;
}

const EditableBudgetTable = ({ budget, onChange }: EditableBudgetTableProps) => {
  const [expandedCells, setExpandedCells] = useState<{ [key: string]: boolean }>({});
  const [budgetData, setBudgetData] = useState<Budget>(budget);

  useEffect(() => {
    setBudgetData(budget);
  }, [budget]);

  useEffect(() => {
    if (onChange) {
      onChange(budgetData);
    }
  }, [budgetData, onChange]);

  const formatCurrency = (amount: string | number): string => {
    let num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) num = 0;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  const toggleExpanded = (itemIndex: number, periodIndex: number) => {
    const key = `${itemIndex}-${periodIndex}`;
    setExpandedCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  type EditPath = 
    | { type: 'budgetItem'; itemIndex: number; field: keyof Budget['list_of_budget_items'][0] }
    | { type: 'period'; itemIndex: number; periodIndex: number }
    | { type: 'expense'; itemIndex: number; periodIndex: number; expenseIndex: number; field: keyof Expense }
    | { type: 'header'; field: keyof Budget };

  const handleCellEdit = (path: EditPath, value: string) => {
    setBudgetData(prevData => {
      const newData = { ...prevData };
      
      // Handle different types of edits based on path
      if (path.type === 'budgetItem') {
        newData.list_of_budget_items[path.itemIndex] = {
          ...newData.list_of_budget_items[path.itemIndex],
          [path.field]: value
        };
      } else if (path.type === 'period') {
        newData.list_of_budget_items[path.itemIndex].periods[path.periodIndex].planned_amount = value;
        // Recalculate summary
        const newSummary = newData.list_of_budget_items[path.itemIndex].periods.reduce((sum, period) => 
          sum + parseFloat(period.planned_amount || '0'), 0);
        newData.list_of_budget_items[path.itemIndex].summary = newSummary.toString();
      } else if (path.type === 'expense') {
        newData.list_of_budget_items[path.itemIndex].periods[path.periodIndex].expense_list[path.expenseIndex] = {
          ...newData.list_of_budget_items[path.itemIndex].periods[path.periodIndex].expense_list[path.expenseIndex],
          [path.field]: value
        };
      } else if (path.type === 'header') {
        (newData as any)[path.field] = value;
      }
      
      return newData;
    });
  };

  const addExpense = (itemIndex: number, periodIndex: number) => {
    const newExpense = {
      name: '',
      owner: '',
      account_number: '',
      amount: '0.00'
    };

    setBudgetData((prevData) => {
      const newData = JSON.parse(JSON.stringify(prevData)); // Deep copy to avoid mutation
      newData.list_of_budget_items[itemIndex].periods[periodIndex].expense_list.push(newExpense);
      return newData;
    });
  };

  const removeExpense = (itemIndex: number, periodIndex: number, expenseIndex: number) => {
    setBudgetData((prevData) => {
      const newData = JSON.parse(JSON.stringify(prevData)); // Deep copy to avoid mutation
      newData.list_of_budget_items[itemIndex].periods[periodIndex].expense_list.splice(expenseIndex, 1);
      return newData;
    });
  };

  const ExpenseDropdown = ({
    expenses,
    isOpen,
    onToggle,
    itemIndex,
    periodIndex
  }: {
    expenses: Expense[];
    isOpen: boolean;
    onToggle: () => void;
    itemIndex: number;
    periodIndex: number;
  }) => {
    return (
      <div className="mt-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </button>
        
        {isOpen && (
          <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
            {expenses.map((expense, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm relative">
                <button
                  onClick={() => removeExpense(itemIndex, periodIndex, idx)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs"
                  title="Remove expense"
                >
                  ×
                </button>
                
                <div className="pr-6">
                  <EditableCell
                    value={expense.name}
                    onSave={(value) => handleCellEdit({ type: 'expense', itemIndex, periodIndex, expenseIndex: idx, field: 'name' }, value)}
                    cellId={`expense-${itemIndex}-${periodIndex}-${idx}-name`}
                    className="font-medium text-gray-800 mb-2"
                  />
                  
                  <div className="flex items-center gap-4 mt-1 text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <EditableCell
                        value={expense.owner ?? ''}
                        onSave={(value) => handleCellEdit({ type: 'expense', itemIndex, periodIndex, expenseIndex: idx, field: 'owner' }, value)}
                        cellId={`expense-${itemIndex}-${periodIndex}-${idx}-owner`}
                        className="min-w-20"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard size={12} />
                      <EditableCell
                        value={expense.account_number}
                        onSave={(value) => handleCellEdit({ type: 'expense', itemIndex, periodIndex, expenseIndex: idx, field: 'account_number' }, value)}
                        cellId={`expense-${itemIndex}-${periodIndex}-${idx}-account`}
                        className="min-w-24"
                      />
                    </div>
                    <div className="flex items-center gap-1 font-medium text-green-600">
                      <DollarSign size={12} />
                      <EditableCell
                        value={expense.amount}
                        onSave={(value) => handleCellEdit({ type: 'expense', itemIndex, periodIndex, expenseIndex: idx, field: 'amount' }, value)}
                        cellId={`expense-${itemIndex}-${periodIndex}-${idx}-amount`}
                        type="currency"
                        className="min-w-20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => addExpense(itemIndex, periodIndex)}
              className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
            >
              + Add Expense
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      {/* Budget Header */}
      <div className="mb-6">
        <EditableCell
          value={budgetData.title}
          onSave={(value) => handleCellEdit({ type: 'header', field: 'title' }, value)}
          cellId="budget-title"
          className="text-3xl font-bold text-gray-900 mb-2"
        />
        <EditableCell
          value={budgetData.description}
          onSave={(value) => handleCellEdit({ type: 'header', field: 'description' }, value)}
          cellId="budget-description"
          className="text-gray-600"
        />
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
                Owner
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Category
              </th>
              {budgetData.period_names.map((period) => (
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
            {budgetData.list_of_budget_items.map((item, itemIndex) => (
              <tr key={itemIndex} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">
                  <div>
                    <EditableCell
                      value={item.label}
                      onSave={(value) => handleCellEdit({ type: 'budgetItem', itemIndex, field: 'label' }, value)}
                      cellId={`item-${itemIndex}-label`}
                      className="font-medium text-gray-900 mb-1"
                    />
                    <EditableCell
                      value={item.account_number}
                      onSave={(value) => handleCellEdit({ type: 'budgetItem', itemIndex, field: 'account_number' }, value)}
                      cellId={`item-${itemIndex}-account`}
                      className="text-sm text-gray-500"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 border-b">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <EditableCell
                      value={item.owner ?? ''}
                      onSave={(value) => handleCellEdit({ type: 'budgetItem', itemIndex, field: 'owner' }, value)}
                      cellId={`item-${itemIndex}-owner`}
                      className="text-gray-700"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 border-b">
                  <EditableCell
                    value={item.category}
                    onSave={(value) => handleCellEdit({ type: 'budgetItem', itemIndex, field: 'category' }, value)}
                    cellId={`item-${itemIndex}-category`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  />
                </td>
                {item.periods.map((period, periodIndex) => (
                  <td key={periodIndex} className="px-6 py-4 border-b">
                    <div className="text-center">
                      <EditableCell
                        value={period.planned_amount}
                        onSave={(value) => handleCellEdit({ type: 'period', itemIndex, periodIndex }, value)}
                        type="currency"
                        cellId={`period-${itemIndex}-${periodIndex}`}
                        className="font-medium text-gray-900 mb-2"
                      />
                      {period.expense_list.length > 0 && (
                        <ExpenseDropdown
                          expenses={period.expense_list}
                          isOpen={!!expandedCells[`${itemIndex}-${periodIndex}`]}
                          onToggle={() => toggleExpanded(itemIndex, periodIndex)}
                          itemIndex={itemIndex}
                          periodIndex={periodIndex}
                        />
                      )}
                      {period.expense_list.length === 0 && (
                        <button
                          onClick={() => addExpense(itemIndex, periodIndex)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          + Add Expense
                        </button>
                      )}
                    </div>
                  </td>
                ))}
                <td className="px-6 py-4 border-b text-center">
                  <div className="font-bold text-lg text-green-600">
                    {formatCurrency(item.summary)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-700">
                Period Totals:
              </td>
              {budgetData.period_names.map((periodName) => {
                const periodTotal = budgetData.list_of_budget_items.reduce((sum, item) => {
                  const period = item.periods.find(p => p.label === periodName);
                  return sum + (period ? parseFloat(period.planned_amount) : 0);
                }, 0);
                return (
                  <td key={periodName} className="px-6 py-4 text-center font-bold text-gray-900">
                    {formatCurrency(periodTotal.toString())}
                  </td>
                );
              })}
              <td className="px-6 py-4 text-center font-bold text-xl text-green-600">
                {formatCurrency(
                  budgetData.list_of_budget_items.reduce((sum, item) => sum + parseFloat(item.summary), 0).toString()
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
          <div className="text-2xl font-bold text-blue-900">{budgetData.list_of_budget_items.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-600">Total Budget</div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(
              budgetData.list_of_budget_items.reduce((sum, item) => sum + parseFloat(item.summary), 0).toString()
            )}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-600">Planning Periods</div>
          <div className="text-2xl font-bold text-purple-900">{budgetData.period_names.length}</div>
        </div>
      </div>
    </div>
  );
};

export default EditableBudgetTable;