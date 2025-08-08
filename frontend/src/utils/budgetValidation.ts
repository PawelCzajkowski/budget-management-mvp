// No imports needed

interface ValidationRequest {
  planned_amount: number;
  expenses: Array<{
    expense_id: string;
    amount: number;
  }>;
  all_periods: Array<{
    period_id: string;
    planned_amount: number;
  }>;
  period_id: string;
}

interface ActionOption {
  key: string;
  label: string;
  description: string;
  target_periods?: Array<{ period_id: string }>;
  max_movable_amount?: number;
  saved_amount?: number;
  redistributable_periods?: Array<{ period_id: string }>;
}

interface ValidationResponse {
  actions: ActionOption[];
  summary: {
    planned_amount: number;
    expenses_sum: number;
    difference: number;
  };
}

export function validatePeriodMismatch(request: ValidationRequest): ValidationResponse {
  const expenses_sum = request.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const difference = request.planned_amount - expenses_sum;

  const actions: ActionOption[] = [];
  
  // If there are future periods, allow "move"
  const future_periods = request.all_periods.filter(p => p.period_id !== request.period_id);
  if (future_periods.length > 0 && difference > 0) {
    actions.push({
      key: "move",
      label: "Move planned expense",
      description: "Move the remaining planned amount to another period.",
      target_periods: future_periods.map(p => ({ period_id: p.period_id })),
      max_movable_amount: difference
    });
  }

  // If there is a positive difference, allow "savings"
  if (difference > 0) {
    actions.push({
      key: "savings",
      label: "Mark as savings",
      description: "The saved amount can be redistributed to future periods.",
      saved_amount: difference,
      redistributable_periods: future_periods.map(p => ({ period_id: p.period_id }))
    });
  }

  // If expenses exceed planned, allow "exceeded"
  if (expenses_sum > request.planned_amount) {
    actions.push({
      key: "exceeded",
      label: "Expenses exceeded",
      description: "Expenses have exceeded the planned amount. Please review and correct."
    });
  }

  return {
    actions,
    summary: {
      planned_amount: request.planned_amount,
      expenses_sum: expenses_sum,
      difference: difference
    }
  };
}
