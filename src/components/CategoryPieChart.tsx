import React, { useState } from "react";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { 
  FolderHeart, 
  Coffee, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  User, 
  ArrowUpRight, 
  ArrowDownRight,
  HelpCircle
} from "lucide-react";

interface CategoryPieChartProps {
  transactions: Transaction[];
  selectedMonth: string;
}

export default function CategoryPieChart({ transactions, selectedMonth }: CategoryPieChartProps) {
  const [viewType, setViewType] = useState<TransactionType>(TransactionType.EXPENSE);

  // Filter for realized transactions in current month based on selected viewType (EXPENSE or REVENUE)
  const filteredTx = transactions.filter((t) => {
    const matchesMonth = selectedMonth === "ALL" || t.date.substring(0, 7) === selectedMonth;
    return matchesMonth && t.type === viewType && t.status !== "PREVISTO";
  });

  // Separate professional list and personal list
  const profTx = filteredTx.filter((t) => t.scope === TransactionScope.PROFESSIONAL);
  const persTx = filteredTx.filter((t) => t.scope === TransactionScope.PERSONAL);

  const sumByGroupAndCategory = (txList: Transaction[]) => {
    const map: Record<string, number> = {};
    let total = 0;
    txList.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
      total += t.amount;
    });

    const list = Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));

    // Sort descending
    return {
      list: list.sort((a, b) => b.amount - a.amount),
      total,
    };
  };

  const profStats = sumByGroupAndCategory(profTx);
  const persStats = sumByGroupAndCategory(persTx);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Color generator for category lines
  const getProgressColorClass = (index: number, scope: TransactionScope, type: TransactionType) => {
    if (type === TransactionType.REVENUE) {
      const colors = ["bg-emerald-600", "bg-emerald-500", "bg-teal-500", "bg-emerald-400", "bg-teal-400"];
      return colors[index % colors.length];
    } else {
      if (scope === TransactionScope.PROFESSIONAL) {
        const colors = ["bg-blue-600", "bg-blue-500", "bg-sky-500", "bg-blue-400", "bg-sky-400"];
        return colors[index % colors.length];
      } else {
        const colors = ["bg-violet-600", "bg-violet-500", "bg-purple-500", "bg-violet-400", "bg-purple-400"];
        return colors[index % colors.length];
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector tab for Despesas vs Receitas */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-3xs">
        <span className="text-xs font-bold text-slate-700 font-sans">Visualizar por Categoria:</span>
        
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setViewType(TransactionType.EXPENSE)}
            className={`flex items-center gap-1.5 py-1 px-3.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewType === TransactionType.EXPENSE
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Despesas
          </button>
          <button
            type="button"
            onClick={() => setViewType(TransactionType.REVENUE)}
            className={`flex items-center gap-1.5 py-1 px-3.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewType === TransactionType.REVENUE
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Receitas
          </button>
        </div>
      </div>

      <div id="category-distribution-panel" className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left">
        {/* COLUMN 1: PROFESSIONAL SCOPE (PJ) */}
        <div id="prof-expense-breakdown" className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-3xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${viewType === TransactionType.REVENUE ? "text-emerald-600" : "text-[#2563eb]"}`}>
                {viewType === TransactionType.REVENUE ? "Faturamento Escritório (PJ)" : "Consumo Escritório (PJ)"}
              </span>
              <h4 className="text-sm font-bold text-[#1e293b] flex items-center gap-1.5 font-sans mt-0.5">
                {viewType === TransactionType.REVENUE ? (
                  <>
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                    Receitas Operacionais
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    Custos Operacionais
                  </>
                )}
              </h4>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${viewType === TransactionType.REVENUE ? "text-emerald-700 bg-emerald-50" : "text-blue-700 bg-blue-50"}`}>
              Total: {formatCurrency(profStats.total)}
            </span>
          </div>

          <div className="space-y-3.5 min-h-[180px]">
            {profStats.list.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs text-center border border-dashed border-slate-200 rounded-xl">
                <Coffee className="w-6 h-6 text-slate-300 mb-1.5" />
                <span>
                  {viewType === TransactionType.REVENUE 
                    ? "Nenhuma receita de escritório registrada neste ciclo." 
                    : "Nenhuma despesa de escritório lançada neste ciclo."}
                </span>
              </div>
            ) : (
              profStats.list.map((item, idx) => {
                const itemTx = profTx
                  .filter((t) => t.category === item.category)
                  .sort((a, b) => b.amount - a.amount);

                return (
                  <div 
                    id={`prof-cat-${idx}`} 
                    key={item.category} 
                    className="space-y-1 relative group cursor-help p-1.5 hover:bg-slate-50 rounded-md transition-all"
                  >
                    <div className="flex justify-between text-xs font-semibold text-slate-700 font-sans">
                      <span className="truncate max-w-[65%] group-hover:text-indigo-600 transition-colors">{item.category}</span>
                      <span className="text-slate-500 flex-shrink-0 font-mono text-[11px] font-medium">
                        {formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(idx, TransactionScope.PROFESSIONAL, viewType)}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    {/* HOVER TOOLTIP WITH TRANSACTION DETAILS */}
                    <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-2 top-full z-50 hidden group-hover:block w-72 bg-slate-900 border border-slate-700 text-white rounded-lg p-3 shadow-xl pointer-events-none transition-all duration-150">
                      <div className="border-b border-slate-700 pb-1.5 mb-2 flex justify-between items-center">
                        <span className="font-bold text-[10px] uppercase text-sky-400 tracking-wider">
                          {viewType === TransactionType.REVENUE ? "Receitas em" : "Despesas em"} {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">{itemTx.length} lancs</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-[10.5px]">
                        {itemTx.map((tx) => (
                          <div key={tx.id} className="flex justify-between items-start gap-2 border-b border-slate-800/50 pb-1 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <span className="text-[9px] text-slate-400 font-mono mr-1.5">{tx.date.split("-").reverse().slice(0, 2).join("/")}</span>
                              <span className="text-slate-200 font-medium truncate">{tx.description}</span>
                            </div>
                            <span className={`font-mono font-bold ml-auto shrink-0 ${viewType === TransactionType.REVENUE ? "text-emerald-400" : "text-amber-300"}`}>{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: PERSONAL SCOPE (PF) */}
        <div id="pers-expense-breakdown" className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-3xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${viewType === TransactionType.REVENUE ? "text-emerald-600" : "text-[#8b5cf6]"}`}>
                {viewType === TransactionType.REVENUE ? "Rendimentos Pessoais (PF)" : "Consumo Pessoal (PF)"}
              </span>
              <h4 className="text-sm font-bold text-[#1e293b] flex items-center gap-1.5 font-sans mt-0.5">
                {viewType === TransactionType.REVENUE ? (
                  <>
                    <User className="w-4 h-4 text-emerald-500" />
                    Entradas Particulares
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-violet-500" />
                    Gastos Particulares de Sócios
                  </>
                )}
              </h4>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${viewType === TransactionType.REVENUE ? "text-emerald-700 bg-emerald-50" : "text-violet-700 bg-violet-50"}`}>
              Total: {formatCurrency(persStats.total)}
            </span>
          </div>

          <div className="space-y-3.5 min-h-[180px]">
            {persStats.list.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs text-center border border-dashed border-slate-200 rounded-xl">
                <FolderHeart className="w-6 h-6 text-slate-300 mb-1.5" />
                <span>
                  {viewType === TransactionType.REVENUE 
                    ? "Nenhum rendimento pessoal verificado no período." 
                    : "Nenhum gasto pessoal verificado no período."}
                </span>
              </div>
            ) : (
              persStats.list.map((item, idx) => {
                const itemTx = persTx
                  .filter((t) => t.category === item.category)
                  .sort((a, b) => b.amount - a.amount);

                return (
                  <div 
                    id={`pers-cat-${idx}`} 
                    key={item.category} 
                    className="space-y-1 relative group cursor-help p-1.5 hover:bg-slate-50 rounded-md transition-all"
                  >
                    <div className="flex justify-between text-xs font-semibold text-slate-700 font-sans">
                      <span className="truncate max-w-[65%] group-hover:text-indigo-600 transition-colors">{item.category}</span>
                      <span className="text-slate-500 flex-shrink-0 font-mono text-[11px] font-medium">
                        {formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(idx, TransactionScope.PERSONAL, viewType)}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    {/* HOVER TOOLTIP WITH TRANSACTION DETAILS */}
                    <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-2 top-full z-50 hidden group-hover:block w-72 bg-slate-900 border border-slate-700 text-white rounded-lg p-3 shadow-xl pointer-events-none transition-all duration-150">
                      <div className="border-b border-slate-700 pb-1.5 mb-2 flex justify-between items-center">
                        <span className="font-bold text-[10px] uppercase text-violet-400 tracking-wider">
                          {viewType === TransactionType.REVENUE ? "Entradas em" : "Gastos em"} {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">{itemTx.length} lancs</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-[10.5px]">
                        {itemTx.map((tx) => (
                          <div key={tx.id} className="flex justify-between items-start gap-2 border-b border-slate-800/50 pb-1 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <span className="text-[9px] text-slate-400 font-mono mr-1.5">{tx.date.split("-").reverse().slice(0, 2).join("/")}</span>
                              <span className="text-slate-200 font-medium truncate">{tx.description}</span>
                            </div>
                            <span className={`font-mono font-bold ml-auto shrink-0 ${viewType === TransactionType.REVENUE ? "text-emerald-400" : "text-amber-300"}`}>{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
