// frontend\src\components\Categories.jsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import '../styles/Categories.css';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/categories/')
      .then((response) => response.json())
      .then((data) => setCategories(data));
  }, []);

  const visibleCategories = showAll ? categories : categories.slice(0, 12); // حداکثر 12 آیتم برای دسکتاپ

  return (
    <Box className="category-container">
      <Box className="category-separator" />
      <Box className="category-title-section">
        <Typography variant="h5" className="category-title">
          دسته‌بندی‌ها
        </Typography>
      </Box>
      <Box className="category-items">
        {visibleCategories.map((category) => (
          <Box key={category.id} className="category-item">
            <img
              src={category.image || '/placeholder.jpg'}
              alt={category.name}
              className="category-image"
            />
            <Box className="category-overlay">
              <Typography className="category-title">{category.name}</Typography>
              <Button
                component={Link}
                to={`/products/${category.slug}`}
                variant="contained"
                className="category-button"
              >
                مشاهده
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
      {categories.length > 12 && !showAll && (
        <Button className="see-more-button" onClick={() => setShowAll(true)}>
          مشاهده بیشتر
        </Button>
      )}
    </Box>
  );
}

export default Categories;