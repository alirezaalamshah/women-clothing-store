// src/components/ProductDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Plus, Minus, Star } from 'lucide-react'; // Import icons

const ProductDetail = ({ productSlug, setCurrentPage, showModal }) => { // Receive showModal prop
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(null); // For main image display

  const { authenticatedFetch, isLoading: authLoading } = useAuth();
  const { addItemToCart, cartLoading: isAddingToCart } = useCart();

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  // Function to fetch product details based on slug
  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Product details are public, so requiresAuth is false
      const response = await authenticatedFetch(`${API_BASE_URL}/products/${productSlug}/`, {}, false);
      const data = await response.json();

      if (response.ok) {
        setProduct(data);
        setCurrentImage(data.main_image_url || "https://placehold.co/800x600/1a1a1a/FBBE24?text=No+Image");

        // Attempt to pre-select first color if available
        if (data.batches && data.batches.length > 0) {
          setSelectedColor(data.batches[0].color);
        }
      } else {
        console.error('Failed to fetch product details:', data);
        setError(data.detail || 'خطا در بارگذاری جزئیات محصول.');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('خطای شبکه یا سرور در دسترس نیست.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && productSlug) {
      fetchProductDetails();
    }
  }, [authLoading, productSlug, fetchProductDetails]); // Add fetchProductDetails to dependency array

  // Group variants by color for easier selection
  const variantsByColor = useMemo(() => {
    if (!product?.variants) return {};
    return product.variants.reduce((acc, variant) => {
      if (!acc[variant.color]) {
        acc[variant.color] = [];
      }
      acc[variant.color].push(variant);
      return acc;
    }, {});
  }, [product]);

  // Get available sizes for the selected color
  const availableSizesForColor = useMemo(() => {
    if (!selectedColor || !variantsByColor[selectedColor]) return [];
    // Filter out sizes with 0 online_stock
    return variantsByColor[selectedColor]
      .filter(variant => variant.online_stock > 0)
      .sort((a, b) => (a.size_order || 0) - (b.size_order || 0)); // Use size_order for sorting
  }, [selectedColor, variantsByColor]);

  // Find the currently selected product variant
  const selectedVariant = useMemo(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return null;
    return product.variants.find(
      (v) => v.color === selectedColor && v.size_id === selectedSize // Use size_id for comparison
    );
  }, [product, selectedColor, selectedSize]);

  // Update current image when color changes (if color_image exists for batch)
  useEffect(() => {
    if (product && selectedColor) {
      const batch = product.batches.find(b => b.color === selectedColor);
      if (batch && batch.color_image_url) {
        setCurrentImage(batch.color_image_url);
      } else {
        setCurrentImage(product.main_image_url || "https://placehold.co/800x600/1a1a1a/FBBE24?text=No+Image");
      }
    }
  }, [selectedColor, product]);


  // Reset selected size and quantity when color changes
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
  }, [selectedColor]);

  // Reset quantity if selected variant's stock is less than current quantity
  useEffect(() => {
    if (selectedVariant && quantity > selectedVariant.online_stock) {
      setQuantity(selectedVariant.online_stock > 0 ? 1 : 0);
    }
  }, [selectedVariant, quantity]);


  const handleAddToCart = async () => {
    if (!selectedVariant) {
      showModal({
        title: 'خطا',
        message: 'لطفاً رنگ و سایز محصول را انتخاب کنید.',
        showCancel: false,
        confirmText: 'باشه'
      });
      return;
    }
    if (quantity <= 0 || quantity > selectedVariant.online_stock) {
      showModal({
        title: 'خطا',
        message: 'تعداد انتخابی نامعتبر است یا موجودی کافی نیست.',
        showCancel: false,
        confirmText: 'باشه'
      });
      return;
    }

    const result = await addItemToCart(selectedVariant.id, quantity);
    if (result.success) {
      showModal({
        title: 'موفقیت',
        message: 'محصول با موفقیت به سبد خرید اضافه شد!',
        showCancel: false,
        confirmText: 'باشه'
      });
    } else {
      showModal({
        title: 'خطا',
        message: `خطا در افزودن محصول به سبد خرید: ${result.error}`,
        showCancel: false,
        confirmText: 'باشه'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-grow bg-black text-gold-400 p-4 text-xl">
        در حال بارگذاری جزئیات محصول...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow bg-black text-red-500 p-4 text-xl">
        <p>خطا: {error}</p>
        <button
          onClick={fetchProductDetails}
          className="mt-4 px-6 py-3 bg-gold-600 text-black font-semibold rounded-lg shadow-md hover:bg-gold-700 transition duration-300"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow bg-black text-gold-400 p-4">
        <h1 className="text-4xl font-bold mb-4 text-gold-500">محصول یافت نشد.</h1>
        <button
          onClick={() => setCurrentPage('products')}
          className="px-6 py-3 bg-gold-600 text-black font-semibold rounded-lg shadow-md hover:bg-gold-700 transition duration-300"
        >
          بازگشت به محصولات
        </button>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = product.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
    : 'بدون امتیاز';

  // Get the selected size name for display - Use size_name directly
  const selectedSizeName = selectedSize
    ? availableSizesForColor.find(s => s.size_id === selectedSize)?.size_name
    : 'انتخاب کنید';


  return (
    <div className="container mx-auto p-4 flex-grow bg-black text-gold-400 font-vazirmatn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image and Gallery (if any) */}
        <div className="flex flex-col items-center">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full max-w-lg h-auto object-cover rounded-lg shadow-lg border border-gold-700"
          />
          {/* You can add a small image gallery here if product has multiple images per color */}
          {/* For now, we only switch main_image or color_image */}
        </div>

        {/* Product Details and Options */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-gold-500 mb-4">{product.name}</h1>
          {product.category && (
            <p className="text-lg text-gold-400 mb-2">دسته بندی: {product.category.name}</p>
          )}

          {/* Rating Display */}
          <div className="flex items-center mb-4">
            <span className="text-xl font-bold text-gold-500 ml-2 rtl:mr-2">{averageRating}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.floor(averageRating) ? '#F59E0B' : 'none'}
                  stroke={i < Math.floor(averageRating) ? '#F59E0B' : '#FBBE24'}
                  className="ml-1 rtl:mr-1"
                />
              ))}
            </div>
            <span className="text-sm text-gray-400 mr-2 rtl:ml-2">
              ({product.reviews ? product.reviews.length : 0} نظر)
            </span>
          </div>

          <p className="text-base text-gray-300 leading-relaxed mb-6">{product.description}</p>

          {/* Color Selection */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gold-500 mb-3">رنگ: {selectedColor || 'انتخاب کنید'}</h3>
            <div className="flex flex-wrap gap-3">
              {Object.keys(variantsByColor).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg border-2 transition duration-300
                    ${selectedColor === color
                      ? 'border-gold-500 bg-gold-600 text-black font-bold'
                      : 'border-gold-700 bg-gray-800 text-gold-400 hover:bg-gray-700'
                    }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          {selectedColor && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gold-500 mb-3">سایز: {selectedSizeName}</h3>
              <div className="flex flex-wrap gap-3">
                {availableSizesForColor.length > 0 ? (
                  availableSizesForColor.map((variant) => (
                    <button
                      key={variant.size_id} // Use size_id as key
                      onClick={() => setSelectedSize(variant.size_id)} // Set selectedSize to size_id
                      className={`px-4 py-2 rounded-lg border-2 transition duration-300
                        ${selectedSize === variant.size_id // Compare with size_id
                          ? 'border-gold-500 bg-gold-600 text-black font-bold'
                          : 'border-gold-700 bg-gray-800 text-gold-400 hover:bg-gray-700'
                        }
                        ${variant.online_stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      disabled={variant.online_stock === 0}
                    >
                      {variant.size_name} ({variant.online_stock} موجود) {/* Use size_name directly */}
                    </button>
                  ))
                ) : (
                  <p className="text-red-500">هیچ سایزی برای این رنگ موجود نیست.</p>
                )}
              </div>
            </div>
          )}

          {/* Price Display */}
          {selectedVariant && (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gold-500">
                قیمت: {parseInt(selectedVariant.discounted_price).toLocaleString('fa-IR')} تومان
                {product.active_discount_percentage > 0 && (
                  <span className="text-red-500 text-base mr-2 rtl:ml-2">
                    ({product.active_discount_percentage}% تخفیف)
                  </span>
                )}
              </h3>
              {selectedVariant.online_stock === 0 && (
                <p className="text-red-500 text-sm mt-1">این واریانت در حال حاضر ناموجود است.</p>
              )}
              {selectedVariant.online_stock > 0 && selectedVariant.online_stock < 5 && (
                <p className="text-orange-400 text-sm mt-1">فقط {selectedVariant.online_stock} عدد باقی مانده!</p>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          {selectedVariant && selectedVariant.online_stock > 0 && (
            <div className="flex items-center mb-6">
              <h3 className="text-xl font-semibold text-gold-500 ml-4 rtl:mr-4">تعداد:</h3>
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="p-2 bg-gray-800 text-gold-400 rounded-full hover:bg-gray-700 transition duration-300"
                disabled={quantity <= 1}
              >
                <Minus size={20} />
              </button>
              <span className="text-xl font-bold text-gold-200 w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => Math.min(prev + 1, selectedVariant.online_stock))}
                className="p-2 bg-gray-800 text-gold-400 rounded-full hover:bg-gray-700 transition duration-300"
                disabled={quantity >= selectedVariant.online_stock}
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full py-3 bg-gold-600 text-black font-semibold rounded-lg shadow-lg hover:bg-gold-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={!selectedVariant || quantity <= 0 || quantity > selectedVariant.online_stock || isAddingToCart}
          >
            {isAddingToCart ? (
                <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 ml-2 rtl:mr-2 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال افزودن...
                </span>
            ) : (
                <>
                    <ShoppingCart size={20} className="ml-2 rtl:mr-2 rtl:ml-0" />
                    افزودن به سبد خرید
                </>
            )}
          </button>
        </div>
      </div>

      {/* Product Reviews Section */}
      <div className="mt-12 bg-gray-900 p-6 rounded-lg shadow-lg border border-gold-700">
        <h2 className="text-3xl font-bold text-gold-500 mb-6 text-center">نظرات کاربران</h2>
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="border-b border-gold-800 pb-4 last:border-b-0">
                <div className="flex items-center mb-2">
                  <span className="font-semibold text-gold-200 ml-2 rtl:mr-2">{review.user_name}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < review.rating ? '#F59E0B' : 'none'}
                        stroke={i < review.rating ? '#F59E0B' : '#FBBE24'}
                        className="ml-1 rtl:mr-1"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400 mr-2 rtl:ml-2">
                    {new Date(review.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-gray-300 text-base">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">هنوز نظری برای این محصول ثبت نشده است.</p>
        )}
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

export default ProductDetail;
