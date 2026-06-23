import React, { useRef } from "react";
import { Plus, ChevronLeft, ChevronRight, Edit3, Menu, Search, Download, Upload } from "lucide-react";
import { useApp } from "../../context/AppContext";

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function AppHeader({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
  const {
    syncStatus, selectedMonth, setSelectedMonth,
    handlePrevMonth, handleNextMonth, generatedMonthsList,
    userName, setIsEditProfileOpen, handleLogout,
    setIsModalOpen, setTransactionToEdit, mobileMenuOpen, setMobileMenuOpen,
    handleExportBackup, handleImportBackup,
  } = useApp();
  const importRef = useRef<HTMLInputElement>(null);

  return (
    <header className="bg-white border-b border-[#e2e8f0] py-2 px-4 sticky top-0 z-30 shadow-xs min-h-[52px] flex items-center">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">

        <div className="flex items-center gap-2">
          <button
            id="mobile-menu-toggle-header"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 rounded-md bg-slate-50 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block"></span>
            <span className="text-xs font-bold text-slate-700 tracking-wide font-sans">Controladoria Financeira</span>
            <span className="text-[8px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100 hidden sm:inline-block font-extrabold tracking-wider uppercase select-none">
              Ambiente Seguro
            </span>

            {syncStatus === "syncing" && (
              <span className="text-[8px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                Supabase: Sincronizando
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="text-[8px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Supabase: Sincronizado
              </span>
            )}
            {syncStatus === "error" && (
              <span className="text-[8px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full border border-rose-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Erro na Nuvem
              </span>
            )}
            {syncStatus === "offline" && (
              <span className="text-[8px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Modo Offline
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 justify-end">
          <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-md border border-[#e2e8f0]">
            <button
              id="header-prev-month-btn"
              onClick={handlePrevMonth}
              disabled={selectedMonth === "ALL"}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <select
              id="competence-select-header"
              className="bg-transparent text-[11px] text-slate-700 font-bold focus:outline-hidden cursor-pointer px-1"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="ALL">Todo Período</option>
              {generatedMonthsList.map(m => {
                const [y, mo] = m.split("-");
                return <option key={m} value={m}>{PT_MONTHS[parseInt(mo) - 1]} {y}</option>;
              })}
            </select>

            <button
              id="header-next-month-btn"
              onClick={handleNextMonth}
              disabled={selectedMonth === "ALL"}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-mono rounded-md transition-all cursor-pointer select-none"
              title="Busca rápida (Ctrl+K)"
            >
              <Search className="w-3 h-3" />
              <span>Buscar...</span>
              <kbd className="text-[9px] bg-white border border-slate-200 px-1 py-0.5 rounded ml-1">Ctrl K</kbd>
            </button>
          )}

          <button
            id="header-new-record-btn"
            onClick={() => { setTransactionToEdit(null); setIsModalOpen(true); }}
            className="flex items-center gap-1 px-2 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-all shadow-xs shrink-0 cursor-pointer select-none"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline font-sans">Lançar Movimentação</span>
            <span className="sm:hidden font-sans">Lançar</span>
          </button>

          {/* Backup/Restore */}
          <input ref={importRef} type="file" accept=".json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { handleImportBackup(f); e.target.value = ""; } }} />
          <button onClick={handleExportBackup} title="Exportar backup JSON"
            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer bg-white">
            <Download className="w-3 h-3" />
          </button>
          <button onClick={() => importRef.current?.click()} title="Importar backup JSON"
            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer bg-white">
            <Upload className="w-3 h-3" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            id="header-profile-btn"
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-1.5 pl-1 py-0.5 text-left hover:opacity-85 transition-all cursor-pointer group"
            title={`Configurar: ${userName}`}
          >
            <div className="w-7 h-7 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] font-extrabold text-[10px] flex items-center justify-center border border-[#8b5cf6]/20 shadow-xs group-hover:bg-[#8b5cf6]/20 transition-all">
              {userName ? userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "GD"}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-[10px] font-bold text-slate-700 leading-none flex items-center gap-0.5 group-hover:text-indigo-600 transition-colors">
                {userName ? userName.split(" ")[0] : "Doutor"}
                <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-500 inline" />
              </div>
            </div>
          </button>

          <button
            id="header-logout-btn"
            onClick={handleLogout}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-[#e2e8f0] transition-colors cursor-pointer bg-white"
            title="Sair do sistema"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
