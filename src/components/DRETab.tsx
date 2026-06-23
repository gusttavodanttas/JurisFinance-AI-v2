import React, { useState } from "react";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { Printer } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface DRETabProps {
  transactions: Transaction[];
}

const PT_MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function DRETab({ transactions }: DRETabProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showComparison, setShowComparison] = useState(false);

  const prevYear = year - 1;
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const prevMonths = Array.from({ length: 12 }, (_, i) => `${prevYear}-${String(i + 1).padStart(2, "0")}`);
  const availableYears = Array.from(new Set(transactions.map(t => t.date?.substring(0, 4)).filter(Boolean))).sort().reverse();

  const calc = (month: string) => {
    const txs = transactions.filter(t => t.date?.substring(0, 7) === month && t.status !== "PREVISTO");
    const profRev = txs.filter(t => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
    const persRev = txs.filter(t => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
    const profExp = txs.filter(t => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const persExp = txs.filter(t => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const taxes = txs.filter(t => t.category?.toLowerCase().includes("imposto") || t.category?.toLowerCase().includes("simples")).reduce((s, t) => s + t.amount, 0);
    const grossRev = profRev + persRev;
    const netRev = grossRev - taxes;
    const totalExp = profExp + persExp - taxes;
    const ebitda = netRev - totalExp;
    return { profRev, persRev, grossRev, taxes, netRev, profExp, persExp, totalExp, ebitda };
  };

  const monthData = months.map(m => ({ month: m, ...calc(m) }));
  const prevMonthData = prevMonths.map(m => ({ month: m, ...calc(m) }));
  const prevTotals = prevMonthData.reduce((acc, m) => ({
    profRev: acc.profRev + m.profRev,
    persRev: acc.persRev + m.persRev,
    grossRev: acc.grossRev + m.grossRev,
    taxes: acc.taxes + m.taxes,
    netRev: acc.netRev + m.netRev,
    profExp: acc.profExp + m.profExp,
    persExp: acc.persExp + m.persExp,
    totalExp: acc.totalExp + m.totalExp,
    ebitda: acc.ebitda + m.ebitda,
  }), { profRev: 0, persRev: 0, grossRev: 0, taxes: 0, netRev: 0, profExp: 0, persExp: 0, totalExp: 0, ebitda: 0 });
  const totals = monthData.reduce((acc, m) => ({
    profRev: acc.profRev + m.profRev,
    persRev: acc.persRev + m.persRev,
    grossRev: acc.grossRev + m.grossRev,
    taxes: acc.taxes + m.taxes,
    netRev: acc.netRev + m.netRev,
    profExp: acc.profExp + m.profExp,
    persExp: acc.persExp + m.persExp,
    totalExp: acc.totalExp + m.totalExp,
    ebitda: acc.ebitda + m.ebitda,
  }), { profRev: 0, persRev: 0, grossRev: 0, taxes: 0, netRev: 0, profExp: 0, persExp: 0, totalExp: 0, ebitda: 0 });

  const rows: { key: keyof typeof totals; label: string; indent?: boolean; highlight?: boolean; border?: boolean }[] = [
    { key: "profRev", label: "Honorários e Receitas PJ", indent: true },
    { key: "persRev", label: "Receitas Pessoais PF", indent: true },
    { key: "grossRev", label: "RECEITA BRUTA TOTAL", highlight: true },
    { key: "taxes", label: "(-) Impostos e Tributos", indent: true },
    { key: "netRev", label: "RECEITA LÍQUIDA", highlight: true, border: true },
    { key: "profExp", label: "Despesas Operacionais PJ", indent: true },
    { key: "persExp", label: "Despesas Pessoais PF", indent: true },
    { key: "totalExp", label: "TOTAL DE DESPESAS", highlight: true },
    { key: "ebitda", label: "RESULTADO LÍQUIDO (EBITDA)", highlight: true, border: true },
  ];

  const fmt = (v: number, key: string) => {
    const negative = ["taxes", "profExp", "persExp", "totalExp"].includes(key);
    const color = key === "ebitda" ? (v >= 0 ? "text-emerald-700" : "text-rose-700") : negative ? "text-rose-600" : "text-slate-700";
    return <span className={`font-mono ${color}`}>{negative && v > 0 ? "(" + formatCurrency(v) + ")" : formatCurrency(v)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Demonstração de Resultado</p>
            <h3 className="text-sm font-bold text-slate-900">DRE Simplificado — Exercício {year}</h3>
          </div>
          <div className="flex items-center gap-2">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white font-mono">
              {(availableYears.length > 0 ? availableYears : [String(currentYear)]).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button onClick={() => setShowComparison(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer border transition-colors ${showComparison ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"}`}>
              ± vs {prevYear}
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono w-52">Linha DRE</th>
                {PT_MONTHS_SHORT.map((m, i) => (
                  <th key={m} className="py-2.5 px-2 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono whitespace-nowrap">{m}</th>
                ))}
                <th className="py-2.5 px-3 text-right text-[9px] font-bold text-indigo-600 uppercase tracking-wider font-mono">TOTAL {year}</th>
                {showComparison && <>
                  <th className="py-2.5 px-3 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">{prevYear}</th>
                  <th className="py-2.5 px-3 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">VAR %</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, label, indent, highlight, border }) => {
                const prev = prevTotals[key] as number;
                const curr = totals[key] as number;
                const varPct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null;
                return (
                <tr key={key} className={`${border ? "border-t-2 border-slate-200" : "border-t border-slate-50"} ${highlight ? "bg-slate-50 font-bold" : "hover:bg-slate-50/50"}`}>
                  <td className={`py-2 px-3 text-slate-700 whitespace-nowrap ${indent ? "pl-6 text-slate-500 font-normal" : "font-bold text-[10px] uppercase tracking-wide text-slate-700"}`}>
                    {label}
                  </td>
                  {monthData.map(m => (
                    <td key={m.month} className="py-2 px-2 text-right text-[10px]">
                      {(m[key] as number) !== 0 ? fmt(m[key] as number, key) : <span className="text-slate-200 font-mono">—</span>}
                    </td>
                  ))}
                  <td className={`py-2 px-3 text-right text-[10px] ${highlight ? "font-black" : ""}`}>
                    {curr !== 0 ? fmt(curr, key) : <span className="text-slate-200 font-mono">—</span>}
                  </td>
                  {showComparison && <>
                    <td className="py-2 px-3 text-right text-[10px] text-slate-400 font-mono">
                      {prev !== 0 ? fmt(prev, key) : <span className="text-slate-200">—</span>}
                    </td>
                    <td className="py-2 px-3 text-right text-[10px] font-bold font-mono">
                      {varPct !== null
                        ? <span className={varPct >= 0 ? "text-emerald-600" : "text-rose-600"}>{varPct >= 0 ? "+" : ""}{varPct.toFixed(1)}%</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                  </>}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[9px] text-slate-400 mt-3 italic font-mono">
          * DRE baseado nos lançamentos REALIZADOS cadastrados no Livro Caixa. Impostos são identificados pela categoria "Impostos" ou "Simples Nacional".
        </p>
      </div>

      {/* Annual summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Receita Bruta Anual", value: totals.grossRev, color: "text-emerald-600" },
          { label: "Despesas Totais", value: totals.totalExp, color: "text-rose-600" },
          { label: "Resultado Líquido", value: totals.ebitda, color: totals.ebitda >= 0 ? "text-blue-600" : "text-rose-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">{label}</p>
            <h3 className={`text-2xl font-black font-display ${color}`}>{formatCurrency(value)}</h3>
            {label === "Resultado Líquido" && totals.grossRev > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">Margem: {((totals.ebitda / totals.grossRev) * 100).toFixed(1)}%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
