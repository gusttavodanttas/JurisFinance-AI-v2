import React, { useRef } from "react";
import { Transaction, TransactionScope, TransactionType } from "../types";
import { Printer, CalendarDays, FileSpreadsheet, Percent, Scale, TrendingUp, Sparkles, Building2, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyReportProps {
  transactions: Transaction[];
  selectedMonth: string;
  onSetSelectedMonth?: (month: string) => void;
}

export default function MonthlyReport({ transactions, selectedMonth, onSetSelectedMonth }: MonthlyReportProps) {
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

  // Totals
  const totalProfRevenue = profRevenues.reduce((acc, t) => acc + t.amount, 0);
  const totalProfExpense = profExpenses.reduce((acc, t) => acc + t.amount, 0);
  const netProfProfit = totalProfRevenue - totalProfExpense;
  const profitMargin = totalProfRevenue > 0 ? (netProfProfit / totalProfRevenue) * 100 : 0;

  const totalPersRevenue = persRevenues.reduce((acc, t) => acc + t.amount, 0);
  const totalPersExpense = persExpenses.reduce((acc, t) => acc + t.amount, 0);
  const netPersProfit = totalPersRevenue - totalPersExpense;

  // Let's check how much Personal Expense was mapped (which means mixed in the accounts)
  const mixedPersonalInCorpHopeCount = reportTx
    .filter(t => t.scope === TransactionScope.PERSONAL && t.type === TransactionType.EXPENSE && (t.isAiCategorized || t.notes?.includes("IA") || t.notes?.toLowerCase().includes("escritório") || t.notes?.toLowerCase().includes("pj")))
    .reduce((acc, t) => acc + t.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
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

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Margem Operacional Líquida PJ</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(netProfProfit)}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-semibold">
              <Percent className="w-2.5 h-2.5" />
              <span>{profitMargin.toFixed(1)}% do faturamento convertido em lucro</span>
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
            Com base nas movimentações de <b>{niceMonthName}</b>, {mixedPersonalInCorpHopeCount > 0 ? (
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
