import React, { useRef } from "react";
import { Transaction, TransactionScope, TransactionType, PriorityBill } from "../types";
import { Printer, CalendarDays, FileSpreadsheet, Percent, Scale, TrendingUp, TrendingDown, Sparkles, Building2, ChevronLeft, ChevronRight, PauseCircle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface MonthlyReportProps {
  transactions: Transaction[];
  selectedMonth: string;
  onSetSelectedMonth?: (month: string) => void;
  waitingBills?: PriorityBill[];
}

export default function MonthlyReport({ transactions, selectedMonth, onSetSelectedMonth, waitingBills = [] }: MonthlyReportProps) {
  // If no specific month, fallback to the latest month present or default
  const availableMonths = Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).sort().reverse();
  const currentReportMonth = selectedMonth === "ALL" ? (availableMonths[0] || "2026-06") : selectedMonth;

  const monthParts = currentReportMonth.split("-");
  const ptMonths = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const niceMonthName = `${ptMonths[parseInt(monthParts[1]) - 1]} de ${monthParts[0]}`;

  // Filter items for report
  const reportTx = transactions.filter(t => t.date.substring(0, 7) === currentReportMonth);

  // Group by scope and type
  const profRevenues = reportTx.filter(t => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.REVENUE);
  const profExpenses = reportTx.filter(t => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.EXPENSE);
  const persRevenues = reportTx.filter(t => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.REVENUE);
  const persExpenses = reportTx.filter(t => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.EXPENSE);

  // Totals — all (for display in breakdown tables)
  const totalProfRevenue = profRevenues.reduce((acc, t) => acc + t.amount, 0);
  const totalProfExpense = profExpenses.reduce((acc, t) => acc + t.amount, 0);
  const totalPersRevenue = persRevenues.reduce((acc, t) => acc + t.amount, 0);
  const totalPersExpense = persExpenses.reduce((acc, t) => acc + t.amount, 0);

  // Realized-only totals — used for liquidity metrics (cash actually received/paid)
  const realProfRevenue = profRevenues.filter(t => t.status !== "PREVISTO").reduce((acc, t) => acc + t.amount, 0);
  const realProfExpense = profExpenses.filter(t => t.status !== "PREVISTO").reduce((acc, t) => acc + t.amount, 0);
  const realPersRevenue = persRevenues.filter(t => t.status !== "PREVISTO").reduce((acc, t) => acc + t.amount, 0);
  const realPersExpense = persExpenses.filter(t => t.status !== "PREVISTO").reduce((acc, t) => acc + t.amount, 0);

  const netProfProfit = realProfRevenue - realProfExpense;
  const profitMargin = realProfRevenue > 0 ? (netProfProfit / realProfRevenue) * 100 : 0;
  const netPersProfit = realPersRevenue - realPersExpense;

  // Count previsto transactions to show warning
  const previstoProfCount = profRevenues.filter(t => t.status === "PREVISTO").length + profExpenses.filter(t => t.status === "PREVISTO").length;
  const previstoProfRevTotal = profRevenues.filter(t => t.status === "PREVISTO").reduce((acc, t) => acc + t.amount, 0);

  // Let's check how much Personal Expense was mapped (which means mixed in the accounts)
  const mixedPersonalInCorpHopeCount = reportTx
    .filter(t => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.EXPENSE && (t.isAiCategorized || t.notes?.includes("IA") || t.notes?.toLowerCase().includes("escritório") || t.notes?.toLowerCase().includes("pj")))
    .reduce((acc, t) => acc + t.amount, 0);


  // Previous month comparison
  const prevMonthStr = (() => {
    const [y, m] = currentReportMonth.split("-").map(Number);
    const pm = m - 1 === 0 ? 12 : m - 1;
    const py = m - 1 === 0 ? y - 1 : y;
    return `${py}-${String(pm).padStart(2, "0")}`;
  })();
  const prevTx = transactions.filter(t => t.date.substring(0, 7) === prevMonthStr && t.status !== "PREVISTO");
  const prevProfRev = prevTx.filter(t => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
  const prevProfExp = prevTx.filter(t => t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
  const prevProfNet = prevProfRev - prevProfExp;
  const hasPrevData = prevTx.length > 0;

  const delta = (curr: number, prev: number) => {
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  };

  const handlePrint = () => {
    window.print();
  };

  // Group by categories helper
  const groupByCategory = (list: Transaction[]) => {
    const cats: Record<string, number> = {};
    list.forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  };

  const groupedProfRevenues = groupByCategory(profRevenues);
  const groupedProfExpenses = groupByCategory(profExpenses);

  return (
    <div id="monthly-reporting-widget" className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6">
      {/* Top Controls Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Scale className="w-5 h-5 text-indigo-950" />
            Relatório de Liquidez & Segregação Fiscal
          </h3>
          <p className="text-xs text-slate-500">
            Auditadoria do fluxo de caixa e cruzamento de alçadas PJ vs. PF
          </p>
        </div>

        <div className="flex gap-2 self-end">
          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Relatório (PDF)
          </button>
        </div>
      </div>

      {/* COMPACT INTUITIVE MONTH NAVIGATION BAR */}
      {onSetSelectedMonth && (
        <div id="report-month-navigation" className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <CalendarDays className="w-4 h-4 text-indigo-950" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Competência de Análise:</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="report-prev-month"
              type="button"
              onClick={() => {
                const [year, month] = currentReportMonth.split("-").map(Number);
                let newMonth = month - 1;
                let newYear = year;
                if (newMonth === 0) { newMonth = 12; newYear = year - 1; }
                const newMonthStr = newMonth < 10 ? `0${newMonth}` : `${newMonth}`;
                onSetSelectedMonth(`${newYear}-${newMonthStr}`);
              }}
              className="p-1 px-2.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors border border-slate-200 bg-white cursor-pointer shadow-3xs"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="bg-white px-5 py-1.5 rounded-lg border border-slate-200 text-center min-w-[145px] shadow-3xs">
              <span className="text-xs font-extrabold text-slate-800 tracking-wide font-sans">
                {niceMonthName}
              </span>
            </div>

            <button
              id="report-next-month"
              type="button"
              onClick={() => {
                const [year, month] = currentReportMonth.split("-").map(Number);
                let newMonth = month + 1;
                let newYear = year;
                if (newMonth === 13) { newMonth = 1; newYear = year + 1; }
                const newMonthStr = newMonth < 10 ? `0${newMonth}` : `${newMonth}`;
                onSetSelectedMonth(`${newYear}-${newMonthStr}`);
              }}
              className="p-1 px-2.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors border border-slate-200 bg-white cursor-pointer shadow-3xs"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ACTUAL PRINTABLE AREA */}
      <div id="printable-report" className="space-y-6 p-2 printing:p-8">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-950">
              <Building2 className="w-5 h-5" />
              <h1 className="text-lg font-bold uppercase tracking-tight">Dantas & Associados</h1>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">CNPJ: 45.102.304/0001-99 | Advocacia Trabalhista & Cível</p>
            <p className="text-[10px] text-slate-400">E-mail: ceo@gustavodantas.adv.br</p>
          </div>

          <div className="text-left md:text-right">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-950 bg-indigo-100/60 px-3 py-1 rounded-md">
              <CalendarDays className="w-3.5 h-3.5" />
              Competência: {niceMonthName}
            </span>
            <p className="text-[9px] text-slate-400 mt-1">Gerado eletronicamente em {new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        {/* PREVISTO WARNING BANNER */}
        {previstoProfCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
            <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>{previstoProfCount} lançamento{previstoProfCount > 1 ? "s" : ""} em PREVISTO</strong> ({formatCurrency(previstoProfRevTotal)} a receber) não entram nas métricas de liquidez abaixo. As métricas mostram apenas o que foi efetivamente recebido/pago.
            </span>
          </div>
        )}

        {/* COMPARATIVO MÊS A MÊS */}
        {hasPrevData && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Variação vs. mês anterior</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Receitas PJ", curr: realProfRevenue, prev: prevProfRev, positive: true },
                { label: "Despesas PJ", curr: realProfExpense, prev: prevProfExp, positive: false },
                { label: "Resultado PJ", curr: netProfProfit, prev: prevProfNet, positive: true },
              ].map(({ label, curr, prev, positive }) => {
                const d = delta(curr, prev);
                const up = curr >= prev;
                const Icon = d === null ? Minus : up ? ArrowUpRight : ArrowDownRight;
                const good = positive ? up : !up;
                const color = d === null ? "text-slate-400" : good ? "text-emerald-600" : "text-rose-600";
                return (
                  <div key={label} className="bg-white rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-black text-slate-800 font-mono">{formatCurrency(curr)}</p>
                    <div className={`flex items-center justify-center gap-0.5 mt-1 text-[10px] font-bold ${color}`}>
                      <Icon className="w-3 h-3" />
                      {d !== null ? `${Math.abs(d).toFixed(1)}%` : "—"}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">vs {formatCurrency(prev)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Margem Operacional Líquida PJ</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(netProfProfit)}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold" style={{ color: profitMargin >= 0 ? '#059669' : '#dc2626' }}>
              <Percent className="w-2.5 h-2.5" />
              <span>{realProfRevenue > 0 ? `${profitMargin.toFixed(1)}% do recebido convertido em lucro` : "Nenhuma receita confirmada este mês"}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Renda Líquida PF Estimada</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(netPersProfit)}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
              <span>Inclui retiradas de lucros e rendimentos</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Contas PF Pagas por Conta PJ</p>
            <h4 className={`text-xl font-bold mt-1 ${mixedPersonalInCorpHopeCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {formatCurrency(mixedPersonalInCorpHopeCount)}
            </h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 leading-tight">
              {mixedPersonalInCorpHopeCount > 0 
                ? "Gera risco fiscal de descaracterização da responsabilidade limitada" 
                : "Segregação patrimonial perfeita!"}
            </div>
          </div>
        </div>

        {/* TABLES BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* PJ REVENUE BREAKDOWN */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-indigo-100 pb-2 flex justify-between items-center">
              <span>1. Receitas do Escritório</span>
              <span className="text-indigo-900 text-xs font-bold font-mono">{formatCurrency(totalProfRevenue)}</span>
            </h4>
            <div className="space-y-2">
              {groupedProfRevenues.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhuma receita registrada.</p>
              ) : (
                groupedProfRevenues.map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center text-xs text-slate-600">
                    <span>{cat}</span>
                    <span className="font-semibold font-mono">{formatCurrency(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PJ EXPENSE BREAKDOWN */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-indigo-100 pb-2 flex justify-between items-center">
              <span>2. Despesas do Escritório</span>
              <span className="text-rose-600 text-xs font-bold font-mono">{formatCurrency(totalProfExpense)}</span>
            </h4>
            <div className="space-y-2">
              {groupedProfExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhuma despesa registrada.</p>
              ) : (
                groupedProfExpenses.map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center text-xs text-slate-600">
                    <span>{cat}</span>
                    <span className="font-semibold font-mono">{formatCurrency(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COMPLIANCE AUDIT TEXT */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Laudo de Integridade Regulatória (Simples Nacional)
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Com base nas movimentações <b>confirmadas (realizadas)</b> de <b>{niceMonthName}</b>, {mixedPersonalInCorpHopeCount > 0 ? (
              <span>
                foi identificado um total de <b className="text-amber-700">{formatCurrency(mixedPersonalInCorpHopeCount)}</b> da conta particular do sócio transacionadas utilizando recursos do escritório (CNPJ PJ). Para manter a integridade fiscal do escritório sob o <b>Simples Nacional Anexo IV</b> e blindar os sócios contra a desconsideração ordinária de personalidade jurídica (Art. 50 do Código Civil), recomenda-se converter essas saídas em <b>Distribuição de Dividendos Isentos</b> ou estornar à empresa.
              </span>
            ) : (
              <span>
                não foram localizados vazamentos patrimoniais significativos da conta particular utilizando reservas ou cartões PJ do escritório. O nível de segregação contábil está em <b>consonância plena com os melhores preceitos legais e societários</b> do setor.
              </span>
            )}
          </p>
        </div>

        {/* DESPESAS RETIDAS (ESPERAR) */}
        {waitingBills.length > 0 && (() => {
          const totalWaiting = waitingBills.reduce((s, b) => s + b.amount, 0);
          const pjWaiting = waitingBills.filter(b => b.scope === TransactionScope.PROFESSIONAL);
          const pfWaiting = waitingBills.filter(b => b.scope === TransactionScope.PERSONAL);
          const totalPjWaiting = pjWaiting.reduce((s, b) => s + b.amount, 0);
          const totalPfWaiting = pfWaiting.reduce((s, b) => s + b.amount, 0);
          return (
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <div className="bg-amber-50 px-4 py-3 flex items-center justify-between border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Despesas Retidas — Aguardando Caixa</h4>
                    <p className="text-[10px] text-amber-600 mt-0.5">Lançamentos em ESPERAR: não entram nos totais de despesa prevista acima</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-700 font-mono">{formatCurrency(totalWaiting)}</span>
              </div>

              <div className="bg-white divide-y divide-slate-100">
                {waitingBills.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        b.scope === TransactionScope.PROFESSIONAL
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : "bg-sky-50 text-sky-700 border-sky-100"
                      }`}>
                        {b.scope === TransactionScope.PROFESSIONAL ? "PJ" : "PF"}
                      </span>
                      <span className="truncate text-slate-700 font-medium">{b.description}</span>
                      {b.category && <span className="hidden sm:inline text-slate-400 text-[10px] shrink-0">— {b.category}</span>}
                    </div>
                    <span className="font-mono font-bold text-amber-700 shrink-0 ml-3">{formatCurrency(b.amount)}</span>
                  </div>
                ))}
              </div>

              {(pjWaiting.length > 0 && pfWaiting.length > 0) && (
                <div className="bg-amber-50/60 px-4 py-2.5 border-t border-amber-100 flex gap-6 text-[10px] text-amber-700 font-mono font-bold">
                  {pjWaiting.length > 0 && <span>PJ retido: {formatCurrency(totalPjWaiting)}</span>}
                  {pfWaiting.length > 0 && <span>PF retido: {formatCurrency(totalPfWaiting)}</span>}
                </div>
              )}
            </div>
          );
        })()}

        {/* Signatures for Print and Law firm Seal */}
        <div id="printable-signature" className="hidden printing:flex justify-between items-center pt-10 text-slate-500 text-[10px]">
          <div className="text-center w-48 border-t border-slate-300 pt-2">
            <b>Gustavo Dantas</b>
            <p>Advogado Titular - OAB/SP 123.456</p>
          </div>
          <div className="text-center w-48 border-t border-slate-300 pt-2">
            <b>Departamento de Controladoria</b>
            <p>Relatório de Alocação de Caixa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
