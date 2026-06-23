import React, { useRef, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Edit3, Menu, Search, Download, Upload, MoreVertical, Settings } from "lucide-react";
import { useApp } from "../../context/AppContext";

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function AppHeader({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
  const {
    syncStatus, selectedMonth, setSelectedMonth,
    handlePrevMonth, handleNextMonth, generatedMonthsList,
    userName, setIsEditProfileOpen, handleLogout,
    setIsModalOpen, setTransactionToEdit, mobileMenuOpen, setMobileMenuOpen,
    handleExportBackup, handleImportBackup, setActiveTab,
  } = useApp();

  const importRef = useRef<HTMLInputElement>(null);
  const [showMore, setShowMore] = useState(false);

  return (
    <header className="bg-white border-b border-[#e2e8f0] py-2 px-3 md:px-4 sticky top-0 z-30 shadow-xs min-h-[52px] flex items-center">
      <input ref={importRef} type="file" accept=".json" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { handleImportBackup(f); e.target.value = ""; } }} />

      <div className="w-full flex items-center justify-between gap-2">

        {/* LEFT: menu + title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="mobile-menu-toggle-header"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 rounded-md bg-slate-50 cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block shrink-0" />
            <span className="text-xs font-bold text-slate-700 tracking-wide font-sans truncate hidden sm:block">Controladoria Financeira</span>

            {/* Sync badge — only visible on md+ */}
            <span className="hidden md:inline-flex">
              {syncStatus === "syncing" && (
                <span className="text-[8px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />Sincronizando
                </span>
              )}
              {syncStatus === "synced" && (
                <span className="text-[8px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Sincronizado
                </span>
              )}
              {syncStatus === "error" && (
                <span className="text-[8px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full border border-rose-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Erro na Nuvem
                </span>
              )}
              {syncStatus === "offline" && (
                <span className="text-[8px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Offline
                </span>
              )}
            </span>
          </div>
        </div>

        {/* RIGHT: controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Month picker */}
          <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-md border border-[#e2e8f0]">
            <button onClick={handlePrevMonth} disabled={selectedMonth === "ALL"}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30 cursor-pointer transition-colors">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <select className="bg-transparent text-[11px] text-slate-700 font-bold focus:outline-none cursor-pointer px-0.5 max-w-[80px] sm:max-w-none"
              value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              <option value="ALL">Todos</option>
              {generatedMonthsList.map(m => {
                const [y, mo] = m.split("-");
                return <option key={m} value={m}>{PT_MONTHS[parseInt(mo) - 1]} {y}</option>;
              })}
            </select>
            <button onClick={handleNextMonth} disabled={selectedMonth === "ALL"}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30 cursor-pointer transition-colors">
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Search — desktop only */}
          {onOpenCommandPalette && (
            <button onClick={onOpenCommandPalette}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-mono rounded-md transition-all cursor-pointer select-none"
              title="Busca rápida (Ctrl+K)">
              <Search className="w-3 h-3" />
              <span>Buscar...</span>
              <kbd className="text-[9px] bg-white border border-slate-200 px-1 py-0.5 rounded ml-1">Ctrl K</kbd>
            </button>
          )}

          {/* New transaction */}
          <button id="header-new-record-btn"
            onClick={() => { setTransactionToEdit(null); setIsModalOpen(true); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-all shadow-xs shrink-0 cursor-pointer select-none">
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline font-sans">Lançar</span>
          </button>

          {/* Backup — desktop only */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={handleExportBackup} title="Exportar backup JSON"
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer bg-white">
              <Download className="w-3 h-3" />
            </button>
            <button onClick={() => importRef.current?.click()} title="Importar backup JSON"
              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer bg-white">
              <Upload className="w-3 h-3" />
            </button>
          </div>

          {/* Avatar — desktop only */}
          <button id="header-profile-btn" onClick={() => setIsEditProfileOpen(true)}
            className="hidden md:flex items-center gap-1.5 pl-1 py-0.5 text-left hover:opacity-85 transition-all cursor-pointer group"
            title={`Configurar: ${userName}`}>
            <div className="w-7 h-7 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] font-extrabold text-[10px] flex items-center justify-center border border-[#8b5cf6]/20 shadow-xs group-hover:bg-[#8b5cf6]/20 transition-all">
              {userName ? userName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase() : "GD"}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-[10px] font-bold text-slate-700 leading-none flex items-center gap-0.5 group-hover:text-indigo-600 transition-colors">
                {userName ? userName.split(" ")[0] : "Doutor"}
                <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-500 inline" />
              </div>
            </div>
          </button>

          {/* Logout — desktop only */}
          <button id="header-logout-btn" onClick={handleLogout}
            className="hidden md:block p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 border border-[#e2e8f0] transition-colors cursor-pointer bg-white"
            title="Sair do sistema">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>

          {/* Mobile overflow menu */}
          <div className="relative md:hidden">
            <button onClick={() => setShowMore(v => !v)}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer bg-white">
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMore && (
              <div className="absolute right-0 top-9 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-xs">
                <button onClick={() => { onOpenCommandPalette?.(); setShowMore(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 cursor-pointer">
                  <Search className="w-3.5 h-3.5 text-slate-400" /> Buscar (Ctrl+K)
                </button>
                <button onClick={() => { handleExportBackup(); setShowMore(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 cursor-pointer">
                  <Download className="w-3.5 h-3.5 text-emerald-500" /> Exportar backup
                </button>
                <button onClick={() => { importRef.current?.click(); setShowMore(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" /> Importar backup
                </button>
                <button onClick={() => { setActiveTab("settings"); setShowMore(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 cursor-pointer">
                  <Settings className="w-3.5 h-3.5 text-slate-400" /> Configurações
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { setIsEditProfileOpen(true); setShowMore(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  {userName?.split(" ")[0] || "Perfil"}
                </button>
                <button onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sair
                </button>
              </div>
            )}
            {showMore && <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />}
          </div>
        </div>
      </div>
    </header>
  );
}
