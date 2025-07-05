// src/components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons

const Login = ({ setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { login, isLoading } = useAuth(); // Get login function and loading state from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const result = await login(username, password);

    if (result.success) {
      setSuccessMessage('با موفقیت وارد شدید! در حال انتقال به صفحه اصلی...');
      setTimeout(() => {
        setCurrentPage('home'); // Redirect to home page after successful login
      }, 1500);
    } else {
      setError(result.error?.detail || 'خطا در ورود. لطفا نام کاربری و رمز عبور را بررسی کنید.');
      if (result.error?.detail === "No active account found with the given credentials") {
        setError("نام کاربری یا رمز عبور اشتباه است.");
      } else if (result.error?.detail && typeof result.error.detail === 'string' && result.error.detail.includes("No active account found")) {
        setError("نام کاربری یا رمز عبور اشتباه است.");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md border border-gold-700">
        <h2 className="text-3xl font-bold text-center text-gold-500 mb-6">ورود</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gold-400 text-sm font-bold mb-2">
              نام کاربری:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gold-400 text-sm font-bold mb-2">
              رمز عبور:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Changed padding: pl-4 for LTR, pr-10 for RTL (icon on left)
                className="shadow appearance-none border border-gold-700 rounded-lg w-full py-3 px-4 bg-gray-800 text-gold-200 leading-tight focus:outline-none focus:ring-2 focus:ring-gold-500 pr-10 rtl:pl-10 rtl:pr-4"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                // Changed positioning: left-0 for LTR (icon on left), left-0 for RTL (icon on left)
                className="absolute inset-y-0 left-0 rtl:left-0 rtl:left-auto flex items-center pr-3 rtl:pl-3 rtl:pr-0 text-gold-400 hover:text-gold-500 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
          <button
            type="submit"
            className="w-full bg-gold-600 text-black font-semibold py-3 rounded-lg shadow-lg hover:bg-gold-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gold-400">
          حساب کاربری ندارید؟{' '}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setCurrentPage('register'); }}
            className="text-gold-500 hover:underline"
          >
            ثبت نام کنید
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
