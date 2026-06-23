import React, { useMemo } from "react";
import { Transaction, TransactionType, TransactionScope, PriorityBill } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface CashFlow90DaysTabProps {
  transactions: Transaction[];
  priorityBills: PriorityBill[];
}

export default function CashFlow90DaysTab({ transactions, priorityBills }: CashFlow90DaysTabProps) {
  const today = new Date();

  const weeks = useMemo(() => {
    const result: { label: string; weekStart: string; income: number; expense: number; projected: boolean }[] = [];

    for (let w = 0; w < 13; w++) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() + w * 7 - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const wsStr = weekStart.toISOString().substring(0, 10);
      const weStr = weekEnd.toISOString().substring(0, 10);
      const isPast = weekEnd < today;
      const projected = weekStart > today;

      // Real transactions in this week
      const weekTxs = transactions.filter(t => t.date >= wsStr && t.date <= weStr);
      const income = weekTxs.filter(t => t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
      const expense = weekTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

      // Future: add bills due in this week
      let projIncome = income;
      let projExpense = expense;

      if (projected) {
        priorityBills.filter(b => !b.paid && b.status === "PAGAR" && b.dueDay && b.month).forEach(b => {
          const dueDate = `${b.month}-${String(b.dueDay).padStart(2, "0")}`;
          if (dueDate >= wsStr && dueDate <= weStr) projExpense += b.amount;
        });
        transactions.filter(t => t.status === "PREVISTO" && t.date >= wsStr && t.date <= weStr).forEach(t => {
          if (t.type === TransactionType.REVENUE) projIncome += t.amount;
          else projExpense += t.amount;
        });
      }

      const day = weekStart.getDate();
      const month = weekStart.toLocaleDateString("pt-BR", { month: "short" });
      result.push({
        label: `${day}/${month.replace(".", "")}`,
        weekStart: wsStr,
        income: projected ? projIncome : income,
        expense: projected ? projExpense : expense,
        projected,
      });
    }
    return result;
  }, [transactions, priorityBills, today.toISOString().substring(0, 10)]);

  // Running balance
  const currentBalance = transactions
    .filter(t => t.status !== "PREVISTO" && t.date <= today.toISOString().substring(0, 10))
    .reduce((s, t) => t.type === TransactionType.REVENUE ? s + t.amount : s - t.amount, 0);

  let runningBalance = currentBalance;
  const weeksWithBalance = weeks.map(w => {
    runningBalance += w.income - w.expense;
    return { ...w, balance: runningBalance };
  });

  const lowestBalance = Math.min(...weeksWithBalance.map(w => w.balance));
  const highestBalance = Math.max(...weeksWithBalance.map(w => w.balance));
  const endBalance = weeksWithBalance[weeksWithBalance.length - 1]?.balance ?? 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const w = weeksWithBalance.find(x => x.label === label);
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[160px]">
        <p className="font-bold border-b border-slate-700 pb-1">Semana de {label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="text-slate-300">{p.name}:</span>
            <span className={`font-bold ${p.name === "Entradas" ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(p.value)}</span>
          </div>
        ))}
        {w && <div className="border-t border-slate-700 pt-1 flex justify-between"><span className="text-slate-400">Saldo acum.:</span><span className={`font-bold ${w.balance >= 0 ? "text-blue-300" : "text-rose-300"}`}>{formatCurrency(w.balance)}</span></div>}
        {w?.projected && <p className="text-[9px] text-amber-400 italic">↗ Projeção</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Saldo Atual</p>
          <h3 className={`text-2xl font-black font-display ${currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCurrency(currentBalance)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">baseado em lançamentos realizados</p>
        </div>
        <div className={`bg-white rounded-2xl border p-5 shadow-xs ${lowestBalance < 0 ? "border-rose-200" : "border-slate-100"}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Menor Saldo (90d)</p>
            {lowestBalance < 0 ? <AlertTriangle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </div>
          <h3 className={`text-2xl font-black font-display ${lowestBalance >= 0 ? "text-blue-600" : "text-rose-600"}`}>{formatCurrency(lowestBalance)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{lowestBalance < 0 ? "⚠️ Saldo negativo projetado!" : "Sem risco de saldo negativo"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Saldo em 90 Dias</p>
          <h3 className={`text-2xl font-black font-display ${endBalance >= 0 ? "text-indigo-600" : "text-rose-600"}`}>{formatCurrency(endBalance)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">projeção com bills e previstos</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Fluxo de Caixa Projetado</p>
            <h3 className="text-sm font-bold text-slate-900">Próximas 13 Semanas (90 dias)</h3>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />Entradas</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-400 inline-block" />Saídas</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-amber-400 bg-amber-50 inline-block" />Projeção</span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeksWithBalance} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "#94a3b8" }} />
              <YAxis tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "#94a3b8" }}
                tickFormatter={v => `R$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
              <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={20}
                fillOpacity={(entry: any) => entry?.projected ? 0.4 : 1} />
              <Bar dataKey="expense" name="Saídas" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={20}
                fillOpacity={(entry: any) => entry?.projected ? 0.4 : 1} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 text-center font-mono italic">
          Barras sólidas = realizados · Barras transparentes = projeção (bills + previstos)
        </p>
      </div>

      {/* Weekly table */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs overflow-x-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-3">Detalhe Semanal</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th className="py-2 px-3 text-left">Semana</th>
              <th className="py-2 px-3 text-right">Entradas</th>
              <th className="py-2 px-3 text-right">Saídas</th>
              <th className="py-2 px-3 text-right">Líquido</th>
              <th className="py-2 px-3 text-right">Saldo Acum.</th>
              <th className="py-2 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {weeksWithBalance.map((w, i) => {
              const net = w.income - w.expense;
              return (
                <tr key={i} className={w.projected ? "bg-amber-50/30" : ""}>
                  <td className="py-2 px-3 font-mono text-slate-600">{w.label}</td>
                  <td className="py-2 px-3 text-right text-emerald-600 font-mono font-semibold">{w.income > 0 ? formatCurrency(w.income) : "—"}</td>
                  <td className="py-2 px-3 text-right text-rose-500 font-mono font-semibold">{w.expense > 0 ? formatCurrency(w.expense) : "—"}</td>
                  <td className={`py-2 px-3 text-right font-mono font-bold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {net >= 0 ? "+" : ""}{formatCurrency(net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono font-bold ${w.balance >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                    {formatCurrency(w.balance)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {w.projected
                      ? <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Projeção</span>
                      : <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Realizado</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
