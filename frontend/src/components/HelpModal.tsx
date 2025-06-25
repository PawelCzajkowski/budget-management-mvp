import React from 'react';
import { Info, UserPlus, Upload, Table, PlusCircle, ListChecks, CheckCircle2, Trash2, LogOut, Lightbulb } from 'lucide-react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-0 max-h-screen overflow-y-auto relative border border-blue-200">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close help modal"
        >
          ×
        </button>
        <div className="bg-blue-100 rounded-t-2xl px-8 py-5 flex items-center gap-3">
          <Info className="text-blue-500" size={32} />
          <h2 className="text-2xl font-bold text-blue-500">Help & Manual</h2>
        </div>
        <div className="space-y-6 text-gray-700 text-base px-8 py-6">
          <div className="mb-2">
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <UserPlus className="text-blue-500" size={20} />
              Login & Register
            </p>
            <p className="ml-7">Sign in or create an account to manage your budgets securely.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div>
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Upload className="text-blue-500" size={20} />
              Import Budgets
            </p>
            <p className="ml-7">Upload a CSV file or load mock data to get started quickly.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div>
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Table className="text-blue-500" size={20} />
              View & Edit Budgets
            </p>
            <p className="ml-7">See your budgets in a table. Click on fields to edit them directly.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div>
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <PlusCircle className="text-blue-500" size={20} />
              Add/Remove Items
            </p>
            <p className="ml-7">Add new budget items or periods, and remove them as needed.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div>
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <ListChecks className="text-blue-500" size={20} />
              Expense Tracking
            </p>
            <p className="ml-7">Add, edit, or delete expenses for each period.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div>
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <CheckCircle2 className="text-blue-500" size={20} />
              Correction Modal
            </p>
            <p className="ml-7">If planned and actual expenses don't match, use the correction modal to resolve mismatches.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <CheckCircle2 className="text-green-500" size={20} />
              Save/Delete</p>
              <p className="ml-7">Save your changes or delete budgets using the buttons at the top.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div>
            <p className="text-lg font-semibold flex items-center gap-2 mb-2">
              <LogOut className="text-blue-500" size={20} />
              Logout
            </p>
            <p className="ml-7">Use the sidebar to log out at any time.</p>
          </div>
          <div className="border-t border-gray-200" />
          <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3 mt-2">
            <Lightbulb className="text-yellow-400 mt-1" size={28} />
            <div>
              <div className="font-semibold text-blue-900 mb-1">Tips</div>
              <div className="text-blue-900 space-y-1">
                <div>All changes are local until you click <span className="font-semibold">Save</span>.</div>
                <div>Hover over icons and buttons for tooltips and more info.</div>
                <div>Use the <span className="font-semibold">+ Add budget</span> button to start a new budget.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal; 