import React, { createContext, useContext, useState, useEffect } from "react";
import { Transaction, TransactionScope, TransactionType, PriorityBill } from "../types";
import { INITIAL_TRANSACTIONS, INITIAL_PRIORITY_BILLS } from "../mockData";
import { useCloudSync } from "../hooks/useCloudSync";

type ActiveTab = "dashboard" | "ai" | "ledger" | "priorities" | "report" | "whatsapp" | "metas" | "users";
type SyncStatus = "synced" | "syncing" | "error" | "offline";
type DashboardSubTab = "overview" | "forecast" | "categories";

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AppContextValue {
  // Auth
  isAuthenticated: boolean;
  handleLogin: (name?: string, oab?: string) => void;
  handleLogout: () => void;

  // Data
  transactions: Transaction[];
  priorityBills: PriorityBill[];
  isLoadingCloud: boolean;
  syncStatus: SyncStatus;
  isDemoMode: boolean;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  generatedMonthsList: string[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  dashboardSubTab: DashboardSubTab;
  setDashboardSubTab: (tab: DashboardSubTab) => void;

  // Profile
  userName: string;
  userOab: string;
  officeName: string;
  officeSub: string;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;
  handleSaveProfile: (e: React.FormEvent<HTMLFormElement>) => void;

  // Transaction handlers
  handleAddTransactions: (items: Omit<Transaction, "id">[]) => void;
  handleSaveSingleTransaction: (item: Omit<Transaction, "id">) => void;
  handleUpdateTransaction: (updated: Transaction) => void;
  handleConfirmTransaction: (id: string) => void;
  handleDeleteTransaction: (id: string) => void;
  handleAddTransactionFromPriority: (item: Omit<Transaction, "id">) => void;

  // Priority bill handlers
  handleUpdateCurrentMonthBills: (bills: PriorityBill[], targetMonth: string) => void;
  handleResetPriorityBills: () => void;

  // System
  handleResetData: () => void;
  handleClearAllData: () => void;
  handleClearLedger: () => void;
  confirmModal: ConfirmModalState;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;

  // Modal
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  transactionToEdit: Transaction | null;
  setTransactionToEdit: (tx: Transaction | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("gd_auth") === "true"
  );

  const [userName, setUserName] = useState(() => localStorage.getItem("oab_user_name") || "Dr. Gustavo Dantas");
  const [userOab, setUserOab] = useState(() => localStorage.getItem("oab_user_oab") || "OAB/PE 123.456");
  const [officeName, setOfficeName] = useState(() => localStorage.getItem("oab_office_name") || "JURISFINANCE AI");
  const [officeSub, setOfficeSub] = useState(() => localStorage.getItem("oab_office_sub") || "DANTAS & ASSOCIADOS");

  const handleLogin = (name?: string, oab?: string) => {
    if (name) { setUserName(name); localStorage.setItem("oab_user_name", name); }
    if (oab) { setUserOab(oab); localStorage.setItem("oab_user_oab", oab); }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("gd_auth");
    sessionStorage.removeItem("gd_auth_email");
    setIsAuthenticated(false);
  };

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("oab_demo_mode");
    return saved === null ? false : saved === "true";
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("oab_finance_ledger_v1");
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    const demo = localStorage.getItem("oab_demo_mode") === "true";
    return demo ? INITIAL_TRANSACTIONS : [];
  });

  const [priorityBills, setPriorityBills] = useState<PriorityBill[]>(() => {
    const saved = localStorage.getItem("oab_priority_bills_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((b: any) => ({ ...b, month: b.month || "2026-06" }));
      } catch { /* ignore */ }
    }
    const demo = localStorage.getItem("oab_demo_mode") === "true";
    return demo ? INITIAL_PRIORITY_BILLS.map(b => ({ ...b, month: "2026-06" })) : [];
  });

  const [selectedMonth, setSelectedMonth] = useState("2026-06");
  const [activeTab, setActiveTab] = useState<ActiveTab>("priorities");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardSubTab, setDashboardSubTab] = useState<DashboardSubTab>("overview");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false, title: "", message: "", onConfirm: () => {},
  });

  const { isLoadingCloud, syncStatus } = useCloudSync({
    isAuthenticated,
    transactions,
    priorityBills,
    setTransactions: (fn) => setTransactions(fn),
    setPriorityBills: (fn) => setPriorityBills(fn),
  });

  // Demo mode: auto-populate months with data
  useEffect(() => {
    if (!isDemoMode || !selectedMonth || selectedMonth === "ALL") return;

    setPriorityBills((prev) => {
      if (prev.some(b => b.month === selectedMonth)) return prev;
      const monthHash = selectedMonth.split("-").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const newBills = INITIAL_PRIORITY_BILLS.map((b, idx) => {
        const variance = ((monthHash + idx) % 25 - 12) / 100;
        return {
          ...b,
          id: `pb-${selectedMonth}-${b.id}-${Math.random().toString(36).substring(2, 6)}`,
          month: selectedMonth,
          amount: Math.round(b.amount * (1 + variance) * 100) / 100,
          status: (monthHash + idx) % 7 === 0 ? (b.status === "PAGAR" ? "ESPERAR" : "PAGAR") : b.status,
          paid: (monthHash + idx) % 4 === 0,
        } as PriorityBill;
      });
      return [...prev, ...newBills];
    });

    setTransactions((prev) => {
      if (prev.some(t => t.date?.substring(0, 7) === selectedMonth)) return prev;
      const monthHash = selectedMonth.split("-").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const newTxs = INITIAL_TRANSACTIONS
        .filter((_, idx) => (monthHash + idx) % 6 !== 0)
        .map((t, idx) => {
          const variance = ((monthHash + idx) % 31 - 15) / 100;
          const dayNum = Math.min(28, Math.max(1, parseInt(t.date.substring(8, 10)) || 12));
          const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
          return {
            ...t,
            id: `tx-gen-${selectedMonth}-${t.id.replace("tx-demo-", "")}-${Math.random().toString(36).substring(2, 6)}`,
            date: `${selectedMonth}-${dayStr}`,
            amount: Math.round(t.amount * (1 + variance) * 100) / 100,
          };
        });
      return [...prev, ...newTxs];
    });
  }, [selectedMonth, isDemoMode]);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem("oab_finance_ledger_v1", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("oab_priority_bills_v1", JSON.stringify(priorityBills)); }, [priorityBills]);

  const generatedMonthsList = (() => {
    const set = new Set<string>(["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    transactions.forEach(t => t.date?.length >= 7 && set.add(t.date.substring(0, 7)));
    priorityBills.forEach(b => b.month?.length >= 7 && set.add(b.month));
    return Array.from(set).sort().reverse();
  })();

  const handlePrevMonth = () => {
    if (selectedMonth === "ALL") { setSelectedMonth("2026-06"); return; }
    const [year, month] = selectedMonth.split("-").map(Number);
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    if (selectedMonth === "ALL") { setSelectedMonth("2026-06"); return; }
    const [year, month] = selectedMonth.split("-").map(Number);
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const n = (fd.get("p_name") as string)?.trim();
    const o = (fd.get("p_oab") as string)?.trim();
    const of = (fd.get("p_office") as string)?.trim().toUpperCase();
    const s = (fd.get("p_sub") as string)?.trim().toUpperCase();
    if (n) { setUserName(n); localStorage.setItem("oab_user_name", n); }
    if (o) { setUserOab(o); localStorage.setItem("oab_user_oab", o); }
    if (of) { setOfficeName(of); localStorage.setItem("oab_office_name", of); }
    if (s) { setOfficeSub(s); localStorage.setItem("oab_office_sub", s); }
    setIsEditProfileOpen(false);
  };

  const handleAddTransactions = (items: Omit<Transaction, "id">[]) => {
    setTransactions(prev => [...items.map(i => ({ ...i, id: "tx-" + Math.random().toString(36).substring(2, 11) })), ...prev]);
  };

  const handleSaveSingleTransaction = (item: Omit<Transaction, "id">) => {
    setTransactions(prev => [{ ...item, id: "tx-" + Math.random().toString(36).substring(2, 11) }, ...prev]);
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleConfirmTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: "REALIZADO" } : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Remover Lançamento",
      message: "Deseja realmente remover este lançamento de forma definitiva do seu livro caixa?",
      onConfirm: () => setTransactions(prev => prev.filter(t => t.id !== id)),
    });
  };

  const handleAddTransactionFromPriority = (item: Omit<Transaction, "id">) => {
    setTransactions(prev => [{ ...item, id: "tx-pb-" + Math.random().toString(36).substring(2, 9) }, ...prev]);
  };

  const handleUpdateCurrentMonthBills = (updatedMonthBills: PriorityBill[], targetMonth: string) => {
    setPriorityBills(prev => {
      const otherMonths = prev.filter(b => (b.month || "2026-06") !== targetMonth);
      const current = updatedMonthBills
        .filter(b => (b.month || targetMonth) === targetMonth)
        .map(b => ({ ...b, month: targetMonth }));
      const others = updatedMonthBills
        .filter(b => (b.month || targetMonth) !== targetMonth)
        .map(b => ({ ...b, month: b.month || targetMonth }));
      const otherFiltered = otherMonths.filter(old => !others.some(n => n.id === old.id));
      return [...otherFiltered, ...current, ...others];
    });
  };

  const handleResetPriorityBills = () => {
    const targetMonth = selectedMonth === "ALL" ? "2026-06" : selectedMonth;
    const [y, m] = targetMonth.split("-");
    const ptMonths = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const readableMonth = `${ptMonths[parseInt(m) - 1]} de ${y}`;
    setConfirmModal({
      isOpen: true,
      title: `Redefinir Prioridades • ${readableMonth}`,
      message: `Deseja redefinir a lista de prioridades de despesas do mês ${readableMonth} para as contas padrão?`,
      onConfirm: () => {
        setPriorityBills(prev => {
          const others = prev.filter(b => b.month !== targetMonth);
          const defaults = INITIAL_PRIORITY_BILLS.map(b => ({
            ...b,
            id: `pb-${targetMonth}-${b.id}-${Math.random().toString(36).substring(2, 6)}`,
            month: targetMonth,
            paid: false,
          }));
          return [...others, ...defaults];
        });
      },
    });
  };

  const handleResetData = () => {
    setConfirmModal({
      isOpen: true,
      title: "Restaurar Dados de Demonstração",
      message: "⚠️ Deseja ativar o Modo de Demonstração e restaurar a base de dados com lançamentos simulados de teste? Isso substituirá suas transações e faturas atuais.",
      onConfirm: () => {
        setIsDemoMode(true);
        localStorage.setItem("oab_demo_mode", "true");
        setTransactions(INITIAL_TRANSACTIONS);
        setPriorityBills(INITIAL_PRIORITY_BILLS.map(b => ({ ...b, month: "2026-06" })));
        setSelectedMonth("2026-06");
      },
    });
  };

  const handleClearLedger = () => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Todos os Lançamentos",
      message: "⚠️ Atenção! Isso excluirá permanentemente todos os lançamentos do livro caixa. Essa ação não pode ser desfeita e você começará com o saldo zerado. Deseja prosseguir?",
      onConfirm: () => setTransactions([]),
    });
  };

  const handleClearAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: "Limpar Todo o Sistema (Zerar Banco)",
      message: "⚠️ Atenção! Isso limpará permanentemente todo o Livro Caixa e os Controles de Despesas. Deseja prosseguir?",
      onConfirm: () => {
        setIsDemoMode(false);
        localStorage.setItem("oab_demo_mode", "false");
        setTransactions([]);
        setPriorityBills([]);
        localStorage.setItem("oab_finance_ledger_v1", JSON.stringify([]));
        localStorage.setItem("oab_priority_bills_v1", JSON.stringify([]));
      },
    });
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, handleLogin, handleLogout,
      transactions, priorityBills, isLoadingCloud, syncStatus, isDemoMode,
      activeTab, setActiveTab, selectedMonth, setSelectedMonth,
      handlePrevMonth, handleNextMonth, generatedMonthsList,
      mobileMenuOpen, setMobileMenuOpen,
      dashboardSubTab, setDashboardSubTab,
      userName, userOab, officeName, officeSub,
      isEditProfileOpen, setIsEditProfileOpen, handleSaveProfile,
      handleAddTransactions, handleSaveSingleTransaction,
      handleUpdateTransaction, handleConfirmTransaction,
      handleDeleteTransaction, handleAddTransactionFromPriority,
      handleUpdateCurrentMonthBills, handleResetPriorityBills,
      handleResetData, handleClearAllData, handleClearLedger,
      confirmModal, setConfirmModal,
      isModalOpen, setIsModalOpen,
      transactionToEdit, setTransactionToEdit,
    }}>
      {children}
    </AppContext.Provider>
  );
}
