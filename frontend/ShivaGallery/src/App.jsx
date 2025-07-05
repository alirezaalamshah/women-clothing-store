// App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import Cart from './components/Cart';
import Products from './components/Products';
import ProductDetail from './components/ProductDetail';
import Modal from './components/Modal'; // Import the new Modal component
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

// Main App component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);

  // State for managing the custom modal
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: true,
    confirmText: 'تایید',
    cancelText: 'لغو',
  });

  // Function to show the modal
  const showModal = ({ title, message, onConfirm, showCancel = true, confirmText = 'تایید', cancelText = 'لغو' }) => {
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        hideModal(); // Hide modal after confirmation
      },
      showCancel,
      confirmText,
      cancelText,
    });
  };

  // Function to hide the modal
  const hideModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const navigateTo = (page, slug = null) => {
    setCurrentPage(page);
    setSelectedProductSlug(slug);
  };

  return (
    <AuthProvider>
      {/* Pass showModal and hideModal to CartProvider and other relevant providers if needed */}
      <CartProvider>
        <AppContent
          currentPage={currentPage}
          setCurrentPage={navigateTo}
          selectedProductSlug={selectedProductSlug}
          showModal={showModal} // Pass showModal to AppContent
          hideModal={hideModal} // Pass hideModal to AppContent
        />
        <Modal {...modal} onClose={hideModal} /> {/* Render the Modal component */}
      </CartProvider>
    </AuthProvider>
  );
};

// Separate component to handle loading states and render pages
const AppContent = ({ currentPage, setCurrentPage, selectedProductSlug, showModal, hideModal }) => {
  const { isLoading: authLoading } = useAuth();
  const { cartLoading } = useCart();

  if (authLoading || cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-gold-400 font-vazirmatn text-2xl">
        در حال بارگذاری...
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
            <h1 className="text-5xl font-bold mb-6 text-gold-500">به گالری شیوا خوش آمدید!</h1>
            <p className="text-xl text-center mb-8">
              اینجا می‌توانید بهترین لباس‌ها را با تم مشکی و طلایی پیدا کنید.
            </p>
            <button
              onClick={() => setCurrentPage('products')}
              className="px-8 py-4 bg-gold-600 text-black font-semibold rounded-lg shadow-lg hover:bg-gold-700 transition duration-300 transform hover:scale-105"
            >
              مشاهده محصولات
            </button>
          </div>
        );
      case 'products':
        return <Products setCurrentPage={setCurrentPage} />;
      case 'product-detail':
        return <ProductDetail productSlug={selectedProductSlug} setCurrentPage={setCurrentPage} showModal={showModal} />; // Pass showModal
      case 'cart':
        return <Cart setCurrentPage={setCurrentPage} showModal={showModal} />; // Pass showModal
      case 'login':
        return <Login setCurrentPage={setCurrentPage} />;
      case 'register':
        return <Register setCurrentPage={setCurrentPage} />;
      case 'about':
        return (
          <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
            <h1 className="text-4xl font-bold mb-4 text-gold-500">درباره ما</h1>
            <p className="text-lg text-center mb-8">
              اطلاعاتی درباره گالری شیوا.
            </p>
            <button
              onClick={() => setCurrentPage('home')}
              className="px-6 py-3 bg-gray-800 text-gold-400 font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        );
      case 'contact':
        return (
          <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
            <h1 className="text-4xl font-bold mb-4 text-gold-500">تماس با ما</h1>
            <p className="text-lg text-center mb-8">
              راه‌های ارتباطی با ما.
            </p>
            <button
              onClick={() => setCurrentPage('home')}
              className="px-6 py-3 bg-gray-800 text-gold-400 font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        );
      case 'checkout':
        return (
          <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
            <h1 className="text-4xl font-bold mb-4 text-gold-500">صفحه ثبت سفارش</h1>
            <p className="text-lg text-center mb-8">
              اینجا می‌توانید اطلاعات سفارش و آدرس را نهایی کنید.
            </p>
            <button
              onClick={() => setCurrentPage('cart')}
              className="px-6 py-3 bg-gray-800 text-gold-400 font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300"
            >
              بازگشت به سبد خرید
            </button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
            <h1 className="text-4xl font-bold text-red-500">صفحه یافت نشد!</h1>
            <button
              onClick={() => setCurrentPage('home')}
              className="px-6 py-3 bg-gray-800 text-gold-400 font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300 mt-4"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        );
    }
  };

  return (
    <div className="font-vazirmatn min-h-screen flex flex-col">
      <Header setCurrentPage={setCurrentPage} />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
