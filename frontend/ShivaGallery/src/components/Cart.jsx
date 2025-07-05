// src/components/Cart.jsx
import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Trash2 } from 'lucide-react'; // Import icons

const Cart = ({ setCurrentPage, showModal }) => { // Receive showModal prop
  // Renamed functions from CartContext for consistency
  const { cart, fetchCart, updateCartItem, removeItemFromCart, cartLoading, cartError } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Fetch cart only if auth is ready (authLoading is false)
    if (!authLoading) {
      fetchCart();
    }
  }, [authLoading, fetchCart]);

  const handleUpdateQuantity = async (itemId, currentQuantity, newQuantity) => {
    if (newQuantity > 0) {
      const result = await updateCartItem(itemId, newQuantity); // Use updated function name
      if (!result.success) {
        showModal({
          title: 'خطا در بروزرسانی',
          message: result.error || 'مشکلی در بروزرسانی تعداد محصول در سبد خرید رخ داد.',
          showCancel: false,
          confirmText: 'باشه'
        });
      }
    } else if (newQuantity === 0) {
      showModal({
        title: 'حذف محصول',
        message: 'آیا مطمئنید می‌خواهید این محصول را از سبد خرید حذف کنید؟',
        onConfirm: async () => {
          const result = await removeItemFromCart(itemId); // Use updated function name
          if (!result.success) {
            showModal({
              title: 'خطا در حذف',
              message: result.error || 'مشکلی در حذف محصول از سبد خرید رخ داد.',
              showCancel: false,
              confirmText: 'باشه'
            });
          }
        },
        showCancel: true,
        confirmText: 'بله، حذف کن',
        cancelText: 'خیر'
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    showModal({
      title: 'حذف محصول',
      message: 'آیا مطمئنید می‌خواهید این محصول را از سبد خرید حذف کنید؟',
      onConfirm: async () => {
        const result = await removeItemFromCart(itemId); // Use updated function name
        if (!result.success) {
          showModal({
            title: 'خطا در حذف',
            message: result.error || 'مشکلی در حذف محصول از سبد خرید رخ داد.',
            showCancel: false,
            confirmText: 'باشه'
          });
        }
      },
      showCancel: true,
      confirmText: 'بله، حذف کن',
      cancelText: 'خیر'
    });
  };

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center flex-grow bg-black text-gold-400 p-4 text-xl">
        در حال بارگذاری سبد خرید...
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow bg-black text-red-500 p-4 text-xl">
        <p>خطا در بارگذاری سبد خرید: {cartError}</p>
        <button
          onClick={fetchCart}
          className="mt-4 px-6 py-3 bg-gold-600 text-black font-semibold rounded-lg shadow-md hover:bg-gold-700 transition duration-300"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  // Adjusted logic for empty cart message based on isAuthenticated
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
        <h1 className="text-4xl font-bold mb-4 text-gold-500">سبد خرید شما خالی است.</h1>
        <p className="text-lg text-center mb-8">
          برای ادامه خرید، محصولات مورد علاقه خود را به سبد خرید اضافه کنید.
        </p>
        <button
          onClick={() => setCurrentPage('products')}
          className="px-8 py-4 bg-gold-600 text-black font-semibold rounded-lg shadow-lg hover:bg-gold-700 transition duration-300 transform hover:scale-105"
        >
          مشاهده محصولات
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex-grow bg-black text-gold-400 font-vazirmatn">
      <h1 className="text-4xl font-bold text-gold-500 mb-8 text-center">سبد خرید شما</h1>

      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gold-700 p-6">
        {cart.items.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row items-center border-b border-gold-800 py-4 last:border-b-0">
            <img
              src={item.product_variant?.product?.main_image_url || "https://placehold.co/100x100/1a1a1a/FBBE24?text=No+Image"}
              alt={item.product_variant?.product?.name}
              className="w-24 h-24 object-cover rounded-lg mr-4 mb-4 sm:mb-0"
            />
            <div className="flex-grow text-center sm:text-right">
              <h3 className="text-xl font-semibold text-gold-200">{item.product_variant?.product?.name}</h3>
              <p className="text-sm text-gray-400">
                رنگ: {item.product_variant?.color} | سایز: {item.product_variant?.size_name}
              </p>
              <p className="text-lg font-bold text-gold-500 mt-2">
                {parseInt(item.total_price).toLocaleString('fa-IR')} تومان
              </p>
            </div>
            <div className="flex items-center mt-4 sm:mt-0 sm:ml-4">
              <button
                onClick={() => handleUpdateQuantity(item.id, item.quantity, item.quantity - 1)}
                className="p-2 bg-gray-800 text-gold-400 rounded-full hover:bg-gray-700 transition duration-300"
                disabled={item.quantity <= 1}
              >
                <Minus size={20} />
              </button>
              <span className="text-xl font-bold text-gold-200 w-12 text-center">{item.quantity}</span>
              <button
                onClick={() => handleUpdateQuantity(item.id, item.quantity, item.quantity + 1)}
                className="p-2 bg-gray-800 text-gold-400 rounded-full hover:bg-gray-700 transition duration-300"
                disabled={item.quantity >= item.product_variant?.online_stock}
              >
                <Plus size={20} />
              </button>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition duration-300 ml-4"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gold-800">
          <p className="text-xl font-bold text-gold-500">جمع کل:</p>
          <p className="text-2xl font-bold text-gold-200">
            {cart && parseInt(cart.total_price).toLocaleString('fa-IR')} تومان
          </p>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setCurrentPage('checkout')}
            className="w-full py-3 bg-gold-600 text-black font-semibold rounded-lg shadow-lg hover:bg-gold-700 transition duration-300 transform hover:scale-105"
          >
            ادامه و ثبت سفارش
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => setCurrentPage('products')}
          className="px-8 py-4 bg-gray-800 text-gold-400 font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300"
        >
          بازگشت به محصولات
        </button>
      </div>
    </div>
  );
};

export default Cart;
