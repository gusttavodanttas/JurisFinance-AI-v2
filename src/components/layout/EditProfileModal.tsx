import React from "react";
import { Building, X, Save } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function EditProfileModal() {
  const { isEditProfileOpen, setIsEditProfileOpen, handleSaveProfile, userName, userOab, officeName, officeSub, handleResetData, handleClearAllData } = useApp();

  if (!isEditProfileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center bg-slate-950 text-white p-4">
          <div className="flex items-center gap-1.5 font-sans">
            <Building className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold tracking-tight">Personalização da Plataforma</h3>
          </div>
          <button type="button" onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Nome do Advogado Titular / Proprietário</label>
            <input type="text" name="p_name" defaultValue={userName} required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-sans text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Documento Executivo (OAB ou CPF/CNPJ)</label>
            <input type="text" name="p_oab" defaultValue={userOab} required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-sans text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Razão Social / Nome Fantasia do Escritório PJ</label>
            <input type="text" name="p_office" defaultValue={officeName} required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-mono text-slate-800 uppercase" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Assinatura Visual / Subnome Institucional</label>
            <input type="text" name="p_sub" defaultValue={officeSub} required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-mono text-slate-800 uppercase" />
          </div>

          <div className="border-t border-slate-100 pt-3.5 space-y-2 text-left">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações do Banco de Dados</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={() => { setIsEditProfileOpen(false); handleResetData(); }}
                className="py-2 px-2.5 border border-indigo-200 hover:border-indigo-300 text-indigo-700 hover:bg-indigo-50/20 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer text-center">
                🧪 Carrega Demo
              </button>
              <button type="button"
                onClick={() => { setIsEditProfileOpen(false); handleClearAllData(); }}
                className="py-2 px-2.5 border border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50/20 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer text-center">
                🗑️ Zerar Sistema
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setIsEditProfileOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer">
              <Save className="w-3.5 h-3.5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
