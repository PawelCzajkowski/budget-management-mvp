import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import DataTable from './components/DataTable'
import type { Budget, BudgetDTO } from './types/Budget'
import { budgetApi } from './api/routes'
import type { ApiError } from './api/routes'
import { mapBudgetDTOtoBudgetData } from './utils/dtoMappers'

function App() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDataReceived = async (data: BudgetDTO) => {
    try {
      // Here we would normally make an API call to create/import the budget
      // For now, we'll assume the data is already in the correct format
      
      setBudget(mapBudgetDTOtoBudgetData(data))
      setError(null)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to process budget data')
      console.error('Error processing budget data:', err)
    }
  }

  

  return (
    <div className="app">
      <h1>Budget Management System</h1>
      <FileUpload onDataReceived={handleDataReceived} />
      {error && (
        <div style={{ color: 'red', margin: '1rem 0' }}>
          {error}
        </div>
      )}
      {budget && <DataTable data={budget} />}
    </div>
  )
}

export default App
