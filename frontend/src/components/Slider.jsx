// frontend\src\components\Slider.jsx

import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import '../styles/Slider.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const CustomPrevArrow = (props) => (
  <Box className="custom-arrow custom-prev-arrow" onClick={props.onClick}>
    <ArrowBackIos />
  </Box>
);

const CustomNextArrow = (props) => (
  <Box className="custom-arrow custom-next-arrow" onClick={props.onClick}>
    <ArrowForwardIos />
  </Box>
);

function HomeSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/api/sliders/')
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => {
        const activeSlides = data.filter((slide) => slide.is_active);
        setSlides(activeSlides);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const settings = {
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    rtl: true,
  };

  if (loading) return <Typography>در حال بارگذاری...</Typography>;
  if (error) return <Typography>خطا: {error}</Typography>;

  return (
    <Box className="slider-container">
      {slides.length > 0 ? (
        <Slider {...settings}>
          {slides.map((slide) => (
            <Box key={slide.id} className="slider-slide">
              <img
                src={slide.image || '/placeholder.jpg'}
                alt={slide.title}
                className="slider-image"
              />
              <Box className="slider-overlay" />
              <Box className="slider-content">
                <Typography variant="h3" className="slider-title">{slide.title}</Typography>
                <Typography variant="body1" className="slider-description">{slide.description}</Typography>
                {slide.link && (
                  <Button
                    component={Link}
                    to={slide.link}
                    variant="contained"
                    className="slider-button"
                  >
                    مشاهده بیشتر محصولات
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Slider>
      ) : (
        <Typography>هیچ اسلاید فعالی موجود نیست.</Typography>
      )}
    </Box>
  );
}

export default HomeSlider;