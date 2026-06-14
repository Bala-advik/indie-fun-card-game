import React from 'react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-fade-in relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-rose-500/10 rounded-full blur-[50px] pointer-events-none"></div>
        
        <h2 className="text-xl md:text-2xl font-black text-slate-100 mb-2 relative z-10">
          {title}
        </h2>
        
        <p className="text-sm text-slate-400 mb-6 relative z-10">
          {message}
        </p>

        <div className="flex gap-3 justify-center relative z-10">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-sm w-full"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)] text-sm w-full"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
