// src/components/Modal.jsx
import React from 'react';

const Modal = ({ isOpen, onClose, title, message, onConfirm, showCancel = true, confirmText = 'تایید', cancelText = 'لغو' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 font-vazirmatn">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gold-700 p-6 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gold-500 mb-4 text-center">{title}</h2>
        <p className="text-gold-300 mb-6 text-center">{message}</p>
        <div className="flex justify-center space-x-4 rtl:space-x-reverse">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 text-gold-400 font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-gold-600 text-black font-semibold rounded-lg shadow-md hover:bg-gold-700 transition duration-300"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
