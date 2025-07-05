// src/components/Footer.jsx
import React from 'react';
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react'; // Import social media icons

const Footer = () => {
  return (
    <footer className="bg-black text-gold-400 py-8 px-4 border-t border-gold-700">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
        {/* Section 1: Site Info / Logo */}
        <div className="flex flex-col items-center md:items-start">
          <div className="text-3xl font-bold text-gold-500 mb-4">
            گالری شیوا
          </div>
          <p className="text-sm leading-relaxed">
            بهترین انتخاب برای لباس‌های زنانه با طراحی‌های منحصر به فرد و کیفیت بالا.
          </p>
        </div>

        {/* Section 2: Quick Links */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-xl font-semibold text-gold-500 mb-4">لینک‌های سریع</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-gold-600 transition duration-300">صفحه اصلی</a>
            </li>
            <li>
              <a href="#" className="hover:text-gold-600 transition duration-300">محصولات</a>
            </li>
            <li>
              <a href="#" className="hover:text-gold-600 transition duration-300">درباره ما</a>
            </li>
            <li>
              <a href="#" className="hover:text-gold-600 transition duration-300">تماس با ما</a>
            </li>
            <li>
              <a href="#" className="hover:text-gold-600 transition duration-300">سیاست حفظ حریم خصوصی</a>
            </li>
          </ul>
        </div>

        {/* Section 3: Contact Info & Social Media */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-xl font-semibold text-gold-500 mb-4">تماس با ما</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-center md:justify-start">
              <Mail size={18} className="ml-2 rtl:mr-2 rtl:ml-0 text-gold-500" />
              <span>info@shivagallery.com</span>
            </li>
            <li className="flex items-center justify-center md:justify-start">
              <Phone size={18} className="ml-2 rtl:mr-2 rtl:ml-0 text-gold-500" />
              <span>+98 912 123 4567</span>
            </li>
            <li className="flex items-center justify-center md:justify-start">
              <MapPin size={18} className="ml-2 rtl:mr-2 rtl:ml-0 text-gold-500" />
              <span>تهران، خیابان ولیعصر، پلاک ۱۲۳</span>
            </li>
          </ul>
          <div className="flex space-x-4 rtl:space-x-reverse mt-6">
            <a href="#" className="text-gold-400 hover:text-gold-600 transition duration-300">
              <Instagram size={24} />
            </a>
            <a href="#" className="text-gold-400 hover:text-gold-600 transition duration-300">
              <Twitter size={24} />
            </a>
            <a href="#" className="text-gold-400 hover:text-gold-600 transition duration-300">
              <Facebook size={24} />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gold-700 mt-8 pt-6 text-center text-sm text-gold-600">
        &copy; {new Date().getFullYear()} گالری شیوا. تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
};

export default Footer;
