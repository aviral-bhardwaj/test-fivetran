import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border w-80 animate-[slideIn_0.2s_ease-out] ${typeStyles[toast.type] || typeStyles.info}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type] || icons.info}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;
