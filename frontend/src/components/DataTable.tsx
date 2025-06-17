import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useMemo } from 'react';

interface Budget {
  owner: string | null;
  name: string;
  account_number: string;
  period_names: string[];
  planned_amount_per_period: string[];
  summary: string;
}

interface DataTableProps {
  data: {
    period_names: string[];
    list_of_budgets: Budget[];
  };
}

const DataTable = ({ data }: DataTableProps) => {
  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'owner', name: 'Owner' },
      { key: 'name', name: 'Name' },
      { key: 'account_number', name: 'Account Number' },
    ];

    const periodColumns = data.period_names.map((period, index) => ({
      key: `period_${index}`,
      name: period,
    }));

    const summaryColumn = [{ key: 'summary', name: 'Summary' }];

    return [...baseColumns, ...periodColumns, ...summaryColumn];
  }, [data.period_names]);

  const rows = useMemo(() => {
    return data.list_of_budgets.map((budget, index) => {
      const periodValues = budget.planned_amount_per_period.reduce((acc, amount, idx) => {
        acc[`period_${idx}`] = amount;
        return acc;
      }, {} as Record<string, string>);

      return {
        id: index,
        owner: budget.owner || '-',
        name: budget.name,
        account_number: budget.account_number,
        ...periodValues,
        summary: budget.summary
      };
    });
  }, [data.list_of_budgets]);

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
