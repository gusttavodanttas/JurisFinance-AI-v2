import React from "react";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { 
  Building2, 
  User, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Scale,
  Landmark,
  Wallet
} from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface DashboardStatsProps {
  transactions: Transaction[];
  selectedMonth: string; // "YYYY-MM" or "ALL"
  monthlyRevenueTarget?: number;
  onSetMonthlyTarget?: (v: number) => void;
}

export default function DashboardStats({ transactions, selectedMonth, monthlyRevenueTarget = 0, onSetMonthlyTarget }: DashboardStatsProps) {
  // Filter transactions for the selected month (both previsto and realized)
  const monthTx = transactions.filter((t) => {
    if (selectedMonth === "ALL") return true;
    return t.date.substring(0, 7) === selectedMonth;
  });

  // Calculate totals
  let pjRevReal = 0;
  let pjRevPrev = 0;
  let pjExpReal = 0;
  let pjExpPrev = 0;

  let pfRevReal = 0;
  let pfRevPrev = 0;
  let pfExpReal = 0;
  let pfExpPrev = 0;

  let mixedExpenseTotalReal = 0;
  let totalExpensesPaidReal = 0;

  monthTx.forEach((t) => {
    const isExpense = t.type === TransactionType.EXPENSE;
    const isRevenue = t.type === TransactionType.REVENUE;
    const isRealized = t.status !== "PREVISTO";

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

    if (isExpense && isRealized) {
      totalExpensesPaidReal += t.amount;
      // Define a "Mixed" expense as any realized personal expense leaking into office accounts
      if (t.scope === TransactionScope.PERSONAL && (t.isAiCategorized || t.notes?.toLowerCase().includes("escritório") || t.notes?.toLowerCase().includes("pj"))) {
        mixedExpenseTotalReal += t.amount;
      }
    }
  });

  // Real balances for Line 1 KPIs
  const profBalanceReal = pjRevReal - pjExpReal;
  const persBalanceReal = pfRevReal - pfExpReal;

  // Mixing index ratio: Personal expenses paid on office/corporate accounts (realized only)
  const mixingIndex = totalExpensesPaidReal > 0 ? (mixedExpenseTotalReal / totalExpensesPaidReal) * 100 : 0;


  const getPercentage = (real: number, prev: number) => {
    if (prev === 0) return real > 0 ? 100 : 0;
    return (real / prev) * 100;
  };

  // Get status of the mixing index
  const getMixingStatus = (index: number) => {
    if (index === 0) return { label: "Excelente", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2, text: "Nenhuma mistura patrimonial detectada no período. Finanças 100% segregadas!" };
    if (index < 10) return { label: "Sob Controle", color: "text-amber-600 bg-amber-50 border-amber-200", icon: CheckCircle2, text: "Baixo nível de mistura. Continue pagando despesas pessoais com sua conta PF." };
    if (index < 20) return { label: "Alerta de Confusão", color: "text-orange-600 bg-orange-50 border-orange-200", icon: AlertTriangle, text: "Risco Fiscal Moderado! Despesas pessoais estão na conta PJ. Providencie a separação física." };
    return { label: "Risco Fiscal Alto", color: "text-red-600 bg-red-50 border-red-200", icon: AlertTriangle, text: "Confusão Patrimonial Detectada! Alto volume de despesas de sócios pagas pelo escritório. Risco fiscal relevante." };
  };

  const mixingStatus = getMixingStatus(mixingIndex);

  const getMonthTitleLabel = () => {
    if (selectedMonth === "ALL") return "Acumulado Histórico";
    const [year, month] = selectedMonth.split("-");
    const ptMonths = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${ptMonths[parseInt(month) - 1]} de ${year}`;
  };

  return (
    <div className="space-y-6 text-left" id="dashboard-stats-panel">
      
      {/* LINHA 1: KPIs EXECUTIVOS DE SALDO (REALIZADO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1: Saldo PJ */}
        {(() => {
          const profBalancePrev = pjRevPrev - pjExpPrev;
          const showPrev = pjRevReal === 0 && pjExpReal === 0 && (pjRevPrev > 0 || pjExpPrev > 0);
          const displayValue = showPrev ? profBalancePrev : profBalanceReal;
          return (
            <div className={`bg-white rounded-2xl border p-5 shadow-xs relative overflow-hidden group ${showPrev ? "border-amber-200" : "border-slate-150"}`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Escritório (PJ)</span>
                <div className="flex items-center gap-1.5">
                  {showPrev && <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded font-bold uppercase tracking-wider">Previsto</span>}
                  <div className="p-2 bg-blue-50/80 text-[#2563eb] rounded-xl border border-blue-100">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{showPrev ? "Saldo Previsto (Orçado)" : "Saldo em Caixa Efetivo"}</p>
                <h3 className={`text-2xl font-black font-display tracking-tight ${displayValue >= 0 ? (showPrev ? "text-amber-600" : "text-blue-600") : "text-rose-600"}`}>
                  {formatCurrency(displayValue)}
                </h3>
              </div>
              {showPrev ? (
                <p className="text-[9px] text-amber-600 font-semibold mt-1 font-sans">
                  Receitas: {formatCurrency(pjRevPrev)} · Despesas: {formatCurrency(pjExpPrev)}
                </p>
              ) : (pjRevPrev - pjRevReal) > 0 && (
                <p className="text-[9px] text-amber-600 font-semibold mt-1 font-sans">
                  + {formatCurrency(pjRevPrev - pjRevReal)} a receber (previsto)
                </p>
              )}
              <p className="text-[9px] text-slate-400 font-semibold mt-1.5 font-sans leading-none">
                {showPrev ? "Confirme recebimentos para atualizar o saldo real" : "Saldo real consolidado (Receitas PJ - Custos PJ)"}
              </p>
            </div>
          );
        })()}

        {/* KPI 2: Saldo PF */}
        {(() => {
          const persBalancePrev = pfRevPrev - pfExpPrev;
          const showPrev = pfRevReal === 0 && pfExpReal === 0 && (pfRevPrev > 0 || pfExpPrev > 0);
          const displayValue = showPrev ? persBalancePrev : persBalanceReal;
          return (
            <div className={`bg-white rounded-2xl border p-5 shadow-xs relative overflow-hidden group ${showPrev ? "border-amber-200" : "border-slate-150"}`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-50/50 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Pessoal (PF)</span>
                <div className="flex items-center gap-1.5">
                  {showPrev && <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded font-bold uppercase tracking-wider">Previsto</span>}
                  <div className="p-2 bg-violet-50/80 text-[#8b5cf6] rounded-xl border border-violet-100">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{showPrev ? "Saldo Previsto (Orçado)" : "Saldo Pessoal Efetivo"}</p>
                <h3 className={`text-2xl font-black font-display tracking-tight ${displayValue >= 0 ? (showPrev ? "text-amber-600" : "text-slate-900") : "text-rose-600"}`}>
                  {formatCurrency(displayValue)}
                </h3>
              </div>
              {showPrev ? (
                <p className="text-[9px] text-amber-600 font-semibold mt-1 font-sans">
                  Rendimentos: {formatCurrency(pfRevPrev)} · Gastos: {formatCurrency(pfExpPrev)}
                </p>
              ) : (pfRevPrev - pfRevReal) > 0 && (
                <p className="text-[9px] text-amber-600 font-semibold mt-1 font-sans">
                  + {formatCurrency(pfRevPrev - pfRevReal)} a receber (previsto)
                </p>
              )}
              <p className="text-[9px] text-slate-400 font-semibold mt-1.5 font-sans leading-none">
                {showPrev ? "Confirme pagamentos para atualizar o saldo real" : "Saldo líquido pessoal (Rendimentos PF - Gastos PF)"}
              </p>
            </div>
          );
        })()}

        {/* KPI 3: Confusão Patrimonial */}
        <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50/50 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              Desvio de Caixa
              <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help animate-pulse" title="Percentual de despesas de sócios pagas na conta do escritório." />
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-wider ${mixingStatus.color}`}>
              {mixingStatus.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <h3 className="text-2xl font-black font-display tracking-tight text-slate-900">
              {mixingIndex.toFixed(1)}%
            </h3>
            <span className="text-[9px] text-slate-400 font-semibold font-mono">dos gastos</span>
          </div>
          <p className="text-[9px] text-slate-400 font-semibold mt-2.5 font-sans leading-none">
            Representa <strong className="text-slate-700 font-mono">{formatCurrency(mixedExpenseTotalReal)}</strong> de contas PF pagas no CNPJ.
          </p>
        </div>

        {/* KPI EXTRA: Indicador de Saúde Financeira */}
        {(() => {
          const avgMonthlyExp = pjExpReal > 0 ? pjExpReal : pjExpPrev;
          const cashBalance = profBalanceReal > 0 ? profBalanceReal : (pjRevPrev - pjExpPrev);
          const monthsCovered = avgMonthlyExp > 0 ? cashBalance / avgMonthlyExp : 0;
          const getHealth = () => {
            if (monthsCovered >= 3) return { label: "Saudável", grade: "A", cls: "text-emerald-600 bg-emerald-50 border-emerald-200", bar: "bg-emerald-500" };
            if (monthsCovered >= 1.5) return { label: "Estável", grade: "B", cls: "text-blue-600 bg-blue-50 border-blue-200", bar: "bg-blue-500" };
            if (monthsCovered >= 0.5) return { label: "Atenção", grade: "C", cls: "text-amber-600 bg-amber-50 border-amber-200", bar: "bg-amber-400" };
            return { label: "Crítico", grade: "D", cls: "text-rose-600 bg-rose-50 border-rose-200", bar: "bg-rose-500" };
          };
          const health = getHealth();
          const barWidth = Math.min((monthsCovered / 4) * 100, 100);
          return (
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50/80 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  Saúde Financeira
                  <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" title="Quantos meses de despesas operacionais o saldo atual cobre." />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${health.cls}`}>{health.label}</span>
                  <span className={`text-sm font-black rounded-lg px-2 py-0.5 border ${health.cls}`}>{health.grade}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Meses cobertos pelo saldo</p>
                <h3 className={`text-2xl font-black font-display tracking-tight ${health.cls.split(" ")[0]}`}>
                  {monthsCovered >= 10 ? "10+" : monthsCovered.toFixed(1)}x
                </h3>
              </div>
              <div className="mt-3 space-y-1">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${health.bar}`} style={{ width: `${barWidth}%` }} />
                </div>
                <p className="text-[9px] text-slate-400 font-semibold font-sans">
                  Base: {formatCurrency(avgMonthlyExp)}/mês em despesas operacionais
                </p>
              </div>
            </div>
          );
        })()}

      </div>

      {/* LINHA 2: BATIMENTO DE PREVISTO x REALIZADO (RECEITAS E DESPESAS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Demonstrativo de Metas Orçamentárias • {getMonthTitleLabel()}</h4>
          <span className="text-[9px] text-slate-400 italic">Planejado vs. Liquidado</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Faturamento PJ (Revenues) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex flex-col justify-between h-36">
            <div>
              <div className="flex justify-between items-center text-slate-400 mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider">Faturamento PJ (Rec)</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-slate-400 font-medium">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(pjRevReal)}</strong></p>
                <p className="text-[10px] text-slate-400 font-medium">Previsto: <strong className="text-slate-500 font-mono">{formatCurrency(pjRevPrev)}</strong></p>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-50">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getPercentage(pjRevReal, pjRevPrev), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-semibold text-slate-400 font-mono">
                <span>Progresso</span>
                <span>{getPercentage(pjRevReal, pjRevPrev).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Custos PJ (Expenses) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex flex-col justify-between h-36">
            <div>
              <div className="flex justify-between items-center text-slate-400 mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider">Custos PJ (Desp)</span>
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-slate-400 font-medium">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(pjExpReal)}</strong></p>
                <p className="text-[10px] text-slate-400 font-medium">Previsto: <strong className="text-slate-500 font-mono">{formatCurrency(pjExpPrev)}</strong></p>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-50">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getPercentage(pjExpReal, pjExpPrev), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-semibold text-slate-400 font-mono">
                <span>Progresso</span>
                <span>{getPercentage(pjExpReal, pjExpPrev).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Rendimentos PF (Revenues) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex flex-col justify-between h-36">
            <div>
              <div className="flex justify-between items-center text-slate-400 mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider">Rendimentos PF (Rec)</span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-slate-400 font-medium">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(pfRevReal)}</strong></p>
                <p className="text-[10px] text-slate-400 font-medium">Previsto: <strong className="text-slate-500 font-mono">{formatCurrency(pfRevPrev)}</strong></p>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-50">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getPercentage(pfRevReal, pfRevPrev), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-semibold text-slate-400 font-mono">
                <span>Progresso</span>
                <span>{getPercentage(pfRevReal, pfRevPrev).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Gastos PF (Expenses) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex flex-col justify-between h-36">
            <div>
              <div className="flex justify-between items-center text-slate-400 mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider">Gastos PF (Desp)</span>
                <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-slate-400 font-medium">Realizado: <strong className="text-slate-800 font-mono">{formatCurrency(pfExpReal)}</strong></p>
                <p className="text-[10px] text-slate-400 font-medium">Previsto: <strong className="text-slate-500 font-mono">{formatCurrency(pfExpPrev)}</strong></p>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-50">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getPercentage(pfExpReal, pfExpPrev), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-semibold text-slate-400 font-mono">
                <span>Progresso</span>
                <span>{getPercentage(pfExpReal, pfExpPrev).toFixed(0)}%</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MONTHLY REVENUE TARGET */}
      {(monthlyRevenueTarget > 0 || onSetMonthlyTarget) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Meta Mensal de Faturamento</p>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {monthlyRevenueTarget > 0
                  ? `${((monthTx.filter(t => t.type === TransactionType.REVENUE && t.status !== "PREVISTO").reduce((s, t) => s + t.amount, 0) / monthlyRevenueTarget) * 100).toFixed(1)}% da meta atingida`
                  : "Defina uma meta mensal de receita"}
              </h3>
            </div>
            {onSetMonthlyTarget && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">Meta (R$):</span>
                <input
                  type="number"
                  defaultValue={monthlyRevenueTarget || ""}
                  placeholder="Ex: 15000"
                  className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-400"
                  onBlur={e => onSetMonthlyTarget(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => e.key === "Enter" && onSetMonthlyTarget(parseFloat((e.target as HTMLInputElement).value) || 0)}
                />
              </div>
            )}
          </div>
          {monthlyRevenueTarget > 0 && (() => {
            const realized = monthTx.filter(t => t.type === TransactionType.REVENUE && t.status !== "PREVISTO").reduce((s, t) => s + t.amount, 0);
            const previsto = monthTx.filter(t => t.type === TransactionType.REVENUE && t.status === "PREVISTO").reduce((s, t) => s + t.amount, 0);
            const pct = Math.min((realized / monthlyRevenueTarget) * 100, 100);
            const pctPrev = Math.min(((realized + previsto) / monthlyRevenueTarget) * 100, 100);
            return (
              <div className="space-y-2">
                <div className="relative w-full bg-slate-100 h-5 rounded-full overflow-hidden">
                  <div className="absolute inset-0 h-full bg-indigo-100 rounded-full" style={{ width: `${pctPrev}%` }} />
                  <div className="absolute inset-0 h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-white drop-shadow">
                    {formatCurrency(realized)} / {formatCurrency(monthlyRevenueTarget)}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />Realizado: {formatCurrency(realized)}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-100 border border-indigo-300 inline-block" />+ Previsto: {formatCurrency(previsto)}</span>
                  <span>Meta: {formatCurrency(monthlyRevenueTarget)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Insight Alert Warning Banner (If confusion patrimonio index is relevant) */}
      {mixingIndex > 0 && (
        <div id="mixing-alert-banner" className={`rounded-2xl border p-4 flex gap-3 items-start transition-all shadow-2xs ${mixingStatus.color}`}>
          <mixingStatus.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider font-mono">Governança Patrimonial & Riscos Fiscais</p>
            <p className="text-xs opacity-90 leading-relaxed font-sans">{mixingStatus.text}</p>
          </div>
        </div>
      )}
      
    </div>
  );
}
