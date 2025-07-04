import React, { useState } from 'react';
import { Box, Typography, Link, Container, TextField, Button, Snackbar, IconButton } from '@mui/material';
import { WhatsApp, Instagram, Close } from '@mui/icons-material';
import Slide from '@mui/material/Slide'; // وارد کردن Slide
import '../styles/Footer.css';

function Footer() {
  const [formData, setFormData] = useState({ fullName: '', email: '', message: '' });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log('فرم تماس:', formData);
    setOpenSnackbar(true);
    setFormData({ fullName: '', email: '', message: '' });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  return (
    <Box className="footer">
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 5, py: 4 }}>
          {/* درباره فروشگاه */}
          <Box sx={{ flex: '1 1 300px', p: 2 }}>
            <Typography variant="h6" className="footer-logo" gutterBottom>
              شیوا گالری
            </Typography>
            <Typography variant="body2" className="footer-text" sx={{ mb: 2 }}>
              فروشگاه لباس زنانه شیوا گالری در دزفول - ارائه انواع لباس‌های شیک و مدرن
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href="https://wa.me/+989123456789" target="_blank" className="footer-link">
                <WhatsApp />
              </Link>
              <Link href="https://instagram.com/shiva.gallery" target="_blank" className="footer-link">
                <Instagram />
              </Link>
            </Box>
          </Box>

          {/* لینک‌های مفید */}
          <Box sx={{ flex: '1 1 300px', p: 2 }}>
            <Typography variant="h6" className="footer-logo" gutterBottom>
              لینک‌های مفید
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link href="/about" className="footer-link" underline="hover">
                درباره ما
              </Link>
              <Link href="/terms" className="footer-link" underline="hover">
                شرایط و قوانین
              </Link>
              <Link href="/contact" className="footer-link" underline="hover">
                تماس با ما
              </Link>
            </Box>
          </Box>

          {/* فرم تماس */}
          <Box sx={{ flex: '1 1 300px', p: 2 }}>
            <Typography variant="h6" className="footer-logo" gutterBottom>
              تماس با ما
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="نام و نام خانوادگی"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                variant="outlined"
                sx={{ backgroundColor: '#37474f', borderRadius: 1 }}
              />
              <TextField
                fullWidth
                label="ایمیل"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
                sx={{ backgroundColor: '#37474f', borderRadius: 1 }}
              />
              <TextField
                fullWidth
                label="پیام"
                name="message"
                multiline
                rows={4}
                value={formData.message}
                onChange={handleChange}
                variant="outlined"
                sx={{ backgroundColor: '#37474f', borderRadius: 1 }}
              />
              <Button
                variant="contained"
                sx={{ backgroundColor: '#edc967', color: '#263238', '&:hover': { backgroundColor: '#e0b850' } }}
                onClick={handleSubmit}
              >
                ارسال پیام
              </Button>
            </Box>
          </Box>

          {/* اطلاعات پایین */}
          <Box sx={{ flexBasis: '100%', textAlign: 'center', mt: 4, p: 2 }}>
            <Typography variant="body2" className="footer-text">
              آدرس: دزفول، خیابان اصلی، پلاک ۱۲۳ | تماس: ۰۶۱-۴۲۲۲۱۲۳۴
            </Typography>
            <Typography variant="caption" className="footer-caption">
              © {new Date().getFullYear()} شیوا گالری. تمامی حقوق محفوظ است.
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* پاپ‌آپ تأیید */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000} // 5 ثانیه تایم‌لاین
        onClose={handleCloseSnackbar}
        TransitionComponent={Slide}
        action={
          <IconButton size="small" aria-label="بستن" color="inherit" onClick={handleCloseSnackbar}>
            <Close fontSize="small" />
          </IconButton>
        }
        message="پیام شما با موفقیت ارسال شد!"
        sx={{
          '& .MuiSnackbar-root': {
            bottom: '24px',
            right: '24px',
            backgroundColor: '#edc967',
            color: '#263238',
          },
        }}
      />
    </Box>
  );
}

export default Footer;