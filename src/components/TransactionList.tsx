import React, { useState, useRef } from "react";
import { Transaction, TransactionScope, TransactionType, ALL_CATEGORIES_MAP } from "../types";
import {
  Search,
  Filter,
  Trash2,
  TrendingUp,
  TrendingDown,
  Briefcase,
  User,
  AlertOctagon,
  ChevronRight,
  Sparkles,
  CalendarDays,
  FileCheck2,
  X,
  Plus,
  Edit3,
  Check,
  Download,
  Upload,
  CheckCheck
} from "lucide-react";
import { formatCurrency } from "../utils/currency";

const exportToCSV = (rows: Transaction[], filename: string) => {
  const header = ["Data","Tipo","Escopo","Descrição","Categoria","Método","Valor","Status"];
  const lines = rows.map(t => [
    t.date.split("-").reverse().join("/"),
    t.type === TransactionType.REVENUE ? "Receita" : "Despesa",
    t.scope === TransactionScope.PROFESSIONAL ? "PJ" : "PF",
    `"${t.description.replace(/"/g,'""')}"`,
    `"${t.category.replace(/"/g,'""')}"`,
    t.paymentMethod || "—",
    t.amount.toFixed(2).replace(".",","),
    t.status || "REALIZADO",
  ].join(";"));
  const csv = [header.join(";"), ...lines].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

interface TransactionListProps {
  transactions: Transaction[];
  selectedMonth: string;
  onSetSelectedMonth: (month: string) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onTriggerNewTransaction?: () => void;
  onClearAllTransactions?: () => void;
  onConfirmTransaction?: (id: string) => void;
  onReconcileTransaction?: (id: string) => void;
  onImportTransactions?: (items: Omit<Transaction, "id">[]) => void;
}

export default function TransactionList({
  transactions,
  selectedMonth,
  onSetSelectedMonth,
  onDeleteTransaction,
  onEditTransaction,
  onTriggerNewTransaction,
  onClearAllTransactions,
  onConfirmTransaction,
  onReconcileTransaction,
  onImportTransactions,
}: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | TransactionScope>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | TransactionType>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [csvImportRows, setCsvImportRows] = useState<Omit<Transaction, "id">[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [showUnreconciled, setShowUnreconciled] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get distinct list of available months in transactions, plus some key active months
  const monthsSet = new Set<string>(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
  transactions.forEach((t) => {
    if (t.date && t.date.length >= 7) {
      monthsSet.add(t.date.substring(0, 7)); // "YYYY-MM"
    }
  });
  const sortedMonths = Array.from(monthsSet).sort().reverse(); // Newest first

  // Get list of categories present in the filtered transactions of current scope/type
  const categoriesPresent = Array.from(
    new Set(
      transactions
        .filter((t) => {
          const matchesScope = scopeFilter === "ALL" || t.scope === scopeFilter;
          const matchesType = typeFilter === "ALL" || t.type === typeFilter;
          return matchesScope && matchesType;
        })
        .map((t) => t.category)
    )
  ).sort();

  // Parse CSV file for import
  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const sep = lines[0].includes(";") ? ";" : ",";
      const rows: Omit<Transaction, "id">[] = [];
      // Skip header line if first field looks like a label
      const startIdx = isNaN(Date.parse(lines[0].split(sep)[0])) ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.replace(/^"|"$/g, "").trim());
        if (cols.length < 3) continue;
        const rawDate = cols[0].includes("/") ? cols[0].split("/").reverse().join("-") : cols[0];
        const desc = cols[1] || "Importado";
        const rawVal = parseFloat(cols[2].replace(/[^\d.,-]/g, "").replace(",", "."));
        if (isNaN(rawVal) || !rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
        rows.push({
          date: rawDate,
          description: desc,
          type: rawVal >= 0 ? TransactionType.REVENUE : TransactionType.EXPENSE,
          scope: TransactionScope.PROFESSIONAL,
          category: rawVal >= 0 ? "Outras Receitas Profissionais" : "Outras Despesas Profissionais",
          amount: Math.abs(rawVal),
          status: "REALIZADO" as const,
          paymentMethod: cols[3] || undefined,
          isAiCategorized: false,
        });
      }
      setCsvImportRows(rows);
      setShowCsvPreview(rows.length > 0);
    };
    reader.readAsText(file, "UTF-8");
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesMonth = selectedMonth === "ALL" || t.date.substring(0, 7) === selectedMonth;
    const matchesScope = scopeFilter === "ALL" || t.scope === scopeFilter;
    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase())) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesDateFrom = !dateFrom || t.date >= dateFrom;
    const matchesDateTo = !dateTo || t.date <= dateTo;

    const matchesReconciled = !showUnreconciled || !t.reconciled;
    const matchesClient = clientFilter === "ALL" || t.clientName === clientFilter;
    return matchesMonth && matchesScope && matchesType && matchesCategory && matchesSearch && matchesDateFrom && matchesDateTo && matchesReconciled && matchesClient;
  });

  // Pagination
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredTransactions.length / pageSize);
  const safePageSize = pageSize === 0 ? filteredTransactions.length : pageSize;
  const paginatedTransactions = filteredTransactions.slice((page - 1) * safePageSize, page * safePageSize);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [search, scopeFilter, typeFilter, categoryFilter, dateFrom, dateTo, selectedMonth, showUnreconciled, clientFilter]);


  // Calculate stats for the filtered viewport
  const filteredProfRevenue = filteredTransactions
    .filter((t) => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.REVENUE)
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredProfExpense = filteredTransactions
    .filter((t) => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredPersRevenue = filteredTransactions
    .filter((t) => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.REVENUE)
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredPersExpense = filteredTransactions
    .filter((t) => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div id="financial-journal-panel" className="bg-white rounded-lg border border-[#e2e8f0] p-4 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Movimentações escrituradas</span>
          <h3 className="text-sm font-bold text-slate-900">Extrato Consolidado & Livro Diário</h3>
        </div>

        {/* MONTH FILTER TAB */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            id="month-filter-all"
            onClick={() => onSetSelectedMonth("ALL")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
              selectedMonth === "ALL"
                ? "bg-[#0f172a] text-white border-slate-900 shadow-2xs"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Ver Todos
          </button>
          {sortedMonths.map((m) => {
            const parts = m.split("-");
            // Translate month number to Portuguese abbreviation
            const ptMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            const mLabel = `${ptMonths[parseInt(parts[1]) - 1]}/${parts[0].substring(2)}`;

            return (
              <button
                id={`month-filter-${m}`}
                key={m}
                onClick={() => onSetSelectedMonth(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                  selectedMonth === m
                    ? "bg-[#0f172a] text-white border-slate-900 shadow-2xs"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {mLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER SEARCH CRITERIA ROW */}
      <div id="filter-controls-row" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-2 bg-slate-50 p-3 rounded-lg mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            id="filter-search-input"
            type="text"
            className="w-full bg-white border border-slate-200 rounded py-1.5 pl-8 pr-2.5 text-xs placeholder-slate-400 focus:outline-hidden focus:border-[#8b5cf6] text-slate-700"
            placeholder="Pesquisar descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Scope Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1.5">
          <Filter className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <select
            id="filter-scope-select"
            className="w-full bg-transparent text-xs text-slate-500 focus:outline-hidden cursor-pointer font-bold uppercase tracking-wide"
            value={scopeFilter}
            onChange={(e) => {
              setScopeFilter(e.target.value as any);
              setCategoryFilter("ALL"); // Reset category on scope shift
            }}
          >
            <option value="ALL">PJ + PF Consolidados</option>
            <option value={TransactionScope.PROFESSIONAL}>Filtrar PJ Escritório</option>
            <option value={TransactionScope.PERSONAL}>Filtrar PF Pessoal</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1.5">
          <Filter className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <select
            id="filter-type-select"
            className="w-full bg-transparent text-xs text-slate-500 focus:outline-hidden cursor-pointer font-bold uppercase tracking-wide"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setCategoryFilter("ALL"); // Reset category on type shift
            }}
          >
            <option value="ALL">Receitas & Despesas</option>
            <option value={TransactionType.REVENUE}>Apenas Entradas</option>
            <option value={TransactionType.EXPENSE}>Apenas Saídas</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1.5 animate-fade-in">
          <Filter className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <select
            id="filter-category-select"
            className="w-full bg-transparent text-xs text-slate-500 focus:outline-hidden cursor-pointer font-bold uppercase tracking-wide truncate"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas Categorias</option>
            {categoriesPresent.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1.5">
          <CalendarDays className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-500 focus:outline-none cursor-pointer"
            placeholder="De" title="Data inicial" />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1.5">
          <CalendarDays className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-500 focus:outline-none cursor-pointer"
            placeholder="Até" title="Data final" />
        </div>

        {/* Client filter */}
        {(() => {
          const clients = Array.from(new Set(transactions.map(t => t.clientName).filter(Boolean))) as string[];
          if (clients.length === 0) return null;
          return (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1.5">
              <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-600 focus:outline-none cursor-pointer">
                <option value="ALL">Todos Clientes</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          );
        })()}
      </div>

      {/* CSV Import Preview */}
      {showCsvPreview && csvImportRows.length > 0 && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800">{csvImportRows.length} linhas detectadas no CSV — revise e importe</p>
            <button onClick={() => { setShowCsvPreview(false); setCsvImportRows([]); }} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {csvImportRows.slice(0, 20).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono bg-white border border-emerald-100 rounded px-2 py-1">
                <span className="text-slate-400">{r.date}</span>
                <span className="flex-1 truncate text-slate-700">{r.description}</span>
                <span className={r.type === TransactionType.REVENUE ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                  {r.type === TransactionType.REVENUE ? "+" : "-"}{formatCurrency(r.amount)}
                </span>
              </div>
            ))}
            {csvImportRows.length > 20 && <p className="text-[10px] text-emerald-600 text-center">+ {csvImportRows.length - 20} linhas...</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onImportTransactions?.(csvImportRows); setShowCsvPreview(false); setCsvImportRows([]); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Importar {csvImportRows.length} lançamentos
            </button>
            <button onClick={() => { setShowCsvPreview(false); setCsvImportRows([]); }}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-500 text-xs rounded-lg cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* FILTER VIEW SUMMARY METRICS */}
      <div id="filter-metrics-summary" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50/40 p-2.5 rounded mb-3 text-[10px] border border-[#e2e8f0]">
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider font-mono">Faturamento PJ:</span>
          <span className="text-blue-700 font-bold font-mono block text-xs mt-0.5">{formatCurrency(filteredProfRevenue)}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider font-mono">Custos Operacionais PJ:</span>
          <span className="text-rose-600 font-bold font-mono block text-xs mt-0.5">{formatCurrency(filteredProfExpense)}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider font-mono">Rendimento Total PF:</span>
          <span className="text-violet-700 font-bold font-mono block text-xs mt-0.5">{formatCurrency(filteredPersRevenue)}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider font-mono">Gastos Unificados PF:</span>
          <span className="text-amber-600 font-bold font-mono block text-xs mt-0.5">{formatCurrency(filteredPersExpense)}</span>
        </div>
      </div>

      {/* DEDICATED QUICK HELP & ACTIONS STRIP */}
      <div id="ledger-quick-actions-bar" className="flex flex-col gap-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-200/40 mb-4">
        {/* Row 1: count + primary action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
            <span className="text-[11px] text-slate-600 font-medium">
              <strong className="text-indigo-950">{filteredTransactions.length}</strong>
              <span className="hidden sm:inline"> de <strong className="text-slate-800">{transactions.length}</strong> lançamentos</span>
            </span>
          </div>
          {onTriggerNewTransaction && (
            <button
              id="ledger-direct-add-btn"
              onClick={onTriggerNewTransaction}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-all shadow-xs cursor-pointer select-none shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lançar Movimentação</span>
              <span className="sm:hidden">Lançar</span>
            </button>
          )}
        </div>
        {/* Row 2: filter + data tools — scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setShowUnreconciled(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 border text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none shrink-0 ${showUnreconciled ? "bg-teal-600 text-white border-teal-600" : "bg-white hover:bg-teal-50 text-slate-500 hover:text-teal-700 border-slate-200 hover:border-teal-200"}`}
            title="Não conciliados"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showUnreconciled ? "Não conciliados" : "Não conciliado"}</span>
          </button>
          <button
            onClick={() => setShowBalance(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 border text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none shrink-0 ${showBalance ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 border-slate-200 hover:border-indigo-200"}`}
            title="Saldo acumulado"
          >
            <span>Saldo Acum.</span>
          </button>
          <div className="w-px h-4 bg-slate-200 shrink-0" />
          <button
            onClick={() => exportToCSV(filteredTransactions, `lancamentos-${new Date().toISOString().slice(0,10)}.csv`)}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          {onImportTransactions && (
            <>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); e.target.value = ""; }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none shrink-0"
                title="Importar CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Importar CSV</span>
              </button>
            </>
          )}
          {onClearAllTransactions && transactions.length > 0 && (
            <button
              id="ledger-direct-clear-btn"
              onClick={onClearAllTransactions}
              className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none shrink-0"
              title="Excluir todos os lançamentos"
            >
              Excluir Tudo
            </button>
          )}
        </div>
      </div>

      {/* LEDGER DATA TABLE - DESKTOP VIEW */}
      <div id="ledger-desktop-table" className="hidden md:block overflow-x-auto border border-slate-100 rounded-lg shadow-3xs">
        <table className="w-full border-collapse text-left text-xs text-slate-600">
          <thead>
            <tr className="border-b border-[#e2e8f0] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 text-[9px] font-mono">
              <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Data</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Escopo / Alocação</th>
              <th className="py-2.5 px-3 min-w-[180px]">Descrição da Conta</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Valor Lançado</th>
              {showBalance && <th className="py-2.5 px-3 text-right whitespace-nowrap text-indigo-500">Saldo Acum.</th>}
              <th className="py-2.5 px-3 whitespace-nowrap">Categoria</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">Método</th>
              <th className="py-2.5 px-3 w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <CalendarDays className="w-7 h-7 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 text-sm">Nenhuma movimentação localizada</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {search || scopeFilter !== "ALL" || typeFilter !== "ALL" || categoryFilter !== "ALL"
                          ? "Tente reajustar os filtros de pesquisa."
                          : "Nenhum lançamento para este período ainda."}
                      </p>
                    </div>
                    {onTriggerNewTransaction && (
                      <button onClick={onTriggerNewTransaction}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Lançar primeira movimentação
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (() => {
              // compute running balance ascending by date
              const sorted = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
              let bal = 0;
              const balMap = new Map<string, number>();
              sorted.forEach(t => {
                if (t.status !== "PREVISTO") bal += t.type === TransactionType.REVENUE ? t.amount : -t.amount;
                balMap.set(t.id, bal);
              });
              return paginatedTransactions.map((t) => {
                const isProf = t.scope === TransactionScope.PROFESSIONAL;
                const isRevenue = t.type === TransactionType.REVENUE;

                // Detect if the transaction is mixed (e.g. personal expenses leaking into office account)
                const isPersonalLeak = t.scope === TransactionScope.PERSONAL && t.isAiCategorized;
                const runBal = balMap.get(t.id) ?? 0;

                return (
                  <tr 
                    id={`transaction-row-${t.id}`} 
                    key={t.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${isPersonalLeak ? "bg-amber-50/30" : ""}`}
                  >
                    {/* Date */}
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-500 text-center whitespace-nowrap text-[11px]">
                      {t.date.split("-").reverse().join("/")}
                    </td>

                    {/* Scope & Tags */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5 items-start">
                        {/* Scope badge */}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          isProf 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                            : "bg-sky-50 text-sky-700 border-sky-100"
                        }`}>
                          {isProf ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {isProf ? "Profissional" : "Pessoal"}
                        </span>

                        {/* Leak Warning Banner */}
                        {isPersonalLeak && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 mt-0.5 animate-pulse">
                            <AlertOctagon className="w-2.5 h-2.5 text-amber-600" />
                            Mistura PJ/PF
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Description & notes */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 leading-snug truncate" title={t.description}>{t.description}</span>
                        {t.status === "PREVISTO" && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            {isRevenue ? "A receber" : "A pagar"}
                          </span>
                        )}
                      </div>
                      {t.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-snug truncate max-w-xs" title={t.notes}>
                          {t.notes}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-semibold font-mono text-[12px] whitespace-nowrap">
                      <span className={isRevenue ? "text-emerald-600" : "text-rose-500"}>
                        {isRevenue ? "+" : "-"} {formatCurrency(t.amount)}
                      </span>
                    </td>

                    {/* Running Balance */}
                    {showBalance && (
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                        {t.status === "PREVISTO"
                          ? <span className="text-slate-300">—</span>
                          : <span className={runBal >= 0 ? "text-indigo-600 font-semibold" : "text-rose-600 font-semibold"}>{formatCurrency(runBal)}</span>
                        }
                      </td>
                    )}

                    {/* Category */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-medium text-[11px] max-w-[120px] truncate" title={t.category}>
                      {t.category}
                    </td>

                    {/* Payment Method */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-400 text-[11px]">
                      {t.paymentMethod || "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {onConfirmTransaction && t.status === "PREVISTO" && (
                          <button
                            id={`confirm-tx-${t.id}`}
                            type="button"
                            onClick={() => onConfirmTransaction(t.id)}
                            className="p-1 px-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title={isRevenue ? "Confirmar recebimento (Marcar como recebido)" : "Confirmar pagamento (Marcar como pago)"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onReconcileTransaction && t.status !== "PREVISTO" && (
                          <button
                            type="button"
                            onClick={() => onReconcileTransaction(t.id)}
                            className={`p-1 px-1.5 rounded transition-colors cursor-pointer ${t.reconciled ? "text-teal-600 bg-teal-50" : "text-slate-300 hover:text-teal-500 hover:bg-teal-50"}`}
                            title={t.reconciled ? "Conciliado com extrato ✓" : "Marcar como conciliado com extrato bancário"}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onEditTransaction && (
                          <button
                            id={`edit-tx-${t.id}`}
                            type="button"
                            onClick={() => onEditTransaction(t)}
                            className="p-1 px-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Editar transação"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          id={`delete-tx-${t.id}`}
                          type="button"
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remover de forma definitiva"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* LEDGER DATA CARDS - MOBILE VIEW */}
      <div id="ledger-mobile-cards" className="block md:hidden space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <AlertOctagon className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-500">Nenhuma movimentação localizada</p>
              <p className="text-xs">Tente reajustar seus filtros no menu de pesquisa ou redefina os meses.</p>
            </div>
          </div>
        ) : (
          paginatedTransactions.map((t) => {
            const isProf = t.scope === TransactionScope.PROFESSIONAL;
            const isRevenue = t.type === TransactionType.REVENUE;
            const isPersonalLeak = t.scope === TransactionScope.PERSONAL && t.isAiCategorized;

            return (
              <div 
                id={`transaction-card-${t.id}`}
                key={t.id} 
                className={`bg-white rounded-xl border p-4 shadow-3xs transition-all space-y-3 ${
                  isPersonalLeak ? "bg-amber-50/20 border-amber-200" : "border-slate-200"
                }`}
              >
                {/* Header row: Date and Scope Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-500 font-bold text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {t.date.split("-").reverse().join("/")}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isProf 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                        : "bg-sky-50 text-sky-700 border-sky-100"
                    }`}>
                      {isProf ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                      {isProf ? "PJ Escritório" : "PF Pessoal"}
                    </span>
                    
                    {isPersonalLeak && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        <AlertOctagon className="w-2.5 h-2.5 text-amber-600" />
                        Mistura PJ/PF
                      </span>
                    )}
                  </div>
                </div>

                {/* Description and notes */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{t.description}</h4>
                    {t.status === "PREVISTO" && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        {isRevenue ? "A receber" : "A pagar"}
                      </span>
                    )}
                  </div>
                  {t.notes && <p className="text-[11px] text-slate-400 bg-slate-50/40 p-1.5 rounded border border-slate-100">{t.notes}</p>}
                  
                  {/* Category & payment method details */}
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2 text-[10px] sm:text-xs text-slate-500">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Categoria:</span> {t.category}
                    </div>
                    {t.paymentMethod && (
                      <div>
                        • <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Pagamento:</span> {t.paymentMethod}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer row: Value and touch action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className={`text-[13px] sm:text-sm font-extrabold font-mono ${isRevenue ? "text-emerald-600" : "text-rose-500"}`}>
                    {isRevenue ? "+" : "-"} {formatCurrency(t.amount)}
                  </span>
                  
                  {/* Highly visible Edit & Delete triggers for smaller displays */}
                  <div className="flex items-center gap-1.5">
                    {onConfirmTransaction && t.status === "PREVISTO" && (
                      <button
                        id={`confirm-card-tx-${t.id}`}
                        type="button"
                        onClick={() => onConfirmTransaction(t.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-100 font-bold transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Confirmar
                      </button>
                    )}
                    {onEditTransaction && (
                      <button
                        id={`edit-card-tx-${t.id}`}
                        type="button"
                        onClick={() => onEditTransaction(t)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-100 font-bold transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </button>
                    )}
                    <button
                      id={`delete-card-tx-${t.id}`}
                      type="button"
                      onClick={() => onDeleteTransaction(t.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-100 font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION */}
      {filteredTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Itens por página:</span>
            {[25, 50, 100, 0].map(n => (
              <button key={n} onClick={() => { setPageSize(n); setPage(1); }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition cursor-pointer ${pageSize === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`}>
                {n === 0 ? "Todos" : n}
              </button>
            ))}
          </div>
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1 text-[10px] font-bold rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer">«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 text-[10px] font-bold rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                return start + i;
              }).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 text-[10px] font-bold rounded border transition cursor-pointer ${page === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 text-[10px] font-bold rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2 py-1 text-[10px] font-bold rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer">»</button>
              <span className="text-[10px] text-slate-400 font-mono ml-1">{page}/{totalPages}</span>
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-mono">
            {pageSize === 0 ? filteredTransactions.length : Math.min(page * pageSize, filteredTransactions.length)} de {filteredTransactions.length}
          </span>
        </div>
      )}
    </div>
  );
}
