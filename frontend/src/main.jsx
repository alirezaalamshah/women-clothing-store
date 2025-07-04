import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import App from './App.jsx';
import './index.css';

// تنظیم کش برای RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// تم دارک با رنگ‌های پاستیلی جدید
const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark', // تم دارک
    primary: {
      main: '#edc967', // زرد پاستیلی جدید
    },
    secondary: {
      main: '#b0bec5', // خاکستری روشن برای کنتراست
    },
    background: {
      default: '#171928', // پس‌زمینه تیره
      paper: '#37474f', // پس‌زمینه کارت‌ها و کامپوننت‌ها
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Vazirmatn", "Roboto", sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>
);