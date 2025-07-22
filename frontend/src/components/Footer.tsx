import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <span className="inline-flex items-center gap-2">
      <Link 
        to="/privacy-policy" 
        className="text-blue-500 hover:text-blue-700 hover:underline"
        target='_blank'
      >
        Privacy Policy
      </Link>
      <span className="text-gray-500">and</span>
      <Link 
        to="/terms-of-service" 
        className="text-blue-500 hover:text-blue-700 hover:underline"
        target='_blank'
      >
        Terms of Service
      </Link>
    </span>
  );
}
