import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import '../styles/ProductList.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [timers, setTimers] = useState({});

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/products/?page=${page}`)
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => {
        if (data.length > 0) {
          setProducts((prev) => {
            const newProducts = page === 1 ? data : [...prev, ...data];
            const uniqueProducts = Array.from(new Map(newProducts.map(p => [p.id, p])).values());
            return uniqueProducts;
          });
          setHasMore(data.length >= 10); // فرض می‌کنیم هر صفحه 10 آیتم داره
        } else {
          setHasMore(false);
        }
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    const intervals = {};
    products.forEach((product) => {
      if (product.timed_discount_end_date) {
        intervals[product.id] = setInterval(() => {
          const timeRemaining = getTimeRemaining(product.timed_discount_end_date);
          setTimers((prev) => ({
            ...prev,
            [product.id]: timeRemaining,
          }));
        }, 1000);
      }
    });
    return () => Object.values(intervals).forEach(clearInterval);
  }, [products]);

  const handleLoadMore = () => {
    if (!loading && hasMore) setPage((prev) => prev + 1);
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const total = end - now;
    if (total <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total / (1000 * 60)) % 60);
    const seconds = Math.floor((total / 1000) % 60);
    return { total, hours, minutes, seconds };
  };

  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || 'N/A';
  };

  if (loading && page === 1) return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error) return <Typography>خطا: {error}</Typography>;

  return (
    <Box className="product-list-container">
      <Typography variant="h5" className="product-list-title">محصولات</Typography>
      <Box className="product-list-content">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: '1.5rem',
            padding: '0 1rem',
          }}
        >
          {products.map((product) => {
            const variant = product.variants[0] || {};
            const discount = product.get_active_discount ? product.get_active_discount() : variant.discount_percentage || 0;
            const originalPrice = variant.price; // قیمت اصلی همیشه نمایش داده می‌شه
            const discountedPrice = discount > 0 ? Math.round(variant.price * (1 - discount / 100)) : null;
            const timeRemaining = timers[product.id] || { hours: 0, minutes: 0, seconds: 0 };

            return (
              <Box key={product.id} className="product-card">
                <img
                  src={product.image || '/placeholder.jpg'}
                  alt={product.name}
                  className="product-image"
                  loading="lazy"
                />
                {product.tags && product.tags.length > 0 && (
                  <>
                    <Box className="non-discount-tags">
                      {product.tags.map((tag) => (
                        !tag.name.startsWith('تخفیف') && (
                          <span key={tag.id} className="non-discount-tag">
                            {tag.name}
                          </span>
                        )
                      ))}
                    </Box>
                    {discount > 0 && (
                      <Box className="discount-tags">
                        <span className="discount-tag">{discount}%</span>
                      </Box>
                    )}
                  </>
                )}
                {product.timed_discount_end_date && (
                  <span className="timed-offer-badge">تخفیف زمان‌دار</span>
                )}
                <Box className="product-details">
                  <Typography className="product-name">{product.name}</Typography>
                  <Box className="price-container">
                    <Typography className={discountedPrice ? "original-price" : "default-price"}>
                      {formatPrice(originalPrice)} تومان
                    </Typography>
                    {discountedPrice && (
                      <Typography className="discounted-price">
                        {formatPrice(discountedPrice)} تومان
                      </Typography>
                    )}
                    {product.timed_discount_end_date && timeRemaining.total > 0 && (
                      <Typography className="timer">
                        باقی‌مونده: {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: '0.5rem', mt: 1 }}>
                    <Button
                      component={Link}
                      to={`/products/${product.id}`}
                      variant="contained"
                      className="product-button"
                      disabled={product.variants.every(v => v.online_stock === 0)}
                    >
                      مشاهده جزئیات
                    </Button>
                    <Button
                      variant="contained"
                      className="buy-now-button"
                      disabled={product.variants.every(v => v.online_stock === 0)}
                    >
                      خرید فوری
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
        {hasMore && (
          <Button className="load-more-button" onClick={handleLoadMore} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'مشاهده بیشتر'}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default ProductList;