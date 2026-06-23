import React, { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from "recharts";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { Calendar, Briefcase, User } from "lucide-react";

interface CashFlowChartProps {
  transactions: Transaction[];
}

export default function CashFlowChart({ transactions }: CashFlowChartProps) {
  const [activeTab, setActiveTab] = useState<"professional" | "comparison">("professional");

  // Group transactions by month
  // We'll extract unique months and sort them
  const monthsSet = new Set<string>();
  transactions.forEach((t) => {
    monthsSet.add(t.date.substring(0, 7)); // "YYYY-MM"
  });

  const sortedMonths = Array.from(monthsSet).sort();

  // Map month string to a friendly name
  const monthLabels: Record<string, string> = {
    "2026-01": "Jan/26",
    "2026-02": "Fev/26",
    "2026-03": "Mar/26",
    "2026-04": "Abr/26",
    "2026-05": "Maio/26",
    "2026-06": "Jun/26",
    "2026-07": "Jul/26",
    "2026-08": "Ago/26",
    "2026-09": "Set/26",
    "2026-10": "Out/26",
    "2026-11": "Nov/26",
    "2026-12": "Dez/26",
  };

  const finalData = sortedMonths.map((m) => {
    const allMonthTx = transactions.filter((t) => t.date.substring(0, 7) === m);
    const realizedTx = allMonthTx.filter((t) => t.status !== "PREVISTO");

    let profRevenue = 0, profRevenuePrev = 0;
    let profExpense = 0, profExpensePrev = 0;
    let persRevenue = 0, persRevenuePrev = 0;
    let persExpense = 0, persExpensePrev = 0;

    allMonthTx.forEach((t) => {
      const isPrev = t.status === "PREVISTO";
      const isRev = t.type === TransactionType.REVENUE;
      const isExp = t.type === TransactionType.EXPENSE;
      if (t.scope === TransactionScope.PROFESSIONAL) {
        if (isRev) isPrev ? (profRevenuePrev += t.amount) : (profRevenue += t.amount);
        if (isExp) isPrev ? (profExpensePrev += t.amount) : (profExpense += t.amount);
      } else {
        if (isRev) isPrev ? (persRevenuePrev += t.amount) : (persRevenue += t.amount);
        if (isExp) isPrev ? (persExpensePrev += t.amount) : (persExpense += t.amount);
      }
    });

    const totalProfRev = profRevenue + profRevenuePrev;
    const totalProfExp = profExpense + profExpensePrev;
    const totalPersRev = persRevenue + persRevenuePrev;
    const totalPersExp = persExpense + persExpensePrev;

    return {
      monthKey: m,
      name: monthLabels[m] || m,
      "Faturamento (Receita PJ)": profRevenue,
      "Previsto (Receita PJ)": profRevenuePrev,
      "Gastos Profissionais (Despesa PJ)": profExpense,
      "Previsto (Despesa PJ)": profExpensePrev,
      "Lucro Líquido Escritório": totalProfRev - totalProfExp,
      "Receitas Pessoais (PF)": persRevenue,
      "Previsto (Receita PF)": persRevenuePrev,
      "Despesas Pessoais (PF)": persExpense,
      "Previsto (Despesa PF)": persExpensePrev,
      "Saldo Pessoal": totalPersRev - totalPersExp,
    };
  });

  const formatCurrencyValue = (value: any) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  // Custom tooltips for elegant visual feedback
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1">
          <p className="font-bold border-b border-slate-700 pb-1 mb-1.5">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between gap-6 items-center">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.fill || p.color }} />
                {p.name}:
              </span>
              <span className="font-semibold text-white">
                {formatCurrencyValue(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="cash-flow-chart" className="bg-white rounded-lg border border-[#e2e8f0] p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Consolidado Financeiro</span>
          <h3 className="text-sm font-bold text-[#1e293b]">Evolução do Fluxo de Caixa</h3>
        </div>
 
        {/* Chart View Switcher Tabs */}
        <div className="flex bg-slate-50 border border-[#e2e8f0] p-0.5 rounded-md">
          <button
            id="chart-tab-professional"
            onClick={() => setActiveTab("professional")}
            className={`flex items-center gap-1 py-1 px-2.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "professional"
                ? "bg-white text-[#2563eb] shadow-2xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-3 h-3" />
            Caixa Operacional (PJ)
          </button>
          <button
            id="chart-tab-comparison"
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center gap-1 py-1 px-2.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "comparison"
                ? "bg-white text-[#8b5cf6] shadow-2xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-3 h-3" />
            PJ vs. Pessoal (PF)
          </button>
        </div>
      </div>
 
      <div className="h-64 w-full">
        {finalData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Sem lançamentos suficientes para gerar o gráfico histórico.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "professional" ? (
              <BarChart
                data={finalData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={10} 
                  tick={{ fill: "#64748b" }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={10} 
                  tick={{ fill: "#64748b" }}
                  tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000) + 'k' : v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 6, fontSize: 10 }} />
                
                <Bar dataKey="Faturamento (Receita PJ)" fill="#2563eb" radius={[3,3,0,0]} maxBarSize={28} stackId="rev" />
                <Bar dataKey="Previsto (Receita PJ)" fill="#93c5fd" radius={[3,3,0,0]} maxBarSize={28} stackId="rev" name="A Receber (Previsto)" />
                <Bar dataKey="Gastos Profissionais (Despesa PJ)" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={28} stackId="exp" />
                <Bar dataKey="Previsto (Despesa PJ)" fill="#fca5a5" radius={[3,3,0,0]} maxBarSize={28} stackId="exp" name="A Pagar (Previsto)" />
              </BarChart>
            ) : (
              <AreaChart
                data={finalData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={10} 
                  tick={{ fill: "#64748b" }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={10} 
                  tick={{ fill: "#64748b" }}
                  tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000) + 'k' : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 6, fontSize: 10 }} />
                
                <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                
                <Area type="monotone" dataKey="Lucro Líquido Escritório" name="Resultado PJ (Prev+Real)" stroke="#2563eb" fillOpacity={0.06} fill="url(#colorProf)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Saldo Pessoal" name="Resultado PF (Prev+Real)" stroke="#8b5cf6" fillOpacity={0.06} fill="url(#colorPers)" strokeWidth={1.5} />
                
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
