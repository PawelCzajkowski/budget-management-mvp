import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import DataTable from './components/DataTable'

interface BudgetData {
  period_names: string[];
  list_of_budgets: Array<{
    owner: string | null;
    name: string;
    account_number: string;
    period_names: string[];
    planned_amount_per_period: string[];
    summary: string;
  }>;
}

function App() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)

  return (
    <div className="app">
      <h1>Budget Management System</h1>
      <FileUpload onDataReceived={setBudgetData} />
      {budgetData && <DataTable data={budgetData} />}
    </div>
  )
}

export default App
