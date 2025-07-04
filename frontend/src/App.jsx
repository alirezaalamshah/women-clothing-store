import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import Categories from './components/Categories.jsx';
import HomeSlider from './components/Slider.jsx';
import ProductList from './components/ProductList';
import './App.css';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flex: 1, mt: { xs: 18, md: 12 }, px: { xs: 2, md: 4 } }}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HomeSlider />
                <Categories />
              </>
            }
          />
          <Route path="/products" element={<ProductList />} />
          {/* مسیرهای دیگه رو اینجا اضافه کن */}
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;