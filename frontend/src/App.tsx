import React, { useState, useEffect } from 'react'
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
import DeleteButton from './components/DeleteButton'
import Login from './components/Login'
import HelpModal from './components/HelpModal'
import { CircleQuestionMark } from 'lucide-react'
import HelpButton from './components/HelpButton'

function getUserEmailFromToken(): string {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || '';
  } catch {
    return '';
  }
}

function App() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false)
  const [sideNavKey, setSideNavKey] = useState<number>(0)
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);
  const [newBudgetPeriods, setNewBudgetPeriods] = useState<number>(1);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string>(getUserEmailFromToken());
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess])

  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => setDeleteSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess])

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
      if (!dto.id) {
        const response = await budgetApi.createBudget(dto);
        // If HTTP 201, reload SideNav
        if (response === 201) {
          setSideNavKey(k => k + 1);
        }
      } else {
        await budgetApi.updateBudget(budget.id, dto);
      }
      setSaveSuccess(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!budget) return;
    setDeleting(true);
    setError(null);
    setDeleteSuccess(false);
    try {
      const response =await budgetApi.deleteBudget(budget.id);
      if (response === 204) {
        setSideNavKey(k => k + 1);
      }
      setBudget(null);
      setDeleteSuccess(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete budget');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddBudget = () => {
    setShowNewBudgetModal(true);
    setNewBudgetPeriods(1);
  };

  const handleCreateNewBudget = () => {
    // Create empty period names
    const period_names = Array.from({ length: newBudgetPeriods }, (_, i) => `Period ${i + 1}`);
    const newBudget = {
      id: '',
      title: 'New Budget',
      description: '',
      list_of_budget_items: [],
      period_names,
    };
    setBudget(newBudget);
    setEditing(true);
    setShowNewBudgetModal(false);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUserEmail(getUserEmailFromToken());
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserEmail('');
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <>
        {/* Help Button and Modal (always visible) */}
        <HelpButton onClick={() => setHelpOpen(true)} />
        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        {budget && (
          <div className="flex min-h-screen w-screen bg-white">
            <aside className='border-r border-gray-200 shadow-lg'>
              <Login onLogin={handleLogin} />
            </aside>
            <div className="flex-1 flex flex-col items-center min-h-screen">
            <div className="w-full flex justify-center">
                <p className="text-2xl font-bold my-4">Budget Management System</p>
              </div>
              <span className="flex mb-4 items-center-safe w-full justify-between">
                <Toggle
                  text="Editing"
                  checked={editing}
                  onChange={setEditing}
                />
                <span className="space-x-2" >
                  <SaveButton
                    onClick={handleSave}
                    saving={saving}
                    disabled={!isAuthenticated || !editing}
                    tooltip={!isAuthenticated ? 'You need to log in' : undefined}
                  />
                  <DeleteButton
                    onClick={handleDelete}
                    processing={deleting}
                    disabled={!isAuthenticated}
                    tooltip={!isAuthenticated ? 'You need to log in' : undefined}
                  />
                </span>
              </span>
              {editing && <EditableBudgetTable budget={budget} onChange={setBudget} isAuthenticated={isAuthenticated} />}
              {!editing && <BudgetTable budget={budget} />}
            </div>
          </div>
        )}
        {!budget && (
          <div className="flex min-h-screen w-screen bg-white">
            <main className="flex-1 flex flex-col items-center min-h-screen">
              <div className="app">
                <Login onLogin={handleLogin} />
              </div>
              <div className="text-gray-400 text-ld">- or -</div>
              <FileUpload onDataReceived={handleDataReceived} />
            </main>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex min-h-screen w-screen bg-gray-50">
      {/* Help Button and Modal (always visible) */}
      <HelpButton onClick={() => setHelpOpen(true)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SideNav
        key={sideNavKey}
        onBudgetSelect={handleBudgetSelect}
        onAddBudget={handleAddBudget}
        userName={userEmail}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        <div className="app">
          {budget && (
            <>
              <div className="w-full flex justify-center">
                <p className="text-2xl font-bold mb-4">Budget Management System</p>
              </div>
              <span className="flex mb-4 items-center-safe w-full justify-between">
                <Toggle
                  text="Editing"
                  checked={editing}
                  onChange={setEditing}
                />
                <span className="space-x-2" >
                  <SaveButton
                    onClick={handleSave}
                    saving={saving}
                    disabled={!isAuthenticated || !editing}
                    tooltip={!isAuthenticated ? 'You need to log in' : undefined}
                  />
                  <DeleteButton
                    onClick={handleDelete}
                    processing={deleting}
                    disabled={!isAuthenticated}
                    tooltip={!isAuthenticated ? 'You need to log in' : undefined}
                  />
                </span>
              </span>
            </>
          )}
          {/* New Budget Modal */}
          {showNewBudgetModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                <h3 className="text-lg font-semibold mb-4">Create New Budget</h3>
                <label className="block mb-2 text-sm font-medium">Number of periods:</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={newBudgetPeriods}
                  onChange={e => setNewBudgetPeriods(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setShowNewBudgetModal(false)}
                  >Cancel</button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={handleCreateNewBudget}
                  >Create</button>
                </div>
              </div>
            </div>
          )}
          {!budget && <div className="flex justify-center items-center h-96">
            <FileUpload onDataReceived={handleDataReceived} />
          </div>}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          {saveSuccess && (
            <div className="text-green-600 text-sm mb-2">Budget saved successfully!</div>
          )}
          {budget && !editing && <BudgetTable budget={budget} />}
          {budget && editing && (<>
            <EditableBudgetTable budget={budget} onChange={setBudget} isAuthenticated={isAuthenticated} />
          </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
