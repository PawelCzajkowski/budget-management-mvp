import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import { Routes, Route } from 'react-router-dom';
import { budgetApi, setApiAuthToken } from './api/routes';
import { mapRequestToBudget, mapBudgetToComplexBudgetDTO } from './utils/dtoMappers';
import BudgetTable from './components/BudgetTable';
import EditableBudgetTable from './components/EditableBudgetTable';
import SideNav from './components/SideNav';
import Toggle from './components/Toggle';
import SaveButton from './components/SaveButton';
import DeleteButton from './components/DeleteButton';
import Login from './components/Login';
import HelpModal from './components/HelpModal';
import HelpButton from './components/HelpButton';
import { useAuth } from "react-oidc-context";
import PrivacyPolicyComponent from './components/PrivacyPolicy';
import TermsOfServiceComponent from './components/TermsOfService';
import { Footer } from './components/Footer';
function getUserNameFromAuth(auth) {
    if (!auth.user)
        return '';
    return auth.user.profile.name || '';
}
function App() {
    const [budget, setBudget] = useState(null);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [sideNavKey, setSideNavKey] = useState(0);
    const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);
    const [newBudgetPeriods, setNewBudgetPeriods] = useState(1);
    const [userName, setUserName] = useState('');
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
    }, [saveSuccess]);
    useEffect(() => {
        if (deleteSuccess) {
            const timer = setTimeout(() => setDeleteSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [deleteSuccess]);
    useEffect(() => {
        setApiAuthToken(auth.user?.id_token ?? null);
    }, [auth.user]);
    const handleDataReceived = async (data) => {
        try {
            // Here we would normally make an API call to create/import the budget
            // For now, we'll assume the data is already in the correct format
            setBudget(mapRequestToBudget(data));
            setError(null);
        }
        catch (err) {
            const apiError = err;
            setError(apiError.message || 'Failed to process budget data');
            console.error('Error processing budget data:', err);
        }
    };
    const handleBudgetSelect = async (budgetId) => {
        try {
            // Fetch the budget by ID
            const fetchedBudget = await budgetApi.getBudget(budgetId);
            setBudget(mapRequestToBudget(fetchedBudget));
            setError(null);
        }
        catch (err) {
            const apiError = err;
            setError(apiError.message || 'Failed to load budget');
            console.error('Error loading budget:', err);
        }
    };
    const handleSave = async () => {
        if (!budget)
            return;
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
            }
            else {
                await budgetApi.updateBudget(budget.id, dto);
            }
            setSaveSuccess(true);
        }
        catch (err) {
            const apiError = err;
            setError(apiError.message || 'Failed to save budget');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!budget)
            return;
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
        }
        catch (err) {
            const apiError = err;
            setError(apiError.message || 'Failed to delete budget');
        }
        finally {
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
    };
    const handleLogout = () => {
        window.location.reload();
    };
    if (!auth.isAuthenticated) {
        return (_jsxs("div", { className: "flex min-h-screen w-screen bg-white", children: [_jsx(HelpButton, { onClick: () => setHelpOpen(true) }), _jsx(HelpModal, { open: helpOpen, onClose: () => setHelpOpen(false) }), _jsx(SideNav, { onBudgetSelect: handleBudgetSelect, onAddBudget: handleAddBudget, userName: userName, onLogout: () => { }, onLogin: openLoginModal, isAuthenticated: auth.isAuthenticated }, sideNavKey), _jsx("main", { className: "flex-1 flex flex-col items-center min-h-screen", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/privacy-policy", element: _jsx(PrivacyPolicyComponent, {}) }), _jsx(Route, { path: "/terms-of-service", element: _jsx(TermsOfServiceComponent, {}) }), _jsx(Route, { path: "/", element: _jsxs(_Fragment, { children: [showLoginModal && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/40 z-50", children: _jsxs("div", { className: "relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-0 max-h-screen border border-blue-200", children: [_jsx("button", { className: "absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none", onClick: () => setShowLoginModal(false), "aria-label": "Close login modal", children: "\u00D7" }), _jsx("div", { className: "px-8 py-8", children: _jsx(Login, {}) })] }) })), showNewBudgetModal && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/50 z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg w-80", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Create New Budget" }), _jsx("label", { className: "block mb-2 text-sm font-medium", children: "Number of periods:" }), _jsx("input", { type: "number", min: 1, max: 24, value: newBudgetPeriods, onChange: e => setNewBudgetPeriods(Number(e.target.value)), className: "w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { className: "px-4 py-2 bg-gray-200 rounded hover:bg-gray-300", onClick: () => setShowNewBudgetModal(false), children: "Cancel" }), _jsx("button", { className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", onClick: handleCreateNewBudget, children: "Create" })] })] }) })), budget && (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-full flex justify-center", children: _jsx("p", { className: "text-2xl font-bold my-4", children: "Budget Management System" }) }), _jsxs("span", { className: "flex mb-4 items-center-safe w-full justify-between", children: [_jsx(Toggle, { text: "Editing", checked: editing, onChange: setEditing }), _jsxs("span", { className: "space-x-2", children: [_jsx(SaveButton, { onClick: handleSave, saving: saving, disabled: !auth.isAuthenticated || !editing, tooltip: !auth.isAuthenticated ? 'You need to log in' : undefined }), _jsx(DeleteButton, { onClick: handleDelete, processing: deleting, disabled: !auth.isAuthenticated, tooltip: !auth.isAuthenticated ? 'You need to log in' : undefined })] })] }), editing && _jsx(EditableBudgetTable, { budget: budget, onChange: setBudget, isAuthenticated: auth.isAuthenticated }), !editing && _jsx(BudgetTable, { budget: budget })] })), !budget && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-center gap-1 text-lg mb-4", children: [_jsx("span", { className: "text-gray-500", children: "Using this app you agree to our" }), _jsx(Footer, {})] }), _jsx("div", { className: "app", children: _jsx(Login, {}) }), _jsx("div", { className: "text-gray-400 text-ld", children: "- or -" }), _jsx(FileUpload, { onDataReceived: handleDataReceived })] }))] }) })] }) })] }));
    }
    return (_jsxs("div", { className: "flex min-h-screen w-screen bg-gray-50", children: [_jsx(HelpButton, { onClick: () => setHelpOpen(true) }), _jsx(HelpModal, { open: helpOpen, onClose: () => setHelpOpen(false) }), _jsx(SideNav, { onBudgetSelect: handleBudgetSelect, onAddBudget: handleAddBudget, userName: userName, onLogout: handleLogout, isAuthenticated: auth.isAuthenticated }, sideNavKey), _jsx("main", { className: "flex-1", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/privacy-policy", element: _jsx(PrivacyPolicyComponent, {}) }), _jsx(Route, { path: "/terms-of-service", element: _jsx(TermsOfServiceComponent, {}) }), _jsx(Route, { path: "/", element: _jsxs("div", { className: "app", children: [budget && (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-full flex justify-center", children: _jsx("p", { className: "text-2xl font-bold mb-4", children: "Budget Management System" }) }), _jsxs("span", { className: "flex mb-4 items-center-safe w-full justify-between", children: [_jsx(Toggle, { text: "Editing", checked: editing, onChange: setEditing }), _jsxs("span", { className: "space-x-2", children: [_jsx(SaveButton, { onClick: handleSave, saving: saving, disabled: !auth.isAuthenticated || !editing, tooltip: !auth.isAuthenticated ? 'You need to log in' : undefined }), _jsx(DeleteButton, { onClick: handleDelete, processing: deleting, disabled: !auth.isAuthenticated, tooltip: !auth.isAuthenticated ? 'You need to log in' : undefined })] })] })] })), showNewBudgetModal && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/50 z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg w-80", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Create New Budget" }), _jsx("label", { className: "block mb-2 text-sm font-medium", children: "Number of periods:" }), _jsx("input", { type: "number", min: 1, max: 24, value: newBudgetPeriods, onChange: e => setNewBudgetPeriods(Number(e.target.value)), className: "w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { className: "px-4 py-2 bg-gray-200 rounded hover:bg-gray-300", onClick: () => setShowNewBudgetModal(false), children: "Cancel" }), _jsx("button", { className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", onClick: handleCreateNewBudget, children: "Create" })] })] }) })), !budget && _jsx("div", { className: "flex justify-center items-center h-96", children: _jsx(FileUpload, { onDataReceived: handleDataReceived }) }), error && (_jsx("div", { className: "text-red-500 text-sm", children: error })), saveSuccess && (_jsx("div", { className: "text-green-600 text-sm mb-2", children: "Budget saved successfully!" })), budget && !editing && _jsx(BudgetTable, { budget: budget }), budget && editing && (_jsx(_Fragment, { children: _jsx(EditableBudgetTable, { budget: budget, onChange: setBudget, isAuthenticated: auth.isAuthenticated }) }))] }) })] }) })] }));
}
export default App;
