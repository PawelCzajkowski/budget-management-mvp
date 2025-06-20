import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
// import DataTable from './components/DataTable'
import type { Budget, ComplexBudgetDTO } from './types/Budget'
import { budgetApi } from './api/routes'
import type { ApiError } from './api/routes'
import { mapRequestToBudget, mapBudgetToComplexBudgetDTO } from './utils/dtoMappers'
import BudgetTable from './components/BudgetTable'
import EditableBudgetTable from './components/EditableBudgetTable'
import SideNav from './components/SideNav'
import Toggle from './components/Toggle'
import SaveButton from './components/SaveButton'

function App() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

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

  const handleSave = async () => {
    if (!budget) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const dto = mapBudgetToComplexBudgetDTO(budget);
      await budgetApi.updateBudget(budget.id, dto);
      setSaveSuccess(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav onBudgetSelect={handleBudgetSelect} />
      <main className="flex-1">
        <div className="app">
          <p className="text-2xl font-bold mb-4">Budget Management System</p>
          {budget && (
            <Toggle
              text="Editing"
              checked={editing}
              onChange={setEditing}
            />
          )}
          {budget && editing && (
            <SaveButton onClick={handleSave} saving={saving} />
          )}
          {!budget && <FileUpload onDataReceived={handleDataReceived} />}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          {saveSuccess && (
            <div className="text-green-600 text-sm mb-2">Budget saved successfully!</div>
          )}
          {budget && !editing && <BudgetTable budget={budget} />}
          {budget && editing && (
            <EditableBudgetTable budget={budget} onChange={setBudget} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
