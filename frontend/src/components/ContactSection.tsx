import { useState } from 'react';
import EmailForm from './EmailForm';

const ContactSection = () => {
  const [showEmailForm, setShowEmailForm] = useState(false);

  return (
    <section className="relative mt-4 w-full" id="kontakt">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500  font-inter font-medium mb-4">
            If you have more questions or suggestions what to improve, feel free to reach out on <a href="mailto:pawel@easybudget.cloud" className="text-blue-500">pawel@easybudget.cloud</a>
          </p>

          <div className="max-w-md mx-auto">
            <button
              onClick={() => setShowEmailForm(true)}
              className="px-4 py-2 rounded font-semibold shadow transition-colors bg-blue-500 hover:bg-blue-700 text-white"
            >
              Sign Up for waiting list
            </button>
          </div>
        </div>

        {showEmailForm && <EmailForm onClose={() => setShowEmailForm(false)} />}
      </div>
    </section>
  );
};

export default ContactSection;