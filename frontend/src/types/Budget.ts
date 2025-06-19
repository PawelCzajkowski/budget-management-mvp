interface Expense {
  name: string;
  owner: string | null;
  account_number: string;
  amount: string;  // Using string for Decimal compatibility
}

interface Period {
  label: string;
  planned_amount: string;  // Using string for Decimal compatibility
  expense_list: Expense[];
}

interface BudgetItem {
  owner: string | null;
  label: string;
  account_number: string;
  category: string;
  periods: Period[];
  summary: string;  // Using string for Decimal compatibility
}

interface Budget {
  id: string;
  title: string;
  description: string;
  list_of_budget_items: BudgetItem[];
  period_names: string[];
}

// DTOs for API communication
interface ExpenseDTO {
  name?: string;
  owner?: string;
  account_number?: string;
  amount?: string;  // Using string for Decimal compatibility
}

interface PeriodDTO {
  planned_amount?: string;  // Using string for Decimal compatibility
  name?: string;
  expenses?: ExpenseDTO[];
}

interface BudgetItemDTO {
  owner: string | null;
  name: string;
  account_number: string;
  period_names: string[];
  periods: PeriodDTO[];
  summary: string;  // Using string for Decimal compatibility
}

interface BudgetDTO {
  id?: string;
  title?: string;
  description?: string;
  period_names: string[];
  list_of_budget_items: BudgetItemDTO[];
}

interface ComplexBudgetDTO {
  id?: string;
  period_names: string[];
  budget: BudgetDTO;
}

export type { 
  Expense,
  Period,
  BudgetItem,
  Budget,
  ExpenseDTO,
  PeriodDTO,
  BudgetItemDTO,
  BudgetDTO,
  ComplexBudgetDTO
};