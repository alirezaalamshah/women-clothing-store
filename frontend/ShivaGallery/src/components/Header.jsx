// src/components/Header.jsx
import React, { useState } from 'react';
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { useCart } from '../context/CartContext'; // Import useCart hook

const Header = ({ setCurrentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth(); // Use auth context
  const { cartItemCount } = useCart(); // Get cart item count from CartContext

  const navItems = [
    { name: 'صفحه اصلی', page: 'home' },
    { name: 'محصولات', page: 'products' },
    { name: 'درباره ما', page: 'about' },
    { name: 'تماس با ما', page: 'contact' },
  ];

  const handleLogout = () => {
    logout();
    setCurrentPage('home'); // Redirect to home after logout
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  return (
    <header className="bg-black text-gold-400 p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Site Title */}
        <div className="text-2xl font-bold text-gold-500 cursor-pointer" onClick={() => setCurrentPage('home')}>
          گالری شیوا
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 rtl:space-x-reverse items-center">
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => { e.preventDefault(); setCurrentPage(item.page); }}
              className="text-lg hover:text-gold-600 transition duration-300"
            >
              {item.name}
            </a>
          ))}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setCurrentPage('cart'); }}
            className="text-lg hover:text-gold-600 transition duration-300 flex items-center relative"
          >
            <ShoppingCart className="ml-2 rtl:mr-2 rtl:ml-0" size={20} />
            سبد خرید
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 rtl:-left-2 rtl:-right-auto bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </a>

          {isAuthenticated ? (
            <>
              <span className="text-lg flex items-center text-gold-500">
                <User size={20} className="ml-2 rtl:mr-2 rtl:ml-0" />
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-lg hover:text-gold-600 transition duration-300 flex items-center bg-transparent border-none cursor-pointer"
              >
                <LogOut size={20} className="ml-2 rtl:mr-2 rtl:ml-0" />
                خروج
              </button>
            </>
          ) : (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }}
              className="text-lg hover:text-gold-600 transition duration-300"
            >
              ورود / ثبت نام
            </a>
          )}
        </nav>

        {/* Mobile Menu Button and Cart Icon for Mobile */}
        <div className="md:hidden flex items-center space-x-4 rtl:space-x-reverse">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setCurrentPage('cart'); setIsMobileMenuOpen(false); }}
            className="text-gold-400 relative"
          >
            <ShoppingCart size={28} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 rtl:-left-2 rtl:-right-auto bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </a>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gold-400 focus:outline-none">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>


      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black mt-4 border-t border-gold-700 py-4">
          <nav className="flex flex-col items-center space-y-4">
            {navItems.map((item) => (
              <a
                key={item.name}
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage(item.page); setIsMobileMenuOpen(false); }}
                className="text-lg text-gold-400 hover:text-gold-600 transition duration-300 w-full text-center py-2"
              >
                {item.name}
              </a>
            ))}
            {/* Cart link in mobile menu is now handled by the icon outside */}
            {isAuthenticated ? (
              <>
                <span className="text-lg flex items-center text-gold-500 w-full text-center py-2 justify-center">
                  <User size={20} className="ml-2 rtl:mr-2 rtl:ml-0" />
                  {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-lg text-gold-400 hover:text-gold-600 transition duration-300 w-full text-center py-2 flex items-center justify-center bg-transparent border-none cursor-pointer"
                >
                  <LogOut size={20} className="ml-2 rtl:mr-2 rtl:ml-0" />
                  خروج
                </button>
              </>
            ) : (
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage('login'); setIsMobileMenuOpen(false); }}
                className="text-lg text-gold-400 hover:text-gold-600 transition duration-300 w-full text-center py-2"
              >
                ورود / ثبت نام
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
