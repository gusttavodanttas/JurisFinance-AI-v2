import React, { useMemo, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { Calendar, CheckCircle2, AlertCircle, Landmark, Wallet } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface ForecastComparisonProps {
  transactions: Transaction[];
  selectedMonth: string;
  onConfirmTransaction: (id: string) => void;
}

export default function ForecastComparison({
  transactions,
  selectedMonth,
  onConfirmTransaction,
}: ForecastComparisonProps) {
  // Filter transactions belonging to selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedMonth === "ALL") return true;
      return t.date.substring(0, 7) === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Aggregate metrics
  const stats = useMemo(() => {
    let pjRevReal = 0;
    let pjRevPrev = 0;
    let pjExpReal = 0;
    let pjExpPrev = 0;

    let pfRevReal = 0;
    let pfRevPrev = 0;
    let pfExpReal = 0;
    let pfExpPrev = 0;

    monthTransactions.forEach((t) => {
      const isRevenue = t.type === TransactionType.REVENUE;
      const isExpense = t.type === TransactionType.EXPENSE;
      const isRealized = t.status !== "PREVISTO"; // Default to realized

      if (t.scope === TransactionScope.PROFESSIONAL) {
        if (isRevenue) {
          pjRevPrev += t.amount;
          if (isRealized) pjRevReal += t.amount;
        } else if (isExpense) {
          pjExpPrev += t.amount;
          if (isRealized) pjExpReal += t.amount;
        }
      } else {
        if (isRevenue) {
          pfRevPrev += t.amount;
          if (isRealized) pfRevReal += t.amount;
        } else if (isExpense) {
          pfExpPrev += t.amount;
          if (isRealized) pfExpReal += t.amount;
        }
      }
    });

    return {
      pjRevReal,
      pjRevPrev,
      pjExpReal,
      pjExpPrev,
      pfRevReal,
      pfRevPrev,
      pfExpReal,
      pfExpPrev,
    };
  }, [monthTransactions]);

  // Find pending items
  const pendingTransactions = useMemo(() => {
    return monthTransactions.filter((t) => t.status === "PREVISTO");
  }, [monthTransactions]);

  const [catScope, setCatScope] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);

  const categoryStats = useMemo(() => {
    const previstoMap: Record<string, number> = {};
    const realizadoMap: Record<string, number> = {};
    const categoriesSet = new Set<string>();

    monthTransactions
      .filter((t) => t.scope === catScope)
      .forEach((t) => {
        categoriesSet.add(t.category);
        previstoMap[t.category] = (previstoMap[t.category] || 0) + t.amount;
        if (t.status !== "PREVISTO") {
          realizadoMap[t.category] = (realizadoMap[t.category] || 0) + t.amount;
        }
      });

    return Array.from(categoriesSet).map((cat) => {
      const prev = previstoMap[cat] || 0;
      const real = realizadoMap[cat] || 0;
      return {
        name: cat,
        Previsto: prev,
        Realizado: real,
        Desvio: prev - real,
        Progresso: prev > 0 ? (real / prev) * 100 : 0
      };
    }).sort((a, b) => b.Previsto - a.Previsto);
  }, [monthTransactions, catScope]);


  const getPercentage = (real: number, prev: number) => {
    if (prev === 0) return real > 0 ? 100 : 0;
    return (real / prev) * 100;
  };

  // Recharts structured data
  const chartData = [
    {
      name: "Fat. PJ (Rec)",
      "Previsto (Meta)": stats.pjRevPrev,
      "Realizado (Faturado)": stats.pjRevReal,
    },
    {
      name: "Custos PJ (Desp)",
      "Previsto (Orçado)": stats.pjExpPrev,
      "Realizado (Pago)": stats.pjExpReal,
    },
    {
      name: "Rends PF (Rec)",
      "Previsto (Meta)": stats.pfRevPrev,
      "Realizado (Recebido)": stats.pfRevReal,
    },
    {
      name: "Gastos PF (Desp)",
      "Previsto (Orçado)": stats.pfExpPrev,
      "Realizado (Pago)": stats.pfExpReal,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1.5 font-sans">
          <p className="font-bold border-b border-slate-800 pb-1 text-slate-300">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between gap-6 items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.fill }} />
                {p.name}:
              </span>
              <span className="font-semibold text-white">
                {formatCurrency(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getMonthTitle = () => {
    if (selectedMonth === "ALL") return "Todos os Períodos";
    const [year, month] = selectedMonth.split("-");
    const ptMonths = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${ptMonths[parseInt(month) - 1]} de ${year}`;
  };

  return (
    <div className="space-y-6 animate-slide-up" id="forecast-comparison-view">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PJ Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Faturamento Escritório (PJ)</span>
              <Landmark className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="space-y-1 text-left">
              <p className="text-xs text-slate-500">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(stats.pjRevReal)}</strong></p>
              <p className="text-xs text-slate-500">Previsto: <strong className="text-slate-700 font-mono">{formatCurrency(stats.pjRevPrev)}</strong></p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Progresso Recebimento</span>
            <span className="text-xs font-bold text-indigo-600 font-mono">{getPercentage(stats.pjRevReal, stats.pjRevPrev).toFixed(0)}%</span>
          </div>
        </div>

        {/* PJ Expense */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Custos Operacionais (PJ)</span>
              <Landmark className="w-4 h-4 text-rose-500" />
            </div>
            <div className="space-y-1 text-left">
              <p className="text-xs text-slate-500">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(stats.pjExpReal)}</strong></p>
              <p className="text-xs text-slate-500">Previsto: <strong className="text-slate-700 font-mono">{formatCurrency(stats.pjExpPrev)}</strong></p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Progresso Pagamento</span>
            <span className="text-xs font-bold text-rose-600 font-mono">{getPercentage(stats.pjExpReal, stats.pjExpPrev).toFixed(0)}%</span>
          </div>
        </div>

        {/* PF Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Rendimentos Pessoais (PF)</span>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-1 text-left">
              <p className="text-xs text-slate-500">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(stats.pfRevReal)}</strong></p>
              <p className="text-xs text-slate-500">Previsto: <strong className="text-slate-700 font-mono">{formatCurrency(stats.pfRevPrev)}</strong></p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Progresso Recebimento</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">{getPercentage(stats.pfRevReal, stats.pfRevPrev).toFixed(0)}%</span>
          </div>
        </div>

        {/* PF Expense */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Despesas Pessoais (PF)</span>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <div className="space-y-1 text-left">
              <p className="text-xs text-slate-500">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(stats.pfExpReal)}</strong></p>
              <p className="text-xs text-slate-500">Previsto: <strong className="text-slate-700 font-mono">{formatCurrency(stats.pfExpPrev)}</strong></p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Progresso Pagamento</span>
            <span className="text-xs font-bold text-amber-600 font-mono">{getPercentage(stats.pfExpReal, stats.pfExpPrev).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs text-left">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-sans">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Análise Orçamentária - {getMonthTitle()}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">Comparação entre o planejado/meta (Previsto) e o efetivamente liquidado (Realizado)</p>
        </div>

        <div className="h-72 w-full font-sans">
          {monthTransactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              Sem dados disponíveis para gerar o gráfico comparativo no período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={10} 
                  tick={{ fill: "#64748b", fontWeight: 600 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={10} 
                  tick={{ fill: "#64748b" }}
                  tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000) + 'k' : v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 6, fontSize: 10, fontWeight: 500 }} />
                
                <Bar 
                  dataKey="Previsto (Meta)" 
                  fill="#c7d2fe" 
                  name="Previsto (Orçado/Meta)"
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                />
                <Bar 
                  dataKey="Realizado (Faturado)" 
                  fill="#10b981" 
                  name="Realizado (Efetivado)"
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Level Comparison */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs text-left font-sans space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-sans">
              <Landmark className="w-4 h-4 text-indigo-500" />
              Comparativo de Categorias: Previsto x Realizado
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Análise detalhada por categoria contábil para o escopo selecionado</p>
          </div>
          
          {/* Scope selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setCatScope(TransactionScope.PROFESSIONAL)}
              className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                catScope === TransactionScope.PROFESSIONAL
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Escritório (PJ)
            </button>
            <button
              type="button"
              onClick={() => setCatScope(TransactionScope.PERSONAL)}
              className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                catScope === TransactionScope.PERSONAL
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pessoal (PF)
            </button>
          </div>
        </div>

        {/* Category Chart & Table */}
        {categoryStats.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            Sem lançamentos de categorias para comparar neste período.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryStats}
                  layout="vertical"
                  margin={{ left: 15, right: 10, top: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={140} 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => v.substring(0, 25)} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="Previsto" fill="#c7d2fe" radius={[0, 4, 4, 0]} maxBarSize={12} />
                  <Bar dataKey="Realizado" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {categoryStats.map((item) => (
                <div key={item.name} className="p-2 bg-slate-50/50 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span className="truncate max-w-[60%]">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatCurrency(item.Realizado)} / {formatCurrency(item.Previsto)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        catScope === TransactionScope.PROFESSIONAL ? "bg-indigo-600" : "bg-violet-600"
                      }`}
                      style={{ width: `${Math.min(item.Progresso, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>Progresso: {item.Progresso.toFixed(0)}%</span>
                    <span>Pendente: {formatCurrency(item.Desvio)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending / Forecasted Transactions Reconciliation List */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs text-left font-sans">
        <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Lançamentos Previstos Pendentes ({pendingTransactions.length})
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Contas a pagar e honorários a receber previstos para este mês. Confirme-os para computar no saldo.</p>
          </div>
        </div>

        {pendingTransactions.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-slate-700">Tudo em dia!</p>
            <p className="text-[11px] text-slate-400 max-w-sm">Nenhum lançamento previsto pendente de conciliação para este mês. Todos foram realizados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            {/* Desktop Table View */}
            <table className="w-full border-collapse text-left text-xs text-slate-600 hidden md:table">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50 text-[9px] font-mono">
                  <th className="py-2 px-3 text-center">Vencimento</th>
                  <th className="py-2 px-3">Escopo</th>
                  <th className="py-2 px-3">Fluxo</th>
                  <th className="py-2 px-3">Descrição</th>
                  <th className="py-2 px-3">Categoria</th>
                  <th className="py-2 px-3 text-right">Valor</th>
                  <th className="py-2 px-3 text-center">Liquidar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pendingTransactions.map((tx) => {
                  const isProf = tx.scope === TransactionScope.PROFESSIONAL;
                  const isRevenue = tx.type === TransactionType.REVENUE;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2 px-3 font-mono font-medium text-slate-500 text-center">
                        {tx.date.split("-").reverse().join("/")}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          isProf 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                            : "bg-sky-50 text-sky-700 border-sky-100"
                        }`}>
                          {isProf ? "PJ" : "PF"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold">
                        <span className={isRevenue ? "text-emerald-600" : "text-rose-500"}>
                          {isRevenue ? "A Receber" : "A Pagar"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">{tx.description}</td>
                      <td className="py-2 px-3 text-slate-500">{tx.category}</td>
                      <td className="py-2 px-3 text-right font-semibold font-mono">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onConfirmTransaction(tx.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-all cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Liquidado
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-slate-100 bg-white">
              {pendingTransactions.map((tx) => {
                const isProf = tx.scope === TransactionScope.PROFESSIONAL;
                const isRevenue = tx.type === TransactionType.REVENUE;
                return (
                  <div key={tx.id} className="p-3 space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{tx.date.split("-").reverse().join("/")}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        isProf 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                          : "bg-sky-50 text-sky-700 border-sky-100"
                      }`}>
                        {isProf ? "PJ Escritório" : "PF Pessoal"}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-xs">{tx.description}</h4>
                      <p className="text-[10px] text-slate-400">{tx.category} • <span className={isRevenue ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{isRevenue ? "A receber" : "A pagar"}</span></p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-bold font-mono text-slate-800">{formatCurrency(tx.amount)}</span>
                      <button
                        type="button"
                        onClick={() => onConfirmTransaction(tx.id)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Liquidar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
