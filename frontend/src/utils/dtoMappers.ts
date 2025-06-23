import type { Budget, BudgetDTO, BudgetItem, BudgetItemDTO, ComplexBudgetDTO, Expense, ExpenseDTO, Period, PeriodDTO } from '../types/Budget';

export const mapRequestToBudget = (request: ComplexBudgetDTO): Budget => {
  return {
    id: request.id || '',
    title: request.budget.title || '',
    description: request.budget.description || '',
    list_of_budget_items: request.budget.list_of_budget_items.map(item => mapBudgetItemDTOtoBudgetItem(item)),
    period_names: request.period_names || []
  };
};

const mapBudgetDTOtoBudgetData = (dto: BudgetDTO): Budget => {
  return {
    id: dto.id || '',
    title: dto.title || '',
    description: dto.description || '',
    list_of_budget_items: dto.list_of_budget_items.map((item: BudgetItemDTO) => 
        mapBudgetItemDTOtoBudgetItem(item)),
    period_names: dto.period_names || []
  };
};

const mapExpenseDTOtoExpense = (expense: ExpenseDTO): Expense => ({
    name: expense.name || '',
    owner: expense.owner || '',
    account_number: expense.account_number || '',
    amount: expense.amount || '',
})

const mapPeriodDTOtoPeriod = (period: PeriodDTO): Period => ({
    label: period.name || '',
    planned_amount: period.planned_amount || '',
    expense_list: period.expenses?.map(expense => mapExpenseDTOtoExpense(expense)) || [],
});

const mapBudgetItemDTOtoBudgetItem = (item: BudgetItemDTO): BudgetItem => ({
    owner: item.owner || '',
    label: item.name || '',
    account_number: item.account_number || '',
    category: item.category || '',
    periods: item.periods?.map(period => mapPeriodDTOtoPeriod(period)) || [],
    summary: item.summary || '',
});

const mapExpenseToExpenseDTO = (expense: Expense): ExpenseDTO => ({
  name: expense.name || '',
  owner: expense.owner || '',
  account_number: expense.account_number || '',
  amount: expense.amount || '',
});

const mapPeriodToPeriodDTO = (period: Period): PeriodDTO => ({
  name: period.label || '',
  planned_amount: period.planned_amount || '',
  expenses: period.expense_list.map(expense => mapExpenseToExpenseDTO(expense)),
});

const mapBudgetItemToBudgetItemDTO = (item: BudgetItem): BudgetItemDTO => ({
  owner: item.owner || '',
  name: item.label || '',
  account_number: item.account_number || '',
  category: item.category || '',
  period_names: [], // Assuming this is not used in the backend
  periods: item.periods.map(period => mapPeriodToPeriodDTO(period)),
  summary: item.summary || '',
});

const mapBudgetToBudgetDTO = (budget: Budget): BudgetDTO => {
  return {
    id: budget.id || '',
    title: budget.title || '',
    description: budget.description || '',
    period_names: budget.period_names || [],
    list_of_budget_items: budget.list_of_budget_items.map(item => mapBudgetItemToBudgetItemDTO(item)),
  };
};


export const mapBudgetToComplexBudgetDTO = (budget: Budget): ComplexBudgetDTO => {
  return {
    id: budget.id,
    budget: mapBudgetToBudgetDTO(budget),
    period_names: budget.period_names
  };
}
