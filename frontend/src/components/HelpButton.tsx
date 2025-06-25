import { CircleQuestionMark } from "lucide-react";
import React from "react";

interface HelpButtonProps {
  onClick: () => void;
}

const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => (
  <button
    className="fixed top-4 right-4 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 focus:outline-none"
    onClick={onClick}
    title="Help / Manual"
    aria-label="Open help manual"
  >
    <CircleQuestionMark size={16} />
  </button>
);

export default HelpButton;