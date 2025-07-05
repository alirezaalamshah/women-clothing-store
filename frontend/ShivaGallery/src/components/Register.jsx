// src/components/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

const Register = ({ setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { register, isLoading } = useAuth(); // Get register function and loading state from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const userData = {
      username,
      email,
      password,
      password2,
      first_name: firstName,
      last_name: lastName,
    };

    const result = await register(userData);

    if (result.success) {
      setSuccessMessage('ثبت نام شما با موفقیت انجام شد! می‌توانید وارد شوید.');
      // Optionally, redirect to login page after successful registration
      setTimeout(() => {
        setCurrentPage('login');
      }, 2000);
    } else {
      // Handle backend validation errors
      const errors = result.error;
      let errorMessage = 'خطا در ثبت نام. لطفا اطلاعات را بررسی کنید.';
      if (errors) {
        errorMessage = Object.entries(errors)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md border border-gold-700">
        <h2 className="text-3xl font-bold text-center text-gold-500 mb-6">ثبت نام</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-username" className="block text-gold-400 text-sm font-bold mb-2">
              نام کاربری:
            </label>
            <input
              type="text"
              id="reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-gold-400 text-sm font-bold mb-2">
              ایمیل:
            </label>
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-gold-400 text-sm font-bold mb-2">
              رمز عبور:
            </label>
            <input
              type="password"
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-password2" className="block text-gold-400 text-sm font-bold mb-2">
              تکرار رمز عبور:
            </label>
            <input
              type="password"
              id="reg-password2"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-firstname" className="block text-gold-400 text-sm font-bold mb-2">
              نام:
            </label>
            <input
              type="text"
              id="reg-firstname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label htmlFor="reg-lastname" className="block text-gold-400 text-sm font-bold mb-2">
              نام خانوادگی:
            </label>
            <input
              type="text"
              id="reg-lastname"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
          <button
            type="submit"
            className="w-full bg-gold-600 text-black font-semibold py-3 rounded-lg shadow-lg hover:bg-gold-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'در حال ثبت نام...' : 'ثبت نام'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gold-400">
          قبلاً حساب کاربری دارید؟{' '}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }}
            className="text-gold-500 hover:underline"
          >
            وارد شوید
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
