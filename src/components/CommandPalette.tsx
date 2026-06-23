import React, { useState, useEffect, useRef, useCallback } from "react";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { Search, X, LayoutDashboard, BookOpen, Sparkles, FileText, ListChecks, Target, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface Action {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  keywords: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
  onNewTransaction: () => void;
}

export default function CommandPalette({ isOpen, onClose, transactions, onNavigate, onNewTransaction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) { setQuery(""); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen]);

  const navigationActions: Action[] = [
    { id: "dashboard", label: "Ir para Dashboard", sublabel: "Visão geral, gráficos e KPIs", icon: <LayoutDashboard className="w-4 h-4 text-indigo-500" />, onSelect: () => { onNavigate("dashboard"); onClose(); }, keywords: "dashboard visão geral kpi" },
    { id: "ledger", label: "Ir para Livro Caixa", sublabel: "Histórico de movimentações", icon: <BookOpen className="w-4 h-4 text-blue-500" />, onSelect: () => { onNavigate("ledger"); onClose(); }, keywords: "livro caixa extrato lançamentos" },
    { id: "ai", label: "Ir para Separador IA", sublabel: "Categorização automática", icon: <Sparkles className="w-4 h-4 text-violet-500" />, onSelect: () => { onNavigate("ai"); onClose(); }, keywords: "ia separador inteligência artificial" },
    { id: "report", label: "Ir para Relatório", sublabel: "Relatório mensal detalhado", icon: <FileText className="w-4 h-4 text-emerald-500" />, onSelect: () => { onNavigate("report"); onClose(); }, keywords: "relatório mensal pdf" },
    { id: "priorities", label: "Ir para Priorização", sublabel: "Gerenciar despesas a pagar", icon: <ListChecks className="w-4 h-4 text-amber-500" />, onSelect: () => { onNavigate("priorities"); onClose(); }, keywords: "priorizacao despesas pagar bills" },
    { id: "metas", label: "Ir para Metas", sublabel: "Simulador de contratos e metas", icon: <Target className="w-4 h-4 text-rose-500" />, onSelect: () => { onNavigate("metas"); onClose(); }, keywords: "metas contratos simulador" },
    { id: "new-tx", label: "Novo Lançamento", sublabel: "Registrar receita ou despesa manualmente", icon: <ArrowRight className="w-4 h-4 text-slate-500" />, onSelect: () => { onNewTransaction(); onClose(); }, keywords: "novo lançamento criar transação receita despesa" },
  ];

  const q = query.toLowerCase();

  const matchedActions = q.length === 0
    ? navigationActions
    : navigationActions.filter(a => a.label.toLowerCase().includes(q) || a.keywords.includes(q));

  const matchedTransactions = q.length >= 2
    ? transactions
        .filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
        .slice(0, 5)
    : [];

  const totalItems = matchedActions.length + matchedTransactions.length;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, totalItems - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") {
      if (cursor < matchedActions.length) matchedActions[cursor]?.onSelect();
    }
    else if (e.key === "Escape") onClose();
  }, [cursor, matchedActions, totalItems, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar ação ou lançamento..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200">ESC</kbd>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {/* Navigation actions */}
          {matchedActions.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1.5 font-mono">Navegação rápida</p>
              {matchedActions.map((action, i) => (
                <button
                  key={action.id}
                  onClick={action.onSelect}
                  onMouseEnter={() => setCursor(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${cursor === i ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-none">{action.label}</p>
                    {action.sublabel && <p className="text-[10px] text-slate-400 mt-0.5">{action.sublabel}</p>}
                  </div>
                  {cursor === i && <ArrowRight className="w-3.5 h-3.5 text-indigo-400 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Transaction search results */}
          {matchedTransactions.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1.5 font-mono">Lançamentos encontrados</p>
              {matchedTransactions.map((t, i) => {
                const idx = matchedActions.length + i;
                const isRev = t.type === TransactionType.REVENUE;
                return (
                  <div
                    key={t.id}
                    onMouseEnter={() => setCursor(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${cursor === idx ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isRev ? "bg-emerald-50" : "bg-rose-50"}`}>
                      {isRev ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{t.description}</p>
                      <p className="text-[10px] text-slate-400">{t.date.split("-").reverse().join("/")} · {t.category}</p>
                    </div>
                    <span className={`text-xs font-bold font-mono flex-shrink-0 ${isRev ? "text-emerald-600" : "text-rose-500"}`}>
                      {isRev ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {matchedActions.length === 0 && matchedTransactions.length === 0 && (
            <div className="py-10 text-center text-slate-400 text-sm">
              Nenhum resultado para "<strong>{query}</strong>"
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-[9px] text-slate-400 font-mono">
          <span><kbd className="bg-white border border-slate-200 rounded px-1 py-0.5">↑↓</kbd> navegar</span>
          <span><kbd className="bg-white border border-slate-200 rounded px-1 py-0.5">↵</kbd> selecionar</span>
          <span><kbd className="bg-white border border-slate-200 rounded px-1 py-0.5">ESC</kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}
