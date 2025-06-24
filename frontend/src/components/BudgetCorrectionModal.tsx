import React, { useState, useEffect } from 'react';

export interface ActionOptionDTO {
  key: string;
  label: string;
  description: string;
  target_periods?: { period_id: string; label?: string }[];
  max_movable_amount?: number;
  saved_amount?: number;
  redistributable_periods?: { period_id: string; label?: string }[];
}

interface BudgetCorrectionModalProps {
  open: boolean;
  actions: ActionOptionDTO[];
  summary: {
    planned_amount: number;
    expenses_sum: number;
    difference: number;
  };
  onApprove: (correctionPayload: CorrectionPayload) => void;
  onClose: () => void;
}

interface CorrectionPayload {
  action: string;
  move_details?: {
    amount: number;
    target_period_id: string;
  };
  redistribution?: Array<{
    period_id: string;
    amount: number;
  }>;
}

const BudgetCorrectionModal: React.FC<BudgetCorrectionModalProps> = ({ open, actions, summary, onApprove, onClose }) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [moveDetails, setMoveDetails] = useState<{ amount: number; target_period_id: string }>({ amount: 0, target_period_id: '' });
  const [redistribution, setRedistribution] = useState<{ period_id: string; amount: number }[]>([]);
  const [redistributeError, setRedistributeError] = useState<string | null>(null);

  // Set default values when modal opens or action changes
  useEffect(() => {
    if (!open) return;
    if (selectedAction === 'move') {
      const moveAction = actions.find(a => a.key === 'move');
      setMoveDetails({
        amount: moveAction?.max_movable_amount || 0,
        target_period_id: moveAction?.target_periods?.[0]?.period_id || ''
      });
    } else if (selectedAction === 'savings') {
      // Start with one row by default
      setRedistribution([
        { period_id: '', amount: 0 }
      ]);
    }
    // eslint-disable-next-line
  }, [open, selectedAction]);

  // Validate redistribution sum and period uniqueness
  useEffect(() => {
    if (selectedAction === 'savings') {
      const savingsAction = actions.find(a => a.key === 'savings');
      const savedAmount = Number(savingsAction?.saved_amount || 0);
      const total = redistribution.reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);
      const usedPeriods = redistribution.map(r => r.period_id).filter(Boolean);
      const hasDuplicates = new Set(usedPeriods).size !== usedPeriods.length;
      if (hasDuplicates) {
        setRedistributeError('Each period must be unique');
      } else if (Math.abs(total - savedAmount) > 0.01) {
        setRedistributeError(`Total must equal saved amount (${savedAmount})`);
      } else {
        setRedistributeError(null);
      }
    } else {
      setRedistributeError(null);
    }
  }, [redistribution, selectedAction, actions]);

  if (!open) return null;

  const handleApprove = () => {
    const payload: CorrectionPayload = { action: selectedAction };
    if (selectedAction === 'move') {
      payload.move_details = moveDetails;
    } else if (selectedAction === 'savings') {
      payload.redistribution = redistribution.filter(r => Number(r.amount) > 0 && r.period_id);
    }
    onApprove(payload);
  };

  // Helper function to determine if approve button should be disabled
  const isApproveDisabled = () => {
    console.log('DEBUG: selectedAction', selectedAction);
    if (!selectedAction) return true;
    
    // Simple actions that don't require additional input
    if (selectedAction === 'pending' || selectedAction === 'exceeded') {
      return false;
    }
    
    // Move action requires amount and target period
    if (selectedAction === 'move') {
      return !moveDetails.amount || !moveDetails.target_period_id;
    }
    
    // Savings action - use the same validation logic as useEffect
    if (selectedAction === 'savings') {
      const savingsAction = actions.find(a => a.key === 'savings');
      const savedAmount = Number(savingsAction?.saved_amount || 0);
      const total = redistribution.reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);
      const usedPeriods = redistribution.map(r => r.period_id).filter(Boolean);
      const hasDuplicates = new Set(usedPeriods).size !== usedPeriods.length;
      
      console.log('DEBUG: Savings validation', { 
        savedAmount, 
        total, 
        hasDuplicates, 
        usedPeriods, 
        redistribution,
        hasEmptyPeriods: redistribution.some(r => !r.period_id)
      });
      
      // Use the same validation logic as the useEffect
      if (hasDuplicates) {
        return true;
      } else if (Math.abs(total - savedAmount) > 0.01) {
        return true;
      } else {
        return redistribution.some(r => !r.period_id);
      }
    }
    
    return true;
  };

  // Add debug log before return
  console.log('DEBUG: Approve button state', { selectedAction, disabled: isApproveDisabled(), actions });

  // For savings: add/remove redistribution rows
  const savingsAction = actions.find(a => a.key === 'savings');
  const allPeriods = savingsAction?.redistributable_periods || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Resolve Budget Mismatch</h2>
        <div className="mb-4">
          <div className="text-gray-700 mb-2">Choose how to resolve the mismatch:</div>
          <div className="space-y-2">
            {actions.map((action) => (
              <label key={action.key} className="block p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="correction-action"
                  value={action.key}
                  checked={selectedAction === action.key}
                  onChange={() => setSelectedAction(action.key)}
                  className="mr-2"
                />
                <span className="font-semibold">{action.label}</span>
                <span className="block text-sm text-gray-500">{action.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dynamic forms for move/savings */}
        {selectedAction === 'move' && (
          <div className="mb-4">
            <div className="font-medium mb-1">Move Amount</div>
            <input
              type="number"
              min={0}
              max={actions.find(a => a.key === 'move')?.max_movable_amount || 0}
              value={moveDetails.amount}
              onChange={e => setMoveDetails({ ...moveDetails, amount: Number(e.target.value) })}
              className="border rounded px-2 py-1 w-24 mr-2"
            />
            <select
              value={moveDetails.target_period_id}
              onChange={e => setMoveDetails({ ...moveDetails, target_period_id: e.target.value })}
              className="border rounded px-2 py-1"
            >
              <option value="">Select period</option>
              {actions.find(a => a.key === 'move')?.target_periods?.map(p => (
                <option key={p.period_id} value={p.period_id}>{p.label || p.period_id}</option>
              ))}
            </select>
          </div>
        )}
        {selectedAction === 'savings' && (
          <div className="mb-4">
            <div className="font-medium mb-1">Redistribute Saved Amount ({savingsAction?.saved_amount})</div>
            {redistribution.map((row, idx) => (
              <div key={idx} className="flex items-center mb-1 gap-2 justify-center">
                <select
                  value={row.period_id}
                  onChange={e => {
                    const newRows = [...redistribution];
                    newRows[idx].period_id = e.target.value;
                    setRedistribution(newRows);
                  }}
                  className="border rounded px-2 py-1 w-36"
                >
                  <option value="">Select period</option>
                  {allPeriods.map(p => (
                    (!redistribution.some((r, i) => r.period_id === p.period_id && i !== idx)) && (
                      <option key={p.period_id} value={p.period_id}>{p.label || p.period_id}</option>
                    )
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={row.amount || ''}
                  onChange={e => {
                    const newRows = [...redistribution];
                    newRows[idx].amount = Number(e.target.value);
                    setRedistribution(newRows);
                  }}
                  className="border rounded px-2 py-1 w-24"
                />
                {redistribution.length > 1 && (
                  <button
                    type="button"
                    className="ml-1 text-red-500 hover:text-red-700 text-xs px-2 py-1"
                    onClick={() => {
                      setRedistribution(redistribution.filter((_, i) => i !== idx));
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
              onClick={() => {
                setRedistribution([
                  ...redistribution,
                  { period_id: '', amount: 0 }
                ]);
              }}
              disabled={redistribution.length >= allPeriods.length}
            >
              + Add another period
            </button>
            {redistributeError && (
              <div className="text-red-600 text-xs mt-1">{redistributeError}</div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mb-4 bg-gray-50 p-3 rounded">
          <div className="font-medium mb-1">Summary</div>
          <ul className="text-xs text-gray-700">
            <li><span className="font-semibold">Planned Amount:</span> {summary?.planned_amount}</li>
            <li><span className="font-semibold">Expenses Sum:</span> {summary?.expenses_sum}</li>
            <li><span className="font-semibold">Difference:</span> {summary?.difference}</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
          >
            Discard
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleApprove}
            disabled={isApproveDisabled()}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetCorrectionModal; 