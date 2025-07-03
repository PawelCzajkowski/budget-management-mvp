import React, { useState, useEffect } from 'react';
import type { Budget, Expense } from '../types/Budget';
import { ChevronDown, ChevronRight, Trash2, CircleX, AlertCircle } from 'lucide-react';
import BudgetCorrectionModal from './BudgetCorrectionModal';
import type { ActionOptionDTO } from './BudgetCorrectionModal';
import { budgetApi } from '../api/routes';

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
      {value || 'Click to add...'}
    </div>
  );
};

interface EditableBudgetTableProps {
  budget: Budget;
  onChange?: (budget: Budget) => void;
  isAuthenticated: boolean;
}

const EditableBudgetTable = ({ budget, onChange, isAuthenticated }: EditableBudgetTableProps) => {
  const [expandedCells, setExpandedCells] = useState<{ [key: string]: boolean }>({});
  const [budgetData, setBudgetData] = useState<Budget>(budget);

  // Correction modal state
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionActions, setCorrectionActions] = useState<ActionOptionDTO[]>([]);
  const [correctionSummary, setCorrectionSummary] = useState<any>(null);
  const [correctionContext, setCorrectionContext] = useState<{ itemIndex: number; periodIndex: number } | null>(null);

  const [periodValidation, setPeriodValidation] = useState<{ [key: string]: boolean }>({});

  const parseCurrency = (value: string | number | undefined | null): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    // Remove anything that is not a digit, a decimal point, or a negative sign.
    const sanitized = value.replace(/[^0-9.-]/g, '');
    const number = parseFloat(sanitized);
    return isNaN(number) ? 0 : number;
  };

  useEffect(() => {
    setBudgetData(budget);
  }, [budget]);

  useEffect(() => {
    if (onChange) {
      onChange(budgetData);
    }
  }, [budgetData, onChange]);

  useEffect(() => {
    budgetData.list_of_budget_items.forEach((item, itemIndex) => {
      item.periods.forEach((_, periodIndex) => {
        validatePeriod(itemIndex, periodIndex);
      });
    });
    // eslint-disable-next-line
  }, [budgetData]);

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

  // Helper to validate period and update notification icon state
  const validatePeriod = (itemIndex: number, periodIndex: number) => {
    const period = budgetData.list_of_budget_items[itemIndex].periods[periodIndex];
    const plannedAmount = parseFloat(period.planned_amount);
    const expensesSum = period.expense_list.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    setPeriodValidation(prev => ({
      ...prev,
      [`${itemIndex}-${periodIndex}`]: plannedAmount !== expensesSum
    }));
  };

  // Correction modal handlers
  const handleCorrectionApprove = (correctionPayload: any) => {
    if (!correctionContext) return;
    const { itemIndex, periodIndex } = correctionContext;
    const updatedBudget = JSON.parse(JSON.stringify(budgetData));

    if (correctionPayload.action === 'move' && correctionPayload.move_details) {
      const moveAmount = parseCurrency(correctionPayload.move_details.amount);
      // Subtract from current period
      const sourcePeriod = updatedBudget.list_of_budget_items[itemIndex].periods[periodIndex];
      sourcePeriod.planned_amount = String(parseCurrency(sourcePeriod.planned_amount) - moveAmount);
      // Add to target period (within the same budget item)
      const targetPeriod = updatedBudget.list_of_budget_items[itemIndex].periods.find(
        (p: any) => p.label === correctionPayload.move_details.target_period_id
      );
      if (targetPeriod) {
        targetPeriod.planned_amount = String(parseCurrency(targetPeriod.planned_amount) + moveAmount);
      }
    } else if (correctionPayload.action === 'savings' && correctionPayload.redistribution) {
      // Subtract total redistributed from current period
      const sourcePeriod = updatedBudget.list_of_budget_items[itemIndex].periods[periodIndex];
      const totalRedistributed = correctionPayload.redistribution.reduce((sum: number, r: any) => sum + parseCurrency(r.amount), 0);
      sourcePeriod.planned_amount = String(parseCurrency(sourcePeriod.planned_amount) - totalRedistributed);
      // Add to each target period (within the same budget item)
      correctionPayload.redistribution.forEach((r: any) => {
        const targetPeriod = updatedBudget.list_of_budget_items[itemIndex].periods.find(
          (p: any) => p.label === r.period_id
        );
        if (targetPeriod) {
          targetPeriod.planned_amount = String(parseCurrency(targetPeriod.planned_amount) + parseCurrency(r.amount));
        }
      });
    }
    setBudgetData(updatedBudget);
    setCorrectionModalOpen(false);
  };
  const handleCorrectionClose = () => {
    setCorrectionModalOpen(false);
  };

  // Patch handleCellEdit to validate period after period/expense edits
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
        setTimeout(() => validatePeriod(path.itemIndex, path.periodIndex), 0);
      } else if (path.type === 'expense') {
        newData.list_of_budget_items[path.itemIndex].periods[path.periodIndex].expense_list[path.expenseIndex] = {
          ...newData.list_of_budget_items[path.itemIndex].periods[path.periodIndex].expense_list[path.expenseIndex],
          [path.field]: value
        };
        setTimeout(() => validatePeriod(path.itemIndex, path.periodIndex), 0);
      } else if (path.type === 'header') {
        (newData as any)[path.field] = value;
      }
      
      return newData;
    });
  };

  // Patch addExpense and removeExpense to validate period
  const addExpense = (itemIndex: number, periodIndex: number) => {
    const newExpense = {
      name: '',
      owner: '',
      account_number: '',
      amount: '0.00'
    };
    setBudgetData((prevData) => {
      const newData = JSON.parse(JSON.stringify(prevData));
      newData.list_of_budget_items[itemIndex].periods[periodIndex].expense_list.push(newExpense);
      setTimeout(() => validatePeriod(itemIndex, periodIndex), 0);
      return newData;
    });
  };

  const removeExpense = (itemIndex: number, periodIndex: number, expenseIndex: number) => {
    setBudgetData((prevData) => {
      const newData = JSON.parse(JSON.stringify(prevData));
      newData.list_of_budget_items[itemIndex].periods[periodIndex].expense_list.splice(expenseIndex, 1);
      setTimeout(() => validatePeriod(itemIndex, periodIndex), 0);
      return newData;
    });
  };

  // New: Handler for notification icon click
  const handleNotificationClick = async (itemIndex: number, periodIndex: number) => {
    const period = budgetData.list_of_budget_items[itemIndex].periods[periodIndex];
    const plannedAmount = parseFloat(period.planned_amount);
    const payload = {
      budget_id: budgetData.id,
      period_id: period.label,
      planned_amount: plannedAmount,
      expenses: period.expense_list.map(exp => ({
          expense_id: exp.id || '',
          amount: parseFloat(exp.amount)
         })),
      all_periods: budgetData.period_names.map((name, idx) => ({
        period_id: name,
        planned_amount: parseFloat(
          budgetData.list_of_budget_items[itemIndex].periods[idx]?.planned_amount || '0'
        ),
      })),
    };
    try {
      const result = await budgetApi.validatePeriodMismatch(payload);
      setCorrectionActions(result.actions);
      setCorrectionSummary(result.summary);
      setCorrectionContext({ itemIndex, periodIndex });
      setCorrectionModalOpen(true);
    } catch (err) {
      // Optionally handle error
    }
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
                   <CircleX />
                </button>
                
                <div className="pr-6">
                  <EditableCell
                    value={expense.name}
                    onSave={(value) => handleCellEdit({ type: 'expense', itemIndex, periodIndex, expenseIndex: idx, field: 'name' }, value)}
                    cellId={`expense-${itemIndex}-${periodIndex}-${idx}-name`}
                    className="font-medium text-gray-800 mb-2"
                  />
                  
                  <div className="flex items-center gap-4 mt-1 text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1 font-medium text-green-600">
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

  // Add a new budget item at the end of the list
  const addBudgetItem = () => {
    const newBudgetItem = {
      owner: '',
      label: '',
      account_number: '',
      category: '',
      periods: budgetData.period_names.map((periodName) => ({
        label: periodName,
        planned_amount: '0.00',
        expense_list: []
      })),
      summary: '0.00'
    };
    setBudgetData((prevData) => ({
      ...prevData,
      list_of_budget_items: [...prevData.list_of_budget_items, newBudgetItem]
    }));
  };

  const removeBudgetItem = (itemIndex: number) => {
    setBudgetData((prevData) => {
      const newData = { ...prevData };
      newData.list_of_budget_items = [
        ...newData.list_of_budget_items.slice(0, itemIndex),
        ...newData.list_of_budget_items.slice(itemIndex + 1)
      ];
      return newData;
    });
  };

  const handlePeriodNameEdit = (periodIndex: number, value: string) => {
    setBudgetData((prevData) => {
      const newData = { ...prevData };
      // Update period_names
      newData.period_names = [...newData.period_names];
      newData.period_names[periodIndex] = value;
      // Update each item's period label
      newData.list_of_budget_items = newData.list_of_budget_items.map((item) => {
        const newPeriods = item.periods.map((period, idx) =>
          idx === periodIndex ? { ...period, label: value } : period
        );
        return { ...item, periods: newPeriods };
      });
      return newData;
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      {/* Correction Modal */}
      <BudgetCorrectionModal
        open={correctionModalOpen}
        actions={correctionActions}
        summary={correctionSummary}
        onApprove={handleCorrectionApprove}
        onClose={handleCorrectionClose}
      />
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
                
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Budget Item
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Account number
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Owner
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b">
                Category
              </th>
              {budgetData.period_names.map((period, periodIndex) => (
                <th key={period} className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b">
                  <EditableCell
                    value={period}
                    onSave={(value) => handlePeriodNameEdit(periodIndex, value)}
                    cellId={`period-header-${periodIndex}`}
                    className="text-center font-semibold"
                  />
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
                <td className="px-6 py-4 border-b text-center">
                  <button
                    onClick={() => removeBudgetItem(itemIndex)}
                    className="flex items-center justify-center text-red-400 hover:text-red-500"
                    title="Remove this item"
                  >
                    <Trash2 />
                  </button>
                </td>
                <td className="px-6 py-4 border-b">
                  <div>
                    <EditableCell
                      value={item.label}
                      onSave={(value) => handleCellEdit({ type: 'budgetItem', itemIndex, field: 'label' }, value)}
                      cellId={`item-${itemIndex}-label`}
                      className="font-medium text-gray-900 mb-1"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 border-b">
                  <div className="flex items-center gap-2">
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
                {item.periods.map((period, periodIndex) => {
                  const plannedAmount = parseFloat(period.planned_amount);
                  const expensesSum = period.expense_list.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
                  const exceeded = expensesSum > plannedAmount;
                  const mismatch = periodValidation[`${itemIndex}-${periodIndex}`];
                  return (
                    <td key={periodIndex} className={`px-6 py-4 border-b ${exceeded ? 'border-2 border-red-500 bg-red-50' : ''}`}>
                      <div className="text-center relative">
                        <div className="flex items-center justify-center mb-2 gap-1">
                          <EditableCell
                            value={period.planned_amount}
                            onSave={(value) => handleCellEdit({ type: 'period', itemIndex, periodIndex }, value)}
                            type="currency"
                            cellId={`period-${itemIndex}-${periodIndex}`}
                            className={`font-medium text-gray-900 min-w-24  ${exceeded ? 'text-red-600' : ''}`}
                          />
                          {mismatch && (
                            <button
                              className="ml-1 p-0.5 rounded-full border border-yellow-300 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 relative group"
                              title="Resolve period mismatch"
                              style={{ lineHeight: 0 }}
                              onMouseDown={e => { e.preventDefault(); handleNotificationClick(itemIndex, periodIndex); }}
                              disabled={!isAuthenticated}
                            >
                              <AlertCircle size={18} className="text-yellow-500" />
                              {!isAuthenticated && (
                                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs bg-black text-white rounded shadow z-10 whitespace-nowrap">
                                  You need to log in
                                </span>
                              )}
                            </button>
                          )}
                        </div>
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
                        {exceeded && (
                          <div className="mt-1 text-xs text-red-600 font-semibold">Exceeded!</div>
                        )}
                      </div>
                    </td>
                  );
                })}
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
              <td colSpan={5} className="px-6 py-4 text-right font-semibold text-gray-700">
                Period Totals:
              </td>
              {budgetData.period_names.map((periodName) => {
                const periodTotal = budgetData.list_of_budget_items.reduce((sum, item) => {
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
                  budgetData.list_of_budget_items.reduce((sum, item) => sum + parseFloat(item.summary), 0).toString()
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Budget Item Button */}
      <div className="flex mt-2">
        <button
          onClick={addBudgetItem}
          className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          + Add Budget Item
        </button>
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
            {(
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