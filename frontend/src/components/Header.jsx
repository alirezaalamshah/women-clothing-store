import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Drawer, List, ListItem, ListItemText, TextField, InputAdornment, Fade } from '@mui/material';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, WhatsApp, Menu, AccountCircle, Close } from '@mui/icons-material';
import '../styles/Header.css';

function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const menuItems = [
    { text: 'خانه', path: '/' },
    { text: 'محصولات', path: '/products' },
    { text: 'سبد خرید', path: '/cart' },
  ];

  return (
    <Box sx={{ position: 'relative', zIndex: 1200 }}>
      <AppBar position="fixed" className="header">
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {/* لوگو */}
          <Typography variant="h6" component={Link} to="/" className="logo">
            شیوا گالری
          </Typography>

          {/* منوی اصلی برای دسکتاپ */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {menuItems.map((item) => (
              <Button key={item.text} color="inherit" component={Link} to={item.path} className="nav-button">
                {item.text}
              </Button>
            ))}
          </Box>

          {/* آیکون‌ها */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton color="inherit" aria-label="جستجو" onClick={toggleSearch} className="icon-button">
              <Search />
            </IconButton>
            <IconButton color="inherit" component={Link} to="/cart" className="icon-button">
              <ShoppingCart />
            </IconButton>
            <IconButton
              color="inherit"
              href="https://wa.me/+989123456789" // شماره واتس‌اپ واقعی رو جایگزین کن
              target="_blank"
              aria-label="چت واتس‌اپ"
              className="icon-button"
            >
              <WhatsApp />
            </IconButton>
            <Button
              color="inherit"
              component={Link}
              to="/login"
              startIcon={<AccountCircle />}
              className="nav-button"
              sx={{ textTransform: 'none' }}
            >
              ورود / ثبت‌نام
            </Button>
            <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={toggleDrawer(true)}>
              <Menu />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* فیلد جستجو در دسکتاپ */}
      <Fade in={searchOpen} timeout={{ enter: 500, exit: 300 }}>
        <Box
          sx={{
            position: 'fixed',
            top: '72px', // فاصله دقیق زیر هدر
            left: 0,
            right: 0,
            zIndex: 1100,
            backgroundColor: '#37474f',
            p: 2,
            display: { xs: 'none', md: 'block' },
          }}
        >
          <TextField
            fullWidth
            placeholder="جستجوی محصولات..."
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ backgroundColor: '#263238', borderRadius: 1 }}
          />
        </Box>
      </Fade>

      {/* فیلد جستجو در موبایل */}
      <Fade in={searchOpen} timeout={{ enter: 500, exit: 300 }}>
        <Box
          sx={{
            position: 'fixed',
            top: '72px', // چسبیده به زیر هدر
            left: 0,
            right: 0,
            zIndex: 1100,
            backgroundColor: '#37474f',
            p: 2,
            display: { xs: 'block', md: 'none' },
          }}
        >
          <TextField
            fullWidth
            placeholder="جستجوی محصولات..."
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ backgroundColor: '#263238', borderRadius: 1 }}
          />
        </Box>
      </Fade>

      {/* منوی همبرگری */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250, backgroundColor: '#263238', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={toggleDrawer(false)} sx={{ color: '#b0bec5' }}>
              <Close />
            </IconButton>
          </Box>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} component={Link} to={item.path} onClick={toggleDrawer(false)}>
                <ListItemText primary={item.text} sx={{ color: '#b0bec5' }} />
              </ListItem>
            ))}
            <ListItem component={Link} to="/login" onClick={toggleDrawer(false)}>
              <ListItemText primary="ورود / ثبت‌نام" sx={{ color: '#b0bec5' }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}

export default Header;