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
  PiggyBank
} from "lucide-react";

interface DashboardStatsProps {
  transactions: Transaction[];
  selectedMonth: string; // "YYYY-MM" or "ALL"
}

export default function DashboardStats({ transactions, selectedMonth }: DashboardStatsProps) {
  // Filter transactions for current month and only include realized transactions in cash balances
  const filtered = transactions.filter((t) => {
    const matchesMonth = selectedMonth === "ALL" || t.date.substring(0, 7) === selectedMonth;
    return matchesMonth && t.status !== "PREVISTO";
  });

  // Calculate totals
  let profRevenue = 0;
  let profExpense = 0;
  let persRevenue = 0;
  let persExpense = 0;

  // Let's check how many "PERSONAL" expenses were marked (mixed)
  let mixedExpenseTotal = 0;
  let totalExpensesPaid = 0;

  filtered.forEach((t) => {
    const isExpense = t.type === TransactionType.EXPENSE;
    const isRevenue = t.type === TransactionType.REVENUE;

    if (t.scope === TransactionScope.PROFESSIONAL) {
      if (isRevenue) profRevenue += t.amount;
      if (isExpense) profExpense += t.amount;
    } else {
      if (isRevenue) persRevenue += t.amount;
      if (isExpense) persExpense += t.amount;
    }

    if (isExpense) {
      totalExpensesPaid += t.amount;
      // Define a "Mixed" expense as any personal expense that has been identified
      // in the transactions (often a sign of mixing personal and professional flows)
      if (t.scope === TransactionScope.PERSONAL && (t.isAiCategorized || t.notes?.toLowerCase().includes("escritório") || t.notes?.toLowerCase().includes("pj"))) {
        mixedExpenseTotal += t.amount;
      }
    }
  });

  const profBalance = profRevenue - profExpense;
  const persBalance = persRevenue - persExpense;

  // Mixing index ratio: Personal expenses paid on office/corporate accounts
  // In our mock data and system, we mark mixed transactions with isAiCategorized or in the note
  const mixingIndex = totalExpensesPaid > 0 ? (mixedExpenseTotal / totalExpensesPaid) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Get status of the mixing index
  const getMixingStatus = (index: number) => {
    if (index === 0) return { label: "Excelente", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2, text: "Nenhuma mistura patrimonial detectada no período. Finanças 100% segregadas!" };
    if (index < 10) return { label: "Sob Controle", color: "text-amber-600 bg-amber-50 border-amber-200", icon: CheckCircle2, text: "Baixo nível de mistura. Continue priorizando pagar contas pessoais na conta PF." };
    if (index < 20) return { label: "Alerta de Confusão", color: "text-orange-600 bg-orange-50 border-orange-200", icon: AlertTriangle, text: "Risco Fiscal Moderado! Despesas pessoais estão poluindo a conta PJ. Providencie a separação física de cartões." };
    return { label: "Risco Fiscal Alto", color: "text-red-600 bg-red-50 border-red-200", icon: AlertTriangle, text: "Confusão Patrimonial Detectada! Alto volume de despesas de casa pagas pelo escritório. Risco de desconsideração da personalidade jurídica ou autuação fiscal." };
  };

  const status = getMixingStatus(mixingIndex);

  return (
    <div id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* PROFESSIONAL BOX */}
      <div id="stat-professional" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.04)] transition-all duration-300 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.1)] hover:-translate-y-1 hover:border-blue-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Escritório (CNPJ)</span>
          <div className="p-2 bg-blue-50/80 text-[#2563eb] rounded-xl border border-blue-100 shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-0.5 relative z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo de Caixa PJ</p>
          <h3 className={`text-2xl font-black font-display tracking-tight transition-colors ${profBalance >= 0 ? "text-blue-600" : "text-rose-600"}`}>
            {formatCurrency(profBalance)}
          </h3>
        </div>
        <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs font-mono relative z-10">
          <div className="flex items-center text-emerald-600 font-semibold bg-emerald-50/50 px-2 py-0.5 rounded-md">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{formatCurrency(profRevenue)}</span>
          </div>
          <div className="flex items-center text-rose-500 font-semibold bg-rose-50/50 px-2 py-0.5 rounded-md">
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            <span>{formatCurrency(profExpense)}</span>
          </div>
        </div>
      </div>

      {/* PERSONAL BOX */}
      <div id="stat-personal" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.04)] transition-all duration-300 hover:shadow-[0_12px_24px_-8px_rgba(139,92,246,0.1)] hover:-translate-y-1 hover:border-violet-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50/50 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Pessoal (PF)</span>
          <div className="p-2 bg-violet-50/80 text-[#8b5cf6] rounded-xl border border-violet-100 shadow-2xs">
            <User className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-0.5 relative z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Estimado PF</p>
          <h3 className={`text-2xl font-black font-display tracking-tight transition-colors ${persBalance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
            {formatCurrency(persBalance)}
          </h3>
        </div>
        <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs font-mono relative z-10">
          <div className="flex items-center text-emerald-600 font-semibold bg-emerald-50/50 px-2 py-0.5 rounded-md">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{formatCurrency(persRevenue)}</span>
          </div>
          <div className="flex items-center text-rose-500 font-semibold bg-rose-50/50 px-2 py-0.5 rounded-md">
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            <span>{formatCurrency(persExpense)}</span>
          </div>
        </div>
      </div>

      {/* TRANSFER/RETIRADA BOX */}
      <div id="stat-retirada" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.04)] transition-all duration-300 hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.1)] hover:-translate-y-1 hover:border-emerald-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Dividendos & Pró-labore</span>
          <div className="p-2 bg-emerald-50/80 text-emerald-600 rounded-xl border border-emerald-100 shadow-2xs">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-0.5 relative z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Repasse de Lucros</p>
          <h3 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {formatCurrency(
              filtered
                .filter(t => t.category === "Retirada de Pró-labore/Lucros" && t.scope === TransactionScope.PERSONAL && t.type === TransactionType.REVENUE)
                .reduce((acc, curr) => acc + curr.amount, 0)
            )}
          </h3>
        </div>
        <div className="mt-4 pt-3.5 border-t border-slate-50 text-[10px] text-slate-500 leading-relaxed font-medium relative z-10">
          Cobre <span className="font-mono font-bold text-slate-700 bg-slate-100/80 px-1 py-0.5 rounded">{persRevenue > 0 ? Math.round((filtered.filter(t => t.category === "Retirada de Pró-labore/Lucros").reduce((acc, curr) => acc + curr.amount, 0) / persRevenue) * 100) : 0}%</span> dos custos de vida pessoal do sócio titular.
        </div>
      </div>

      {/* MIXING INDEX BOX */}
      <div id="stat-mixing-index" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.04)] transition-all duration-300 hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.1)] hover:-translate-y-1 hover:border-amber-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />
        <div className="flex items-center justify-between mb-2 relative z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            Mistura
            <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" title="Percentual de despesas pessoais pagas com as finanças PJ do escritório." />
          </span>
          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border tracking-wider shadow-4xs ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-1 relative z-10">
          <span className="text-2xl font-black font-display tracking-tight text-slate-900">
            {mixingIndex.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">do total de gastos</span>
        </div>

        {/* Mini Meter gauge */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3.5 relative z-10">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              mixingIndex === 0 ? "bg-emerald-500" :
              mixingIndex < 10 ? "bg-amber-400" :
              mixingIndex < 20 ? "bg-orange-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(mixingIndex, 100)}%` }}
          />
        </div>

        <div className="mt-2.5 text-[10px] text-slate-500 leading-tight font-medium relative z-10">
          <span className="font-mono text-slate-700 font-bold">{formatCurrency(mixedExpenseTotal)}</span> de contas PF pagas no caixa PJ por engano ou facilidades.
        </div>
      </div>

      {/* WARNING / INSIGHT ALERT BANNER */}
      {mixingIndex > 0 && (
        <div id="mixing-alert-banner" className={`col-span-1 md:col-span-2 lg:col-span-4 rounded-2xl border p-4.5 flex gap-3.5 items-start transition-all shadow-sm ${status.color}`}>
          <status.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider font-mono">Análise de Governança Financeira & Riscos Fiscais</p>
            <p className="text-xs opacity-90 leading-relaxed font-sans">{status.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
