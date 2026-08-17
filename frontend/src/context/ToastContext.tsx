"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: toast.type === 'success' ? '#111' : toast.type === 'error' ? '#dc2626' : '#2563eb',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)',
              animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              minWidth: '280px',
              maxWidth: '420px',
            }}
            onClick={() => removeToast(toast.id)}
          >
            {/* Icon */}
            {toast.type === 'success' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            )}
            {toast.type === 'error' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            {toast.type === 'info' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}

            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
