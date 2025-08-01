import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import ErrorAlert from './ErrorAlert';
import NotificationAlert from './NotificationAlert';

// API configuration
const API_URL = import.meta.env.PROD
  ? 'https://27tteku3o4.execute-api.eu-north-1.amazonaws.com/Prod/'
  : '/api/signup'; // This will be our mock endpoint

const EmailForm = ({ onClose }: { onClose: () => void }) => {
  const [emailAddress, setEmailAddress] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !(modalRef.current as HTMLDivElement).contains(e.target as Node)) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(emailAddress)) {
      setAlertMessage('Set valid email address.');
      setShowAlert(true);
      return;
    }

    if (!acceptPolicy) {
      setAlertMessage('Set privacy policy acceptance.');
      setShowAlert(true);
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('Development mode - mocking API call with:', emailAddress);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setShowInfo(true);
        setEmailAddress('');
        // Move success handling here:
        sessionStorage.setItem('emailSubmitted', 'true');
        setTimeout(() => {
          handleClose();
        }, 2000);
        return;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ email: emailAddress })
      });

      if (response.ok) {
        setShowInfo(true);
        setEmailAddress('');
        // Handle submission success directly in the component
        sessionStorage.setItem('emailSubmitted', 'true');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setAlertMessage('Something went wrong.');
        setShowAlert(true);
      }
    } catch (error) {
      console.error(error);
      setAlertMessage('Unexpected error occurred.');
      setShowAlert(true);
    }
  };

  return (
    <>
      {showAlert && createPortal(
        <ErrorAlert
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />,
        document.getElementById('notification-root')!
      )}
      {showInfo && createPortal(
        <NotificationAlert
          message="Thank you for your interest! We will contact you soon."
          onClose={() => setShowInfo(false)}
        />,
        document.getElementById('notification-root')!
      )}
      <div
        className={`fixed inset-0 transition-opacity duration-200 ease-in-out flex items-center justify-center z-40 backdrop-blur-md ${isClosing ? 'bg-opacity-0' : ' bg-white/10'
          }`}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          ref={modalRef}
          className={`bg-white p-8 rounded-lg border-[#4730E3] max-w-md w-full mx-4 relative transform transition-all duration-200 border ease-in-out ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200"
            aria-label="Close"
          >
            ✕
          </button>

          <div id="modal-title" className="text-pretty mb-4 font-inter">
            <p className='mb-2'>Do you want to know more about our product? Do you have any questions?</p>
            <p>Leave your email, and we will contact you!</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                ref={inputRef}
                type="email"
                id="email"
                name="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your email address"
                required
              />
            </div>

            <div className="flex items-start mt-4">
              <input
                id="privacy"
                type="checkbox"
                checked={acceptPolicy}
                onChange={(e) => setAcceptPolicy(e.target.checked)}
                className="w-4 h-4 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">
                I accept{' '}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  the privacy policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={!acceptPolicy}
              className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${acceptPolicy
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                } mt-4`}
            >
              Sign Up for waiting list
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default EmailForm;