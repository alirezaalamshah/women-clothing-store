// src/components/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, setCurrentPage }) => {
  // Function to navigate to product detail page
  const handleViewDetails = () => {
    setCurrentPage('product-detail', product.slug); // Pass slug to identify the product
  };

  // Determine the price to display: only the minimum price
  const displayPrice = product.min_price !== null
    ? `${parseInt(product.min_price).toLocaleString('fa-IR')} تومان`
    : 'نامشخص'; // Fallback if no price is available

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gold-700 flex flex-col h-full">
      <img
        src={product.main_image_url || "https://placehold.co/400x300/1a1a1a/FBBE24?text=No+Image"}
        alt={product.name}
        className="w-full h-48 object-cover object-center border-b border-gold-800"
      />
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gold-200 mb-2">{product.name}</h3>
          {product.category && (
            <p className="text-sm text-gold-400 mb-2">{product.category.name}</p>
          )}
          {product.description && (
            <p className="text-sm text-gray-400 line-clamp-3 mb-3">{product.description}</p>
          )}
        </div>
        <div className="mt-auto"> {/* Push price and button to bottom */}
          <p className="text-lg font-bold text-gold-500 mb-3">
            {displayPrice}
            {product.active_discount_percentage > 0 && (
              <span className="text-red-500 text-sm mr-2 rtl:ml-2">
                ({product.active_discount_percentage}% تخفیف)
              </span>
            )}
          </p>

          <button
            onClick={handleViewDetails}
            className="w-full py-2 bg-gold-600 text-black font-semibold rounded-lg shadow-lg hover:bg-gold-700 transition duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            مشاهده جزئیات
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
