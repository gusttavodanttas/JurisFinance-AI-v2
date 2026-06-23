import React, { useState } from "react";
import {
  TransactionScope, TransactionType,
  PROFESSIONAL_REVENUE_CATEGORIES, PROFESSIONAL_EXPENSE_CATEGORIES,
  PERSONAL_REVENUE_CATEGORIES, PERSONAL_EXPENSE_CATEGORIES,
  addCustomCategory, deleteCustomCategory, ALL_CATEGORIES_MAP,
} from "../types";
import { Plus, Trash2, Lock, Tag, Settings2, User, Building2, Target, Percent, RefreshCw, Check } from "lucide-react";
import { useApp } from "../context/AppContext";

interface CatGroupConfig {
  title: string;
  scope: TransactionScope;
  type: TransactionType;
  defaults: string[];
  accent: string; // full Tailwind classes — no interpolation
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentBtnBg: string;
  accentBtnHover: string;
  icon: React.ReactNode;
}

function CatGroup({ title, scope, type, defaults, accent, accentBg, accentBorder, accentText, accentBtnBg, accentBtnHover, icon, onRefresh }: CatGroupConfig & { onRefresh: () => void }) {
  const [input, setInput] = useState("");
  const gdEmail = sessionStorage.getItem("gd_auth_email") || "default";
  const storageKey = `custom_categories_${gdEmail}_${scope}_${type}`;

  const getCustom = (): string[] => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  };

  const [custom, setCustom] = useState<string[]>(getCustom);
  const all = ALL_CATEGORIES_MAP[`${scope}_${type}`] ?? defaults;

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed || all.includes(trimmed)) return;
    addCustomCategory(scope, type, trimmed);
    setCustom(getCustom());
    setInput("");
    onRefresh();
  };

  const handleDelete = (cat: string) => {
    deleteCustomCategory(scope, type, cat);
    setCustom(getCustom());
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${accentBg} ${accentText}`}>{icon}</div>
        <div>
          <p className={`text-xs font-bold ${accentText}`}>{title}</p>
          <p className="text-[10px] text-slate-400 font-mono">{all.length} categorias</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
        {defaults.map(cat => (
          <div key={cat} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <Lock className="w-3 h-3 text-slate-300 flex-shrink-0" />
            <span className="flex-1 text-xs text-slate-500 truncate">{cat}</span>
            <span className="text-[9px] font-bold text-slate-300 font-mono uppercase shrink-0">padrão</span>
          </div>
        ))}
        {custom.map(cat => (
          <div key={cat} className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg ${accentBg} border ${accentBorder}`}>
            <Tag className={`w-3 h-3 ${accentText} flex-shrink-0`} />
            <span className={`flex-1 text-xs font-semibold ${accentText} truncate`}>{cat}</span>
            <button onClick={() => handleDelete(cat)}
              className="p-0.5 text-slate-300 hover:text-rose-600 transition cursor-pointer rounded flex-shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add */}
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Nova categoria..."
          className={`flex-1 min-w-0 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none ${accent}`} />
        <button onClick={handleAdd} disabled={!input.trim()}
          className={`flex items-center gap-1 px-3 py-1.5 ${accentBtnBg} ${accentBtnHover} text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40 transition shrink-0`}>
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function SettingsTab() {
  const { userName, userOab, officeName, officeSub, monthlyRevenueTarget, setMonthlyRevenueTarget } = useApp();

  const [refresh, setRefresh] = useState(0);
  const [localName, setLocalName] = useState(userName);
  const [localOab, setLocalOab] = useState(userOab);
  const [localOffice, setLocalOffice] = useState(officeName);
  const [localSub, setLocalSub] = useState(officeSub);
  const [localTarget, setLocalTarget] = useState(String(monthlyRevenueTarget || ""));
  const [simplesRate, setSimplesRate] = useState(() => localStorage.getItem("oab_simples_rate") || "6");
  const [saved, setSaved] = useState(false);

  const saveProfile = () => {
    if (localName) localStorage.setItem("oab_user_name", localName);
    if (localOab) localStorage.setItem("oab_user_oab", localOab);
    if (localOffice) localStorage.setItem("oab_office_name", localOffice.toUpperCase());
    if (localSub) localStorage.setItem("oab_office_sub", localSub.toUpperCase());
    setMonthlyRevenueTarget(parseFloat(localTarget) || 0);
    localStorage.setItem("oab_simples_rate", simplesRate);
    setSaved(true);
    setTimeout(() => { setSaved(false); window.location.reload(); }, 800);
  };

  const catGroups: CatGroupConfig[] = [
    {
      title: "PJ — Receitas",
      scope: TransactionScope.PROFESSIONAL, type: TransactionType.REVENUE,
      defaults: PROFESSIONAL_REVENUE_CATEGORIES,
      accent: "focus:border-indigo-400",
      accentBg: "bg-indigo-50", accentBorder: "border-indigo-100",
      accentText: "text-indigo-700",
      accentBtnBg: "bg-indigo-600", accentBtnHover: "hover:bg-indigo-700",
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
    {
      title: "PJ — Despesas",
      scope: TransactionScope.PROFESSIONAL, type: TransactionType.EXPENSE,
      defaults: PROFESSIONAL_EXPENSE_CATEGORIES,
      accent: "focus:border-rose-400",
      accentBg: "bg-rose-50", accentBorder: "border-rose-100",
      accentText: "text-rose-700",
      accentBtnBg: "bg-rose-600", accentBtnHover: "hover:bg-rose-700",
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
    {
      title: "PF — Receitas",
      scope: TransactionScope.PERSONAL, type: TransactionType.REVENUE,
      defaults: PERSONAL_REVENUE_CATEGORIES,
      accent: "focus:border-emerald-400",
      accentBg: "bg-emerald-50", accentBorder: "border-emerald-100",
      accentText: "text-emerald-700",
      accentBtnBg: "bg-emerald-600", accentBtnHover: "hover:bg-emerald-700",
      icon: <User className="w-3.5 h-3.5" />,
    },
    {
      title: "PF — Despesas",
      scope: TransactionScope.PERSONAL, type: TransactionType.EXPENSE,
      defaults: PERSONAL_EXPENSE_CATEGORIES,
      accent: "focus:border-amber-400",
      accentBg: "bg-amber-50", accentBorder: "border-amber-100",
      accentText: "text-amber-700",
      accentBtnBg: "bg-amber-500", accentBtnHover: "hover:bg-amber-600",
      icon: <User className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 md:p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Perfil & Escritório</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Nome do Advogado", value: localName, set: setLocalName, placeholder: "Dr. Fulano da Silva" },
            { label: "OAB", value: localOab, set: setLocalOab, placeholder: "OAB/PE 123.456" },
            { label: "Nome do Sistema", value: localOffice, set: setLocalOffice, placeholder: "JURISFINANCE AI" },
            { label: "Subtítulo / Razão Social", value: localSub, set: setLocalSub, placeholder: "DANTAS & ASSOCIADOS" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
              <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-slate-50" />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              <Target className="w-3 h-3 inline mr-1 text-indigo-400" />
              Meta Mensal de Receita (R$)
            </label>
            <input type="number" value={localTarget} onChange={e => setLocalTarget(e.target.value)} placeholder="Ex: 15000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-400 bg-slate-50" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              <Percent className="w-3 h-3 inline mr-1 text-amber-500" />
              Alíquota Simples Nacional (%)
            </label>
            <input type="number" step="0.1" min="0" max="100" value={simplesRate}
              onChange={e => setSimplesRate(e.target.value)} placeholder="6.0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-amber-400 bg-slate-50" />
            <p className="text-[9px] text-slate-400 mt-1">Usada para cálculo da provisão de impostos no Dashboard</p>
          </div>
        </div>
        <button onClick={saveProfile}
          className={`mt-4 flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${saved ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
          {saved ? <><Check className="w-3.5 h-3.5" /> Salvo!</> : "Salvar Configurações"}
        </button>
      </div>

      {/* Categories */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Categorias de Lançamentos</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-mono sm:ml-1">
            <Lock className="w-2.5 h-2.5 inline mr-0.5" />padrão = bloqueado ·
            <Tag className="w-2.5 h-2.5 inline mx-0.5" />personalizadas = editáveis
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" key={refresh}>
          {catGroups.map(g => <CatGroup key={g.title} {...g} onRefresh={() => setRefresh(r => r + 1)} />)}
        </div>
      </div>

      {/* Reset */}
      <div className="bg-white rounded-xl border border-rose-100 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-rose-700 mb-2 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Redefinir Categorias Personalizadas
        </h3>
        <p className="text-xs text-slate-500 mb-3">Remove todas as categorias personalizadas e restaura os padrões. Os lançamentos existentes não são alterados.</p>
        <button onClick={() => {
          const gdEmail = sessionStorage.getItem("gd_auth_email") || "default";
          [
            `${TransactionScope.PROFESSIONAL}_${TransactionType.REVENUE}`,
            `${TransactionScope.PROFESSIONAL}_${TransactionType.EXPENSE}`,
            `${TransactionScope.PERSONAL}_${TransactionType.REVENUE}`,
            `${TransactionScope.PERSONAL}_${TransactionType.EXPENSE}`,
          ].forEach(k => localStorage.removeItem(`custom_categories_${gdEmail}_${k}`));
          window.dispatchEvent(new Event("categories_updated"));
          setRefresh(r => r + 1);
        }} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition">
          Redefinir para padrão
        </button>
      </div>
    </div>
  );
}
