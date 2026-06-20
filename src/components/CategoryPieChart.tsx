import React from "react";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { FolderHeart, ShieldAlert, Award, Coffee } from "lucide-react";

interface CategoryPieChartProps {
  transactions: Transaction[];
  selectedMonth: string;
}

export default function CategoryPieChart({ transactions, selectedMonth }: CategoryPieChartProps) {
  // Filter for realized expenses in current month
  const expenses = transactions.filter((t) => {
    const matchesMonth = selectedMonth === "ALL" || t.date.substring(0, 7) === selectedMonth;
    return matchesMonth && t.type === TransactionType.EXPENSE && t.status !== "PREVISTO";
  });

  // Separate professional list and personal list
  const profExpenses = expenses.filter((e) => e.scope === TransactionScope.PROFESSIONAL);
  const persExpenses = expenses.filter((e) => e.scope === TransactionScope.PERSONAL);

  const sumByGroupAndCategory = (txList: Transaction[]) => {
    const map: Record<string, number> = {};
    let total = 0;
    txList.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
      total += e.amount;
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

  const profStats = sumByGroupAndCategory(profExpenses);
  const persStats = sumByGroupAndCategory(persExpenses);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Color generator for category lines
  const getProgressColorClass = (index: number, scope: TransactionScope) => {
    if (scope === TransactionScope.PROFESSIONAL) {
      const colors = ["bg-[#2563eb]", "bg-blue-500", "bg-sky-500", "bg-blue-400", "bg-blue-300"];
      return colors[index % colors.length];
    } else {
      const colors = ["bg-[#8b5cf6]", "bg-violet-500", "bg-purple-500", "bg-violet-400", "bg-violet-300"];
      return colors[index % colors.length];
    }
  };

  return (
    <div id="category-distribution-panel" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* PROFESSIONAL EXPENSE BREAKDOWN */}
      <div id="prof-expense-breakdown" className="bg-white rounded-lg border border-[#e2e8f0] p-4 shadow-2xs">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-widest font-mono">Consumo Escritório (PJ)</span>
            <h4 className="text-sm font-bold text-[#1e293b] flex items-center gap-1.5">
              Custos Operacionais
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
            Total: {formatCurrency(profStats.total)}
          </span>
        </div>

        <div className="space-y-3.5 min-h-[180px]">
          {profStats.list.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <Coffee className="w-7 h-7 text-slate-300 mb-1.5" />
              <span>Nenhuma despesa de escritório lançada neste ciclo.</span>
            </div>
          ) : (
            profStats.list.map((item, idx) => {
              const itemExpenses = profExpenses
                .filter((e) => e.category === item.category)
                .sort((a, b) => b.amount - a.amount);

              return (
                <div 
                  id={`prof-cat-${idx}`} 
                  key={item.category} 
                  className="space-y-1 relative group cursor-help p-1.5 hover:bg-blue-50/40 rounded-md transition-all"
                >
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-[65%] group-hover:text-blue-600 transition-colors">{item.category}</span>
                    <span className="text-slate-500 flex-shrink-0 font-mono text-[11px] font-medium">
                      {formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(idx, TransactionScope.PROFESSIONAL)}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  {/* HOVER TOOLTIP WITH TRANSACTION DETAILS */}
                  <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-2 top-full z-50 hidden group-hover:block w-72 bg-slate-900 border border-slate-700 text-white rounded-lg p-3 shadow-xl pointer-events-none transition-all duration-150">
                    <div className="border-b border-slate-700 pb-1.5 mb-2 flex justify-between items-center">
                      <span className="font-bold text-[10px] uppercase text-sky-400 tracking-wider">Despesas em {item.category}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">{itemExpenses.length} lancs</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-[10.5px]">
                      {itemExpenses.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-start gap-2 border-b border-slate-800/50 pb-1 last:border-0 last:pb-0">
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-mono mr-1.5">{tx.date.split("-").reverse().slice(0, 2).join("/")}</span>
                            <span className="text-slate-200 font-medium truncate">{tx.description}</span>
                          </div>
                          <span className="font-mono text-amber-300 font-bold ml-auto shrink-0">{formatCurrency(tx.amount)}</span>
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

      {/* PERSONAL EXPENSE BREAKDOWN */}
      <div id="pers-expense-breakdown" className="bg-white rounded-lg border border-[#e2e8f0] p-4 shadow-2xs">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-widest font-mono">Consumo Pessoal (PF)</span>
            <h4 className="text-sm font-bold text-[#1e293b] flex items-center gap-1.5">
              Gastos Particulares de Sócios
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded">
            Total: {formatCurrency(persStats.total)}
          </span>
        </div>

        <div className="space-y-3.5 min-h-[180px]">
          {persStats.list.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <FolderHeart className="w-7 h-7 text-slate-300 mb-1.5" />
              <span>Nenhum gasto pessoal verificado no período.</span>
            </div>
          ) : (
            persStats.list.map((item, idx) => {
              const itemExpenses = persExpenses
                .filter((e) => e.category === item.category)
                .sort((a, b) => b.amount - a.amount);

              return (
                <div 
                  id={`pers-cat-${idx}`} 
                  key={item.category} 
                  className="space-y-1 relative group cursor-help p-1.5 hover:bg-violet-50/40 rounded-md transition-all"
                >
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-[65%] group-hover:text-violet-600 transition-colors">{item.category}</span>
                    <span className="text-slate-500 flex-shrink-0 font-mono text-[11px] font-medium">
                      {formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(idx, TransactionScope.PERSONAL)}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  {/* HOVER TOOLTIP WITH TRANSACTION DETAILS */}
                  <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-2 top-full z-50 hidden group-hover:block w-72 bg-slate-900 border border-slate-700 text-white rounded-lg p-3 shadow-xl pointer-events-none transition-all duration-150">
                    <div className="border-b border-slate-700 pb-1.5 mb-2 flex justify-between items-center">
                      <span className="font-bold text-[10px] uppercase text-violet-400 tracking-wider">Despesas em {item.category}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">{itemExpenses.length} lancs</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-[10.5px]">
                      {itemExpenses.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-start gap-2 border-b border-slate-800/50 pb-1 last:border-0 last:pb-0">
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-mono mr-1.5">{tx.date.split("-").reverse().slice(0, 2).join("/")}</span>
                            <span className="text-slate-200 font-medium truncate">{tx.description}</span>
                          </div>
                          <span className="font-mono text-amber-300 font-bold ml-auto shrink-0">{formatCurrency(tx.amount)}</span>
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
  );
}
