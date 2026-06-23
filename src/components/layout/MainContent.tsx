import React, { Suspense, lazy, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Transaction, TransactionScope, TransactionType } from "../../types";
import { useApp } from "../../context/AppContext";

// Always-loaded (dashboard, critical path)
import DashboardStats from "../DashboardStats";
import CashFlowChart from "../CashFlowChart";
import CategoryPieChart from "../CategoryPieChart";
import DueCalendar from "../DueCalendar";

// Lazy-loaded (loaded on first tab visit)
const AISeparator = lazy(() => import("../AISeparator"));
const TransactionList = lazy(() => import("../TransactionList"));
const MonthlyReport = lazy(() => import("../MonthlyReport"));
const ExpensePrioritizer = lazy(() => import("../ExpensePrioritizer"));
const WhatsAppTab = lazy(() => import("../WhatsAppTab"));
const ContractGoalsSimModule = lazy(() => import("../ContractGoalsSim").then(m => ({ default: m.ContractGoalsSim })));
const ForecastComparison = lazy(() => import("../ForecastComparison"));
const CategoryChartsView = lazy(() => import("../CategoryChartsView"));
const CloudUsersTab = lazy(() => import("../CloudUsersTab"));
const ClientsTab = lazy(() => import("../ClientsTab"));
const CashFlow90DaysTab = lazy(() => import("../CashFlow90DaysTab"));
const DRETab = lazy(() => import("../DRETab"));
const CourtCostsTab = lazy(() => import("../CourtCostsTab"));
const SettingsTab = lazy(() => import("../SettingsTab"));

function TabFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-32">
            <div className="h-2.5 bg-slate-100 rounded w-1/2 mb-3" />
            <div className="h-7 bg-slate-100 rounded w-2/3 mb-2" />
            <div className="h-2 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 h-56">
        <div className="h-2.5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-2 bg-slate-100 rounded w-16" />
              <div className="h-2 bg-slate-100 rounded flex-1" />
              <div className="h-2 bg-slate-100 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PT_MONTHS_LONG = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-l-4 border-indigo-600 pl-3">
      <h2 className="text-base md:text-xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h2>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

export default function MainContent() {
  const {
    activeTab, setActiveTab,
    transactions, priorityBills, selectedMonth, setSelectedMonth,
    isLoadingCloud, dashboardSubTab, setDashboardSubTab,
    handleAddTransactions, handleSaveSingleTransaction,
    handleUpdateTransaction, handleConfirmTransaction, handleDeleteTransaction,
    handleAddTransactionFromPriority, handleUpdateCurrentMonthBills, handleResetPriorityBills,
    setConfirmModal, officeSub,
    setIsModalOpen, setTransactionToEdit,
    handleClearLedger, monthlyRevenueTarget, setMonthlyRevenueTarget,
    clients, courtCosts,
    handleAddClient, handleUpdateClient, handleDeleteClient,
    handleAddCourtCost, handleUpdateCourtCost, handleDeleteCourtCost,
  } = useApp();

  const targetMonth = selectedMonth === "ALL" ? "2026-06" : selectedMonth;
  const [y, m] = targetMonth.split("-");
  const readableMonth = `${PT_MONTHS_LONG[parseInt(m) - 1]} de ${y}`;

  // Merge only PAGAR (priority) bills as PREVISTO expenses — ESPERAR bills are excluded from totals
  const transactionsWithBills = useMemo<Transaction[]>(() => {
    const billTxs: Transaction[] = priorityBills
      .filter(b => !b.paid && b.month === targetMonth && b.status === "PAGAR")
      .map(b => ({
        id: `bill_${b.id}`,
        date: b.dueDay ? `${targetMonth}-${String(b.dueDay).padStart(2, "0")}` : `${targetMonth}-01`,
        description: b.description,
        type: TransactionType.EXPENSE,
        scope: b.scope,
        category: b.category || (b.scope === TransactionScope.PROFESSIONAL ? "Outras Despesas Profissionais" : "Outras Despesas Pessoais"),
        amount: b.amount,
        paymentMethod: b.paymentMethod || "—",
        notes: b.notes,
        status: "PREVISTO" as const,
        isAiCategorized: false,
      }));
    return [...transactions, ...billTxs];
  }, [transactions, priorityBills, targetMonth]);

  // ESPERAR bills — shown separately in reports, not counted in previsto totals
  const waitingBills = useMemo(() =>
    priorityBills.filter(b => !b.paid && b.month === targetMonth && b.status === "ESPERAR"),
  [priorityBills, targetMonth]);

  return (
    <main className="flex-grow p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6 relative min-w-0 overflow-x-hidden">
      {isLoadingCloud && (
        <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-3 py-20 rounded-xl">
          <div className="w-10 h-10 border-4 border-violet-500/35 border-t-violet-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 animate-pulse font-sans">Sincronizando com o Banco de Dados Supabase...</p>
        </div>
      )}

      {/* DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="border-l-4 border-indigo-600 pl-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base md:text-xl font-bold tracking-tight text-slate-900 leading-tight">Demonstrativo de Integração PJ/PF</h2>
                <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Separador inteligente e monitor de mistura patrimonial</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono italic shrink-0 hidden md:block">
                {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          <div className="flex border-b border-slate-200 pb-0.5 overflow-x-auto scrollbar-none font-sans gap-2">
            {(["overview", "forecast", "categories"] as const).map((tab, i) => {
              const labels = ["📊 Visão Geral", "⚖️ Previsto x Realizado", "🍩 Gráficos por Categoria"];
              return (
                <button
                  key={tab}
                  onClick={() => setDashboardSubTab(tab)}
                  className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    dashboardSubTab === tab
                      ? "border-indigo-600 text-indigo-700 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {labels[i]}
                </button>
              );
            })}
          </div>

          {dashboardSubTab === "overview" && (
            <div className="space-y-6 animate-slide-up">
              <DashboardStats
                transactions={transactionsWithBills}
                allTransactions={transactions}
                selectedMonth={selectedMonth}
                monthlyRevenueTarget={monthlyRevenueTarget}
                onSetMonthlyTarget={setMonthlyRevenueTarget}
                onGoToLedger={() => setActiveTab("ledger")}
              />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <CashFlowChart transactions={transactionsWithBills} priorityBills={priorityBills} />
                </div>
                <div className="xl:col-span-1">
                  <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between h-full min-h-[340px]">
                    <div>
                      <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Práticas de Blindagem Patrimonial
                      </h3>
                      <p className="text-xl font-bold mt-1 text-slate-100">Guarde seu caixa corporativo!</p>
                    </div>
                    <div className="space-y-3.5 text-xs text-slate-300 font-sans">
                      <p className="leading-relaxed">
                        Sua conta física deve ser o destino das retiradas de lucros. Evite pagar o colégio dos filhos ou compras de mercado diretamente pelo CNPJ do escritório.
                      </p>
                      <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-900 text-[11px] text-indigo-300 leading-normal font-sans">
                        💡 <b>Dica de IA:</b> Cole seu extrato bancário semanal ou mensal na guia <b>Conciliação com IA</b> para separar os gastos irregulares de uma vez só.
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("ai")}
                      className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Ir para Separador com IA
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <CategoryPieChart transactions={transactionsWithBills} selectedMonth={selectedMonth} />
                </div>
                <div className="xl:col-span-1">
                  <DueCalendar transactions={transactions} />
                </div>
              </div>
            </div>
          )}

          {dashboardSubTab === "forecast" && (
            <Suspense fallback={<TabFallback />}>
              <ForecastComparison transactions={transactionsWithBills} selectedMonth={selectedMonth} onConfirmTransaction={handleConfirmTransaction} />
            </Suspense>
          )}

          {dashboardSubTab === "categories" && (
            <Suspense fallback={<TabFallback />}>
              <CategoryChartsView transactions={transactionsWithBills} selectedMonth={selectedMonth} />
            </Suspense>
          )}
        </div>
      )}

      <Suspense fallback={<TabFallback />}>
        {/* AI */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <SectionHeader
              title="Alocação por Inteligência Artificial"
              subtitle="Mecanismo para processar extratos bancários e classificar dados sem digitação manual"
            />
            <AISeparator onAddTransactions={handleAddTransactions} />
          </div>
        )}

        {/* LEDGER */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            <SectionHeader
              title="Livro de Movimentações (Ledger)"
              subtitle="Demonstrativo geral das receitas e despesas registradas"
            />
            <TransactionList
              transactions={transactionsWithBills}
              selectedMonth={selectedMonth}
              onSetSelectedMonth={setSelectedMonth}
              onDeleteTransaction={handleDeleteTransaction}
              onConfirmTransaction={handleConfirmTransaction}
              onEditTransaction={(tx) => { setTransactionToEdit(tx); setIsModalOpen(true); }}
              onTriggerNewTransaction={() => { setTransactionToEdit(null); setIsModalOpen(true); }}
              onReconcileTransaction={(id) => {
                const tx = transactions.find(t => t.id === id);
                if (tx) handleUpdateTransaction({ ...tx, reconciled: !tx.reconciled });
              }}
              onImportTransactions={handleAddTransactions}
              onClearAllTransactions={() => setConfirmModal({
                isOpen: true,
                title: "Excluir todos os lançamentos?",
                message: "Esta ação é irreversível. Todos os lançamentos do Livro Caixa serão removidos permanentemente. Os dados da Priorização não serão afetados.",
                onConfirm: handleClearLedger,
              })}
            />
          </div>
        )}

        {/* REPORT */}
        {activeTab === "report" && (
          <div className="space-y-6">
            <SectionHeader
              title="Relatório Consolidado para Contabilidade"
              subtitle="Gere resumos analíticos prontos para exportar ou imprimir"
            />
            <MonthlyReport transactions={transactionsWithBills} selectedMonth={selectedMonth} onSetSelectedMonth={setSelectedMonth} waitingBills={waitingBills} />
          </div>
        )}

        {/* PRIORITIES */}
        {activeTab === "priorities" && (
          <div className="space-y-6">
            <SectionHeader
              title={`Priorização de Despesas de Caixa (${readableMonth})`}
              subtitle={`Abater ou reter despesas e compromissos fiscais de ${readableMonth}: Pagar vs Esperar`}
            />
            <ExpensePrioritizer
              bills={priorityBills.filter(b => b.month === targetMonth)}
              onUpdateBills={(bills) => handleUpdateCurrentMonthBills(bills, targetMonth)}
              onResetBills={handleResetPriorityBills}
              selectedMonth={targetMonth}
              onSetSelectedMonth={setSelectedMonth}
              onAddTransactionToLedger={(item) => {
                handleAddTransactionFromPriority({
                  ...item,
                  type: TransactionType.EXPENSE,
                  scope: item.scope,
                  paymentMethod: item.paymentMethod || "Outros",
                  notes: `Registrado via painel de priorização de despesas de ${readableMonth}.`,
                });
              }}
            />
          </div>
        )}

        {/* WHATSAPP */}
        {activeTab === "whatsapp" && (
          <WhatsAppTab bills={priorityBills} />
        )}

        {/* METAS */}
        {activeTab === "metas" && (
          <div className="space-y-6 animate-fade-in">
            <SectionHeader
              title="Metas de Fechamento de Contratos Jurídicos"
              subtitle="Planeje seu faturamento bruto simulando fechamentos de serviços jurídicos sugeridos"
            />
            <ContractGoalsSimModule
              currentCollectedRevenue={transactions
                .filter(t => (selectedMonth === "ALL" || t.date.substring(0, 7) === selectedMonth)
                  && t.scope === TransactionScope.PROFESSIONAL
                  && t.type === TransactionType.REVENUE)
                .reduce((sum, t) => sum + t.amount, 0)}
              selectedMonth={targetMonth}
              onAddTransaction={(description, amount, category) => {
                handleSaveSingleTransaction({
                  date: selectedMonth === "ALL" ? "2026-06-18" : `${selectedMonth}-18`,
                  description,
                  type: TransactionType.REVENUE,
                  scope: TransactionScope.PROFESSIONAL,
                  category,
                  amount,
                  paymentMethod: "Pix",
                  notes: "Contrato efetivado automaticamente a partir do Simulador de Metas de Fechamento.",
                });
              }}
            />
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && <CloudUsersTab />}

        {/* CLIENTS */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <SectionHeader title="Clientes & Honorários" subtitle="Gerencie clientes e acompanhe o histórico de honorários por cliente" />
            <ClientsTab clients={clients} transactions={transactions} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} />
          </div>
        )}

        {/* CASH FLOW 90 DAYS */}
        {activeTab === "cashflow90" && (
          <div className="space-y-6">
            <SectionHeader title="Fluxo de Caixa — Próximos 90 Dias" subtitle="Projeção semanal com lançamentos previstos e bills em aberto" />
            <CashFlow90DaysTab transactions={transactions} priorityBills={priorityBills} />
          </div>
        )}

        {/* DRE */}
        {activeTab === "dre" && (
          <div className="space-y-6">
            <SectionHeader title="DRE Simplificado" subtitle="Demonstração de resultado anual baseado nos lançamentos realizados" />
            <DRETab transactions={transactions} />
          </div>
        )}

        {/* CUSTAS */}
        {activeTab === "custas" && (
          <div className="space-y-6">
            <SectionHeader title="Custas & Reembolsos Processuais" subtitle="Controle de custas pagas e reembolsos pendentes por cliente/processo" />
            <CourtCostsTab courtCosts={courtCosts} onAdd={handleAddCourtCost} onUpdate={handleUpdateCourtCost} onDelete={handleDeleteCourtCost} />
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <SectionHeader title="Configurações" subtitle="Gerencie categorias, perfil e preferências do sistema" />
            <SettingsTab />
          </div>
        )}
      </Suspense>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#e2e8f0] py-4 px-6 text-xs text-[#64748b] mt-6 -mx-4 lg:-mx-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span>&copy; {new Date().getFullYear()} {officeSub} • Advocacia e Controladoria de Caixa. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Controle Patrimonial Integrado</span>
            <span className="text-[#8b5cf6] font-semibold flex items-center gap-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI Powered
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
