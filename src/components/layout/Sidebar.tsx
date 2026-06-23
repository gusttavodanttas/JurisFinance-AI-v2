import React from "react";
import {
  Scale, LayoutDashboard, Sparkles, FileSpreadsheet, Briefcase,
  Target, FileCheck2, MessageSquare, UserCheck, Edit3,
  Users, TrendingUp, BarChart3, Gavel,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function Sidebar() {
  const { activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen, officeName, officeSub, setIsEditProfileOpen } = useApp();

  const navItem = (
    id: string,
    tab: typeof activeTab,
    icon: React.ReactNode,
    label: string,
    activeColor: string,
    borderColor: string,
  ) => (
    <button
      id={id}
      onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
        activeTab === tab
          ? `bg-gradient-to-r ${activeColor} text-white font-bold border-l-4 ${borderColor} shadow-md`
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1d]/95 backdrop-blur-md md:bg-[#0a0f1d] text-white flex flex-col p-5 border-r border-[#1a2333]/40 transition-transform duration-300
      md:translate-x-0 md:sticky md:top-0 md:flex md:h-screen shrink-0 overflow-y-auto
      ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>
      <div className="flex items-center gap-3 mb-7 border-b border-[#1e293b]/50 pb-5">
        <div className="bg-[#8b5cf6]/10 p-2.5 rounded-xl text-[#a78bfa] border border-[#8b5cf6]/20 shadow-inner flex items-center justify-center">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight uppercase text-slate-100 font-display leading-tight">{officeName}</h1>
          <p className="text-[10px] text-[#a78bfa] font-semibold tracking-widest font-mono uppercase mt-0.5">{officeSub}</p>
        </div>
      </div>

      <nav className="space-y-1.5 flex-grow font-sans">
        {navItem("nav-tab-dashboard", "dashboard",
          <LayoutDashboard className={`w-4 h-4 ${activeTab === "dashboard" ? "scale-110 text-[#3b82f6]" : "text-slate-400"}`} />,
          "Dashboard Geral", "from-blue-950/40 to-slate-900/30", "border-[#2563eb]")}

        {navItem("nav-tab-ai", "ai",
          <Sparkles className={`w-4 h-4 ${activeTab === "ai" ? "scale-110 text-[#a78bfa] animate-pulse" : "text-slate-400"}`} />,
          "Conciliação com IA", "from-violet-950/40 to-slate-900/30", "border-[#8b5cf6]")}

        {navItem("nav-tab-ledger", "ledger",
          <FileSpreadsheet className={`w-4 h-4 ${activeTab === "ledger" ? "scale-110 text-[#34d399]" : "text-slate-400"}`} />,
          "Livro Caixa (Ledger)", "from-emerald-950/40 to-slate-900/30", "border-[#10b981]")}

        {navItem("nav-tab-priorities", "priorities",
          <Briefcase className={`w-4 h-4 ${activeTab === "priorities" ? "scale-110 text-amber-400" : "text-slate-400"}`} />,
          "Priorização de Contas", "from-amber-950/40 to-slate-900/30", "border-amber-500")}

        {navItem("nav-tab-metas", "metas",
          <Target className={`w-4 h-4 ${activeTab === "metas" ? "scale-110 text-indigo-400" : "text-slate-400"}`} />,
          "Metas de Contratos", "from-indigo-950/40 to-slate-900/30", "border-indigo-500")}

        {navItem("nav-tab-report", "report",
          <FileCheck2 className={`w-4 h-4 ${activeTab === "report" ? "scale-110 text-red-400" : "text-slate-400"}`} />,
          "Relatório de Caixa", "from-rose-950/40 to-slate-900/30", "border-[#ef4444]")}

        {navItem("nav-tab-whatsapp", "whatsapp",
          <MessageSquare className={`w-4 h-4 ${activeTab === "whatsapp" ? "scale-110 text-emerald-400" : "text-slate-400"}`} />,
          "Integração WhatsApp", "from-teal-950/40 to-slate-900/30", "border-[#128c7e]")}

        {navItem("nav-tab-users", "users",
          <UserCheck className={`w-4 h-4 ${activeTab === "users" ? "scale-110 text-violet-400" : "text-slate-400"}`} />,
          "Usuários Registrados (Nuvem)", "from-purple-950/40 to-slate-900/30", "border-violet-500")}

        <div className="pt-2 pb-1">
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest font-mono px-3.5">Módulos Avançados</p>
        </div>

        {navItem("nav-tab-clients", "clients",
          <Users className={`w-4 h-4 ${activeTab === "clients" ? "scale-110 text-sky-400" : "text-slate-400"}`} />,
          "Clientes & Honorários", "from-sky-950/40 to-slate-900/30", "border-sky-500")}

        {navItem("nav-tab-cashflow90", "cashflow90",
          <TrendingUp className={`w-4 h-4 ${activeTab === "cashflow90" ? "scale-110 text-teal-400" : "text-slate-400"}`} />,
          "Fluxo de Caixa 90 Dias", "from-teal-950/40 to-slate-900/30", "border-teal-500")}

        {navItem("nav-tab-dre", "dre",
          <BarChart3 className={`w-4 h-4 ${activeTab === "dre" ? "scale-110 text-orange-400" : "text-slate-400"}`} />,
          "DRE Simplificado", "from-orange-950/40 to-slate-900/30", "border-orange-500")}

        {navItem("nav-tab-custas", "custas",
          <Gavel className={`w-4 h-4 ${activeTab === "custas" ? "scale-110 text-rose-400" : "text-slate-400"}`} />,
          "Custas & Reembolsos", "from-rose-950/40 to-slate-900/30", "border-rose-500")}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-3 text-[10px] text-slate-500 space-y-2.5">
        <button
          id="sidebar-edit-profile-action"
          onClick={() => { setIsEditProfileOpen(true); setMobileMenuOpen(false); }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-violet-600/20 hover:bg-violet-600/35 text-violet-300 hover:text-white rounded text-[10px] font-bold border border-violet-700/30 font-sans cursor-pointer transition-all"
        >
          <Edit3 className="w-3 h-3" />
          Editar Nome / Escritório
        </button>
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold text-slate-300">V1.4.2 - Licença Premium</p>
          <div className="flex items-center gap-1.5 text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Sistema Operacional</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
