import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useMemo } from 'react';
import type { Budget } from '../types/Budget';

interface DataTableProps {
  data: Budget;
}

const DataTable = ({ data }: DataTableProps) => {
  const columns = useMemo(() => {      const baseColumns = [
      { key: 'owner', name: 'Owner' },
      { key: 'label', name: 'Name' },
      { key: 'account_number', name: 'Account Number' },
      { key: 'category', name: 'Category' },
    ];

    const periodColumns = data.period_names.map((periodName, index) => ({
      key: `period_${index}`,
      name: periodName,
    }));

    const summaryColumn = [{ key: 'summary', name: 'Summary' }];
    const expenseColumns = [
      { key: 'expenses', name: 'Expenses', width: 300 }
    ];

    return [...baseColumns, ...periodColumns, ...summaryColumn, ...expenseColumns];
  }, [data.period_names]);

  const rows = useMemo(() => {
    return data.list_of_budget_items.map((budgetItem, index) => {
      // Create an object with period amounts
      const periodValues = budgetItem.periods.reduce((acc, period, idx) => {
        acc[`period_${idx}`] = period.planned_amount;
        return acc;
      }, {} as Record<string, string>);

      // Format expenses for display
      const expensesText = budgetItem.periods
        .map(period => {
          if (period.expense_list.length === 0) return null;
          return `${period.label}: ${period.expense_list.map(expense => 
            `${expense.name} (${expense.amount})`
          ).join(', ')}`;
        })
        .filter(Boolean)
        .join(' | ');

      return {
        id: index,
        owner: budgetItem.owner || '-',
        label: budgetItem.label,
        account_number: budgetItem.account_number,
        category: budgetItem.category,
        ...periodValues,
        summary: budgetItem.summary,
        expenses: expensesText || '-'
      };
    });
  }, [data.list_of_budget_items, data.period_names]);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <DataGrid
        columns={columns}
        rows={rows}
        defaultColumnOptions={{
          sortable: true,
          resizable: true
        }}
      />
    </div>
  );
};

export default DataTable;
