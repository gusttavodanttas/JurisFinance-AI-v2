import React, { useState, useMemo } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { PieChart as PieIcon, Briefcase, User, HelpCircle, LayoutGrid } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface CategoryChartsViewProps {
  transactions: Transaction[];
  selectedMonth: string;
}

// Curated colors for professional styling
const PJ_EXPENSE_COLORS = ["#2563eb", "#3b82f6", "#06b6d4", "#0284c7", "#1d4ed8", "#0891b2", "#0369a1", "#0284c7", "#38bdf8", "#0f766e"];
const PF_EXPENSE_COLORS = ["#8b5cf6", "#a78bfa", "#d946ef", "#ec4899", "#7c3aed", "#c084fc", "#f472b6", "#be185d", "#e879f9", "#4c1d95"];
const REVENUE_COLORS = ["#10b981", "#059669", "#14b8a6", "#0d9488", "#34d399", "#075985", "#0f766e", "#047857", "#2dd4bf", "#115e59"];

export default function CategoryChartsView({ transactions, selectedMonth }: CategoryChartsViewProps) {
  const [scope, setScope] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Filter transactions by month & scope
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      const matchesMonth = selectedMonth === "ALL" || t.date.substring(0, 7) === selectedMonth;
      return matchesMonth && t.scope === scope;
    });
  }, [transactions, selectedMonth, scope]);

  // Aggregate revenues by category
  const revenueData = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    filteredTx
      .filter((t) => t.type === TransactionType.REVENUE)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
        total += t.amount;
      });

    return {
      list: Object.entries(map)
        .map(([name, value]) => ({ name, value, percentage: total > 0 ? (value / total) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
      total
    };
  }, [filteredTx]);

  // Aggregate expenses by category
  const expenseData = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    filteredTx
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
        total += t.amount;
      });

    return {
      list: Object.entries(map)
        .map(([name, value]) => ({ name, value, percentage: total > 0 ? (value / total) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
      total
    };
  }, [filteredTx]);


  const getMonthTitle = () => {
    if (selectedMonth === "ALL") return "Todos os Períodos";
    const [year, month] = selectedMonth.split("-");
    const ptMonths = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${ptMonths[parseInt(month) - 1]} de ${year}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1.5 font-sans">
          <p className="font-bold border-b border-slate-800 pb-1 text-slate-300">{data.name}</p>
          <div className="flex justify-between gap-6 items-center">
            <span className="text-slate-400">Total:</span>
            <span className="font-semibold text-white">{formatCurrency(data.value, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between gap-6 items-center">
            <span className="text-slate-400">Proporção:</span>
            <span className="font-semibold text-emerald-400">{data.percentage.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveChart = (dataList: any[], colors: string[], title: string, total: number) => {
    if (dataList.length === 0) {
      return (
        <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-xs text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <HelpCircle className="w-6 h-6 text-slate-300 mb-1.5" />
          <span>Nenhum registro localizado no período.</span>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col h-full justify-between">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
            Total: {formatCurrency(total, { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="h-56 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={dataList}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dataList.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={dataList} layout="vertical" margin={{ left: 15, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={140} fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(0, 25)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {dataList.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend List */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {dataList.map((item, idx) => (
            <div key={item.name} className="flex justify-between items-center text-[10px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="font-mono text-slate-500 font-bold shrink-0">{formatCurrency(item.value, { maximumFractionDigits: 0 })} ({item.percentage.toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up" id="category-charts-panel">
      {/* Scope Toggles & Chart Type Options */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs text-left">
        {/* Scope Selector */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setScope(TransactionScope.PROFESSIONAL)}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-md text-xs font-bold transition-all cursor-pointer ${
              scope === TransactionScope.PROFESSIONAL
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Escritório (PJ)
          </button>
          <button
            type="button"
            onClick={() => setScope(TransactionScope.PERSONAL)}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-md text-xs font-bold transition-all cursor-pointer ${
              scope === TransactionScope.PERSONAL
                ? "bg-white text-violet-700 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Pessoal (PF)
          </button>
        </div>

        {/* Chart View type Toggle */}
        <div className="flex items-center gap-2 font-sans">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">Exibição:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setChartType("pie")}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                chartType === "pie"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <PieIcon className="w-3 h-3" />
              Pizza
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                chartType === "bar"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              Barras
            </button>
          </div>
        </div>
      </div>

      {/* Main Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* REVENUE BREAKDOWN */}
        <div>
          {renderActiveChart(
            revenueData.list, 
            REVENUE_COLORS, 
            scope === TransactionScope.PROFESSIONAL ? "Distribuição de Receitas (Faturamento)" : "Distribuição de Rendimentos",
            revenueData.total
          )}
        </div>

        {/* EXPENSE BREAKDOWN */}
        <div>
          {renderActiveChart(
            expenseData.list, 
            scope === TransactionScope.PROFESSIONAL ? PJ_EXPENSE_COLORS : PF_EXPENSE_COLORS, 
            scope === TransactionScope.PROFESSIONAL ? "Distribuição de Despesas (Custos)" : "Distribuição de Gastos",
            expenseData.total
          )}
        </div>
      </div>

      {/* Section Help Banner */}
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-150 text-indigo-900 text-xs flex gap-2.5 text-left font-sans">
        <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Como interpretar seus Gráficos de Categorias?</p>
          <p className="text-indigo-700 leading-relaxed mt-1">Os gráficos mostram a participação percentual de cada categoria contábil em relação ao total faturado ou gasto do mês ({getMonthTitle()}). Isso ajuda você a enxergar imediatamente para onde seu dinheiro está indo e quais categorias de custos (ex: Aluguel, Diligências) ou receitas (ex: Honorários Contratuais) têm maior relevância.</p>
        </div>
      </div>
    </div>
  );
}
