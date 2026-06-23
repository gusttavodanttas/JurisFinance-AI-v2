import React from "react";
import { AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function ConfirmModal() {
  const { confirmModal, setConfirmModal } = useApp();

  if (!confirmModal.isOpen) return null;

  const close = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">{confirmModal.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">{confirmModal.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
          <button type="button" onClick={close}
            className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer bg-slate-100 border border-slate-200">
            Cancelar
          </button>
          <button type="button"
            onClick={() => { try { confirmModal.onConfirm(); } catch (e) { console.error(e); } close(); }}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
