import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
// import DataTable from './components/DataTable'
import type { Budget, ComplexBudgetDTO } from './types/Budget'
import { budgetApi } from './api/routes'
import type { ApiError } from './api/routes'
import { mapRequestToBudget } from './utils/dtoMappers'
import BudgetTable from './components/BudgetTable'
import SideNav from './components/SideNav'

function App() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDataReceived = async (data: ComplexBudgetDTO) => {
    try {
      // Here we would normally make an API call to create/import the budget
      // For now, we'll assume the data is already in the correct format
      
      setBudget(mapRequestToBudget(data))
      setError(null)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to process budget data')
      console.error('Error processing budget data:', err)
    }
  }

  const handleBudgetSelect = async (budgetId: string) => {
    try {
      // Fetch the budget by ID
      const fetchedBudget = await budgetApi.getBudget(budgetId)
      setBudget(mapRequestToBudget(fetchedBudget))
      setError(null)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to load budget')
      console.error('Error loading budget:', err)
    }
  }


  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav onBudgetSelect={handleBudgetSelect} />
      <main className="flex-1">
        <div className="app">
          <p className="text-2xl font-bold mb-4">Budget Management System</p>
          {!budget && <FileUpload onDataReceived={handleDataReceived} />}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          {budget && <BudgetTable budget={budget} />}
        </div>
      </main>
    </div>
  )
}

export default App
