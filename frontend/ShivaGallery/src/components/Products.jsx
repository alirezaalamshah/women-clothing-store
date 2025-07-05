// src/components/Products.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth to use authenticatedFetch
import { ShoppingCart } from 'lucide-react'; // Example icon

const Products = ({ setCurrentPage }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { authenticatedFetch, isLoading: authLoading } = useAuth(); // Get authenticatedFetch from AuthContext

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use authenticatedFetch, but set requiresAuth to false as products are public
      const response = await authenticatedFetch(`${API_BASE_URL}/products/`, {}, false);
      const data = await response.json();

      if (response.ok) {
        // CORRECTED: Access data.results for products due to pagination
        setProducts(data.results || []); 
      } else {
        console.error('Failed to fetch products:', data);
        setError(data.detail || 'خطا در بارگذاری محصولات.');
        setProducts([]); // Ensure products is an empty array on error
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'خطای شبکه یا سرور در دسترس نیست.');
      setProducts([]); // Ensure products is an empty array on network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch products when authLoading is false (meaning auth state has settled)
    if (!authLoading) {
      fetchProducts();
    }
  }, [authLoading]); // Dependency on authLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-grow bg-black text-gold-400 p-4 text-xl">
        در حال بارگذاری محصولات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow bg-black text-red-500 p-4 text-xl">
        <p>خطا: {error}</p>
        <button
          onClick={fetchProducts}
          className="mt-4 px-6 py-3 bg-gold-600 text-black font-semibold rounded-lg shadow-md hover:bg-gold-700 transition duration-300"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex-grow bg-black text-gold-400 font-vazirmatn">
      <h1 className="text-4xl font-bold text-gold-500 mb-8 text-center">محصولات ما</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gold-700 transform transition duration-300 hover:scale-105 cursor-pointer"
            onClick={() => setCurrentPage('product-detail', product.slug)} 
          >
            <img
              src={product.main_image_url || "https://placehold.co/400x300/1a1a1a/FBBE24?text=No+Image"}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gold-200 mb-2 truncate">{product.name}</h2>
              {product.category && (
                <p className="text-sm text-gray-400 mb-2">{product.category.name}</p>
              )}
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-bold text-gold-500">
                  {parseInt(product.min_price).toLocaleString('fa-IR')} تومان
                  {product.max_price && product.min_price !== product.max_price && (
                    <span className="text-sm text-gray-400"> - {parseInt(product.max_price).toLocaleString('fa-IR')}</span>
                  )}
                </p>
                {product.active_discount_percentage > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {product.active_discount_percentage}% تخفیف
                  </span>
                )}
              </div>
              <button
                className="mt-4 w-full bg-gold-600 text-black py-2 rounded-md font-semibold flex items-center justify-center hover:bg-gold-700 transition duration-300"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening product detail
                  // Add to cart logic here (if applicable from product list)
                  // For now, we only navigate to detail for adding to cart
                  setCurrentPage('product-detail', product.slug); // <-- CHANGE THIS LINE
                }}
              >
                <ShoppingCart size={18} className="ml-2 rtl:mr-2 rtl:ml-0" />
                مشاهده جزئیات
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
