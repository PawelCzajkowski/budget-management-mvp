import { useState, useEffect } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import { Routes, Route } from 'react-router-dom'
import type { Budget, ComplexBudgetDTO } from './types/Budget'
import { budgetApi, setApiAuthToken } from './api/routes'
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
import HelpButton from './components/HelpButton'
import { useAuth } from "react-oidc-context";
import PrivacyPolicyComponent from './components/PrivacyPolicy'
import TermsOfServiceComponent from './components/TermsOfService'
import { Footer } from './components/Footer'
import Spinner from './components/Spinner'
import ContactSection from './components/ContactSection'

function getUserNameFromAuth(auth: ReturnType<typeof useAuth>): string {
  if (!auth.user) return '';
  return auth.user.profile.name || '';
}

function App() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false)
  const [sideNavKey, setSideNavKey] = useState<number>(0)
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);
  const [newBudgetPeriods, setNewBudgetPeriods] = useState<number>(1);
  const [userName, setUserName] = useState<string>('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const auth = useAuth();

  useEffect(() => {
    setUserName(getUserNameFromAuth(auth));
  }, [auth.user]);

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

  useEffect(() => {
    setApiAuthToken(auth.user?.id_token ?? null);
  }, [auth.user]);

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
      setLoading(true);
      const fetchedBudget = await budgetApi.getBudget(budgetId)
      setBudget(mapRequestToBudget(fetchedBudget))
      setError(null)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to load budget')
      console.error('Error loading budget:', err)
    } finally {
      setLoading(false)
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
      const response = await budgetApi.deleteBudget(budget.id);
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

  // Open login modal handler
  const openLoginModal = () => {
    auth.signinRedirect();
  }

  const handleLogout = () => {
    window.location.reload();
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen w-screen bg-white">
        {/* Help Button and Modal (always visible) */}
        <HelpButton onClick={() => setHelpOpen(true)} />
        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <SideNav
          key={sideNavKey}
          onBudgetSelect={handleBudgetSelect}
          onAddBudget={handleAddBudget}
          userName={userName}
          onLogout={() => { }} // No logout for logged-out users
          onLogin={openLoginModal}
          isAuthenticated={auth.isAuthenticated}
        />
        <main className="flex-1 flex flex-col items-center min-h-screen">
          <Routes>
            <Route path="/privacy-policy" element={<PrivacyPolicyComponent />} />
            <Route path="/terms-of-service" element={<TermsOfServiceComponent />} />
            <Route path="/" element={<>
              <div className="flex items-center justify-center gap-1 text-lg mb-4">
                <span className="text-gray-500">Using this app you agree to our</span>
                <Footer />
              </div>
              {showLoginModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-0 max-h-screen border border-blue-200">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
                      onClick={() => setShowLoginModal(false)}
                      aria-label="Close login modal"
                    >
                      ×
                    </button>
                    <div className="px-8 py-8">
                      <Login />
                    </div>
                  </div>
                </div>
              )}
              {/* New Budget Modal for logged-out users */}
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
              {budget && (
                <>
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
                        disabled={!auth.isAuthenticated || !editing}
                        tooltip={!auth.isAuthenticated ? 'You need to log in' : undefined}
                      />
                      <DeleteButton
                        onClick={handleDelete}
                        processing={deleting}
                        disabled={!auth.isAuthenticated}
                        tooltip={!auth.isAuthenticated ? 'You need to log in' : undefined}
                      />
                    </span>
                  </span>
                  {editing && <EditableBudgetTable budget={budget} onChange={setBudget} isAuthenticated={auth.isAuthenticated} />}
                  {!editing && <BudgetTable budget={budget} />}
                </>
              )}
              {!budget && (
                <>
                  <div className="app">
                    <Login />
                  </div>
                  <div className="text-gray-400 text-ld">- or -</div>
                  <FileUpload onDataReceived={handleDataReceived} />
                  <div className="text-gray-400 text-ld">- or -</div>
                  <ContactSection />
                </>
              )}
              
            </>} />
          </Routes>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-screen bg-gray-50">
      {loading && <Spinner />}
      {/* Help Button and Modal (always visible) */}
      <HelpButton onClick={() => setHelpOpen(true)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SideNav
        key={sideNavKey}
        onBudgetSelect={handleBudgetSelect}
        onAddBudget={handleAddBudget}
        userName={userName}
        onLogout={handleLogout}
        isAuthenticated={auth.isAuthenticated}
      />
      <main className="flex-1">
        <Routes>
          <Route path="/privacy-policy" element={<PrivacyPolicyComponent />} />
          <Route path="/terms-of-service" element={<TermsOfServiceComponent />} />
          <Route path="/" element={
            <div className="app">
              <div className="flex items-center justify-center gap-1 text-lg mb-4">
                <span className="text-gray-500">Using this app you agree to our</span>
                <Footer />
              </div>
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
                        disabled={!auth.isAuthenticated || !editing}
                        tooltip={!auth.isAuthenticated ? 'You need to log in' : undefined}
                      />
                      <DeleteButton
                        onClick={handleDelete}
                        processing={deleting}
                        disabled={!auth.isAuthenticated}
                        tooltip={!auth.isAuthenticated ? 'You need to log in' : undefined}
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
                <EditableBudgetTable budget={budget} onChange={setBudget} isAuthenticated={auth.isAuthenticated} />
              </>
              )}
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}

export default App
