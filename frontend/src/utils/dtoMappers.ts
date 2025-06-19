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

export const mapBudgetDTOtoBudgetData = (dto: BudgetDTO): Budget => {
  return {
    id: dto.id || '',
    title: dto.title || '',
    description: dto.description || '',
    list_of_budget_items: dto.list_of_budget_items.map((item: BudgetItemDTO) => 
        mapBudgetItemDTOtoBudgetItem(item)),
    period_names: dto.period_names || []
  };
};

export const mapExpenseDTOtoExpense = (expense: ExpenseDTO): Expense => ({
    name: expense.name || '',
    owner: expense.owner || '',
    account_number: expense.account_number || '',
    amount: expense.amount || '',
})

export const mapPeriodDTOtoPeriod = (period: PeriodDTO): Period => ({
    label: period.name || '',
    planned_amount: period.planned_amount || '',
    expense_list: period.expenses?.map(expense => mapExpenseDTOtoExpense(expense)) || [],
});

export const mapBudgetItemDTOtoBudgetItem = (item: BudgetItemDTO): BudgetItem => ({
    owner: item.owner || '',
    label: item.name || '',
    account_number: item.account_number || '',
    category: '',
    periods: item.periods?.map(period => mapPeriodDTOtoPeriod(period)) || [],
    summary: item.summary || '',
});
