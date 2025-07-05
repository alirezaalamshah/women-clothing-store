// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth to use authenticatedFetch

// Base URL for your Django backend API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create the Cart Context
export const CartContext = createContext();

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null); // Stores cart data (items, total_price, etc.)
  const [cartLoading, setCartLoading] = useState(true); // To indicate if cart state is being loaded
  const [cartError, setCartError] = useState(null); // Stores any error during cart operations

  const { isAuthenticated, authenticatedFetch, isLoading: authLoading } = useAuth(); // Get auth state and authenticated fetch

  // Use a ref to track if the initial cart fetch has occurred
  const hasFetchedCartRef = useRef(false);

  // Function to fetch cart data from the backend
  // Memoized using useCallback to prevent infinite loops
  const fetchCart = useCallback(async () => {
    setCartLoading(true);
    setCartError(null);
    try {
      // Check if authenticatedFetch is available before calling it
      if (!authenticatedFetch) {
        console.warn("authenticatedFetch is not yet available in CartContext.");
        setCartLoading(false); // Stop loading if auth is not ready
        return;
      }

      // Cart should work for guests, so requiresAuth is false initially for GET requests.
      // The backend CartViewSet handles session for guests.
      // If isAuthenticated is true, we pass true to ensure token is used.
      const requiresAuthForCartGet = isAuthenticated; // Only send token if authenticated
      
      const response = await authenticatedFetch(`${API_BASE_URL}/cart/`, {}, requiresAuthForCartGet);
      const data = await response.json();

      if (response.ok) {
        setCart(data);
      } else {
        // Handle specific error for empty cart or not found (e.g., 404)
        if (response.status === 404 && data.detail === "سبد خرید یافت نشد.") {
            setCart({ items: [] }); // Set an empty cart object
        } else {
            console.error('Failed to fetch cart:', data);
            setCartError(data.detail || 'خطا در بارگذاری سبد خرید.');
            setCart(null); // Clear cart on error
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartError('خطای شبکه یا سرور در دسترس نیست.');
      setCart(null); // Clear cart on network error
    } finally {
      setCartLoading(false);
    }
  }, [authenticatedFetch, isAuthenticated]); // Dependency on authenticatedFetch and isAuthenticated

  // Effect to load cart data when authentication state settles or changes
  useEffect(() => {
    // Only fetch if auth is ready and we haven't fetched yet or cart is null (due to error/clear)
    if (!authLoading && !hasFetchedCartRef.current) {
      fetchCart();
      hasFetchedCartRef.current = true; // Mark as fetched
    } else if (!authLoading && hasFetchedCartRef.current && cart === null) {
        // This handles cases where cart might have been cleared or set to null
        // due to an error, and we want to re-fetch if auth is stable.
        fetchCart();
    }
  }, [authLoading, fetchCart, cart]); // isAuthenticated is implicitly handled by fetchCart's dependency

  // Function to add an item to the cart
  const addItemToCart = useCallback(async (productVariantId, quantity = 1) => {
    setCartLoading(true);
    setCartError(null);
    try {
      // All cart modification operations (POST, PUT, DELETE) should always attempt to send a token
      // if available, or rely on session for guests. So, requiresAuth should be true.
      const response = await authenticatedFetch(`${API_BASE_URL}/cart/add-item/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_variant_id: productVariantId, quantity }),
      }, true); // Always attempt authentication/session for modifications

      const data = await response.json();

      if (response.ok) {
        setCart(data);
        return { success: true };
      } else {
        console.error('Failed to add item to cart:', data);
        setCartError(data.detail || 'خطا در افزودن کالا به سبد خرید.');
        return { success: false, error: data.detail || 'خطا در افزودن کالا به سبد خرید.' };
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      setCartError('خطای شبکه یا سرور در دسترس نیست.');
      return { success: false, error: 'خطای شبکه یا سرور در دسترس نیست.' };
    } finally {
      setCartLoading(false);
    }
  }, [authenticatedFetch, setCart]);

  // Function to update an item in the cart
  const updateCartItem = useCallback(async (cartItemId, quantity) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/cart/update-item/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_item_id: cartItemId, quantity }),
      }, true); // Always attempt authentication/session

      const data = await response.json();

      if (response.ok) {
        setCart(data);
        return { success: true };
      } else {
        console.error('Failed to update cart item:', data);
        setCartError(data.detail || 'خطا در بروزرسانی کالا در سبد خرید.');
        return { success: false, error: data.detail || 'خطا در بروزرسانی کالا در سبد خرید.' };
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      setCartError('خطای شبکه یا سرور در دسترس نیست.');
      return { success: false, error: 'خطای شبکه یا سرور در دسترس نیست.' };
    } finally {
      setCartLoading(false);
    }
  }, [authenticatedFetch, setCart]);

  // Function to remove an item from the cart
  const removeItemFromCart = useCallback(async (cartItemId) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/cart/remove-item/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_item_id: cartItemId }),
      }, true); // Always attempt authentication/session

      const data = await response.json();

      if (response.ok) {
        setCart(data);
        return { success: true };
      } else {
        console.error('Failed to remove item from cart:', data);
        setCartError(data.detail || 'خطا در حذف کالا از سبد خرید.');
        return { success: false, error: data.detail || 'خطا در حذف کالا از سبد خرید.' };
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      setCartError('خطای شبکه یا سرور در دسترس نیست.');
      return { success: false, error: 'خطای شبکه یا سرور در دسترس نیست.' };
    } finally {
      setCartLoading(false);
    }
  }, [authenticatedFetch, setCart]);

  // Function to clear the entire cart
  const clearCart = useCallback(async () => {
    setCartLoading(true);
    setCartError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/cart/clear-cart/`, {
        method: 'POST', // Using POST for action
        headers: { 'Content-Type': 'application/json' },
      }, true); // Always attempt authentication/session

      const data = await response.json();

      if (response.ok) {
        setCart(data);
        return { success: true };
      } else {
        console.error('Failed to clear cart:', data);
        setCartError(data.detail || 'خطا در خالی کردن سبد خرید.');
        return { success: false, error: data.detail || 'خطا در خالی کردن سبد خرید.' };
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setCartError('خطای شبکه یا سرور در دسترس نیست.');
      return { success: false, error: 'خطای شبکه یا سرور در دسترس نیست.' };
    } finally {
      setCartLoading(false);
    }
  }, [authenticatedFetch, setCart]);

  // Function to apply a coupon code (only for validation/preview, actual application is during order)
  const applyCoupon = useCallback(async (couponCode) => {
    setCartLoading(true); // Indicate loading for coupon application
    setCartError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/cart/apply-coupon/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: couponCode }),
      }, true); // This operation requires auth/session

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data };
      } else {
        console.error('Failed to apply coupon:', data);
        setCartError(data.detail || 'خطا در اعمال کوپن.');
        return { success: false, error: data.detail || 'خطا در اعمال کوپن.' };
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCartError('خطای شبکه یا سرور در دسترس نیست.');
      return { success: false, error: 'خطای شبکه یا سرور در دسترس نیست.' };
    } finally {
      setCartLoading(false);
    }
  }, [authenticatedFetch]);


  const cartContextValue = {
    cart,
    cartLoading,
    cartError,
    fetchCart,
    addItemToCart,
    updateCartItem, // Renamed from updateCartItemQuantity
    removeItemFromCart, // Renamed from removeCartItem
    clearCart,
    applyCoupon,
    cartItemCount: cart?.total_items || 0, // Convenience for header display
    cartTotalPrice: cart?.total_price || 0, // Convenience for display
  };

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use Cart Context
export const useCart = () => {
  return useContext(CartContext);
};
