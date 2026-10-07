import React from 'react';
import { useGrant } from '../../context/GrantContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activeNotification, dismissNotification } = useGrant();

  if (!activeNotification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-4 transform transition-all animate-bounce-short">
      <div className="flex items-start space-x-3">
        {activeNotification.type === 'success' && (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        )}
        {activeNotification.type === 'warn' && (
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        {(!activeNotification.type || activeNotification.type === 'info') && (
          <Info className="w-5 h-5 text-[#062A3D] flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#062A3D]">
            {activeNotification.title}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {activeNotification.message}
          </p>
        </div>
        <button
          onClick={dismissNotification}
          className="text-slate-400 hover:text-slate-700 p-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
