import React, { useState, useEffect } from "react";
import { Transaction, TransactionScope, TransactionType } from "./types";
import { INITIAL_TRANSACTIONS } from "./mockData";
import { 
  Plus, 
  HelpCircle, 
  Sparkles, 
  LayoutDashboard, 
  Briefcase, 
  FileSpreadsheet, 
  FileCheck2, 
  Scale, 
  CloudSun,
  Github,
  AlertTriangle,
  RotateCcw,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Save,
  Building,
  MessageSquare,
  Trash2,
  Mail,
  Lock,
  User,
  UserPlus,
  Eye,
  EyeOff,
  LogIn,
  Target,
  UserCheck,
  Database
} from "lucide-react";

import DashboardStats from "./components/DashboardStats";
import CashFlowChart from "./components/CashFlowChart";
import CategoryPieChart from "./components/CategoryPieChart";
import AISeparator from "./components/AISeparator";
import TransactionList from "./components/TransactionList";
import MonthlyReport from "./components/MonthlyReport";
import NewTransactionModal from "./components/NewTransactionModal";
import ExpensePrioritizer from "./components/ExpensePrioritizer";
import WhatsAppTab from "./components/WhatsAppTab";
import { ContractGoalsSim } from "./components/ContractGoalsSim";
import ForecastComparison from "./components/ForecastComparison";
import CategoryChartsView from "./components/CategoryChartsView";
import LoginPage from "./components/LoginPage";
import { INITIAL_PRIORITY_BILLS } from "./mockData";
import { PriorityBill } from "./types";
import { getFirestoreUser, createFirestoreUser, getAllFirestoreUsers, FirestoreUser } from "./lib/usersDb";
import CloudUsersTab from "./components/CloudUsersTab";
import { getUserFinancials, saveUserFinancials } from "./lib/financeDb";



export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    () => sessionStorage.getItem("gd_auth") === "true"
  );

  const handleLogin = (name?: string, oab?: string) => {
    if (name) {
      setUserName(name);
      localStorage.setItem("oab_user_name", name);
    }
    if (oab) {
      setUserOab(oab);
      localStorage.setItem("oab_user_oab", oab);
    }
    setIsAuthenticated(true);
  };
  const handleLogout = () => {
    sessionStorage.removeItem("gd_auth");
    sessionStorage.removeItem("gd_auth_email");
    setIsAuthenticated(false);
  };

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("oab_demo_mode");
    if (saved === null) {
      return false; // Pristine, empty real world mode by default for user's manual records!
    }
    return saved === "true";
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("oab_finance_ledger_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar dados salvos:", e);
      }
    }
    const savedDemo = localStorage.getItem("oab_demo_mode");
    const demo = savedDemo === null ? false : savedDemo === "true";
    return demo ? INITIAL_TRANSACTIONS : [];
  });

  const [priorityBills, setPriorityBills] = useState<PriorityBill[]>(() => {
    const saved = localStorage.getItem("oab_priority_bills_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((b: any) => ({
            ...b,
            month: b.month || "2026-06"
          }));
        }
      } catch (e) {
        console.error("Erro ao carregar contas de priorização:", e);
      }
    }
    const savedDemo = localStorage.getItem("oab_demo_mode");
    const demo = savedDemo === null ? false : savedDemo === "true";
    return demo ? INITIAL_PRIORITY_BILLS.map(b => ({
      ...b,
      month: "2026-06"
    })) : [];
  });

  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error" | "offline">("synced");

  // Fetch financials from Firestore on mount or login
  useEffect(() => {
    if (!isAuthenticated) return;
    const email = sessionStorage.getItem("gd_auth_email");
    if (!email) return;

    const fetchCloudData = async () => {
      setIsLoadingCloud(true);
      setSyncStatus("syncing");
      try {
        const cloudData = await getUserFinancials(email);
        if (cloudData) {
          setTransactions(cloudData.transactions || []);
          setPriorityBills(cloudData.priorityBills || []);
          setSyncStatus("synced");
        } else {
          // If no cloud data exists (e.g. new user), migrate current local storage data
          const localTx = transactions;
          const localBills = priorityBills;
          if (localTx.length > 0 || localBills.length > 0) {
            await saveUserFinancials(email, {
              transactions: localTx,
              priorityBills: localBills
            });
          }
          setSyncStatus("synced");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do Firestore:", error);
        setSyncStatus("error");
      } finally {
        setIsLoadingCloud(false);
      }
    };

    fetchCloudData();
  }, [isAuthenticated]);

  // Sync mutations to Firestore (debounced by 1s)
  useEffect(() => {
    if (isLoadingCloud) return;
    const email = sessionStorage.getItem("gd_auth_email");
    if (!email || !isAuthenticated) return;

    const handler = setTimeout(async () => {
      setSyncStatus("syncing");
      const success = await saveUserFinancials(email, {
        transactions,
        priorityBills
      });
      if (success) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("error");
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [transactions, priorityBills, isAuthenticated, isLoadingCloud]);

  // Detect internet connection changes for status indicator
  useEffect(() => {
    const handleOnline = () => setSyncStatus("synced");
    const handleOffline = () => setSyncStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>("2026-06"); // Defaults to June 2026

  // Auto-populate selected month with templates if it has no bills or transactions (ONLY IF DEMO MODE IS ACTIVE)
  useEffect(() => {
    if (isDemoMode && selectedMonth && selectedMonth !== "ALL") {
      // 1. POPULATE PRIORITY BILLS (with variations so they don't look exactly the same across months)
      setPriorityBills((prev) => {
        const hasBills = prev.some((b) => b.month === selectedMonth);
        if (!hasBills) {
          // Generate a deterministic offset based on the selected month string to keep amounts consistent
          const monthHash = selectedMonth.split("-").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          
          const newMonthBills = INITIAL_PRIORITY_BILLS.map((b, idx) => {
            // Apply a slight deterministic variation to make numbers distinct per month (e.g. ±12%)
            const variancePercent = ((monthHash + idx) % 25 - 12) / 100;
            const amount = Math.round(b.amount * (1 + variancePercent) * 100) / 100;
            
            // Randomly set some bills as already paid in other months to make them look realistic
            const paid = (monthHash + idx) % 4 === 0;

            // Shift some statuses dynamically for variety
            let status = b.status;
            if ((monthHash + idx) % 7 === 0) {
              status = b.status === "PAGAR" ? "ESPERAR" : "PAGAR";
            }

            return {
              ...b,
              id: `pb-${selectedMonth}-${b.id}-${Math.random().toString(36).substring(2, 6)}`,
              month: selectedMonth,
              amount,
              status,
              paid,
            };
          });
          return [...prev, ...newMonthBills];
        }
        return prev;
      });

      // 2. POPULATE TRANSACTIONS LEDGER (so cash flow charts, balances, stats and graphics are completely alive!)
      setTransactions((prev) => {
        const hasTransactions = prev.some((t) => t.date && t.date.substring(0, 7) === selectedMonth);
        if (!hasTransactions) {
          const monthHash = selectedMonth.split("-").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          
          const newMonthTransactions = INITIAL_TRANSACTIONS.map((t, idx) => {
            // Apply unique variation to transaction amounts (e.g. ±15%)
            const variancePercent = ((monthHash + idx) % 31 - 15) / 100;
            const amount = Math.round(t.amount * (1 + variancePercent) * 100) / 100;
            
            // Adjust day representation: map days from template range (01 to 28)
            const origDay = t.date.substring(8, 10);
            const dayNum = Math.min(28, Math.max(1, parseInt(origDay) || 12));
            const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
            const date = `${selectedMonth}-${dayStr}`;

            return {
              ...t,
              id: `tx-gen-${selectedMonth}-${t.id.replace("tx-demo-", "")}-${Math.random().toString(36).substring(2, 6)}`,
              date,
              amount,
            };
          }).filter((_, idx) => {
            // Include/Exclude randomly to give unique counts/items per month
            return (monthHash + idx) % 6 !== 0;
          });

          return [...prev, ...newMonthTransactions];
        }
        return prev;
      });
    }
  }, [selectedMonth, isDemoMode]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai" | "ledger" | "priorities" | "report" | "whatsapp" | "metas" | "users">("priorities");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardSubTab, setDashboardSubTab] = useState<"overview" | "forecast" | "categories">("overview");

  // Profile customization states
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("oab_user_name") || "Dr. Gustavo Dantas";
  });
  const [userOab, setUserOab] = useState<string>(() => {
    return localStorage.getItem("oab_user_oab") || "OAB/SP 123.456";
  });
  const [officeName, setOfficeName] = useState<string>(() => {
    return localStorage.getItem("oab_office_name") || "JURISFINANCE AI";
  });
  const [officeSub, setOfficeSub] = useState<string>(() => {
    return localStorage.getItem("oab_office_sub") || "DANTAS & ASSOCIADOS";
  });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Sync with local storage
  useEffect(() => {
    localStorage.setItem("oab_finance_ledger_v1", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("oab_priority_bills_v1", JSON.stringify(priorityBills));
  }, [priorityBills]);

  const handleResetPriorityBills = () => {
    const targetMonth = selectedMonth === "ALL" ? "2026-06" : selectedMonth;
    const formattedMonth = targetMonth.split("-").reverse().join("/");
    setConfirmModal({
      isOpen: true,
      title: `Redefinir Prioridades • ${formattedMonth}`,
      message: `Deseja redefinir a lista de prioridades de despesas do mês ${formattedMonth} para as contas padrão (R$ 8.519,00 PAGAR / R$ 6.507,00 ESPERAR)?`,
      onConfirm: () => {
        setPriorityBills((prev) => {
          const otherMonthsBills = prev.filter((b) => b.month !== targetMonth);
          const defaultBillsForMonth = INITIAL_PRIORITY_BILLS.map((b) => ({
            ...b,
            id: `pb-${targetMonth}-${b.id}-${Math.random().toString(36).substring(2, 6)}`,
            month: targetMonth,
            paid: false,
          }));
          return [...otherMonthsBills, ...defaultBillsForMonth];
        });
      }
    });
  };

  const handleAddTransactions = (newItems: Omit<Transaction, "id">[]) => {
    const withIds = newItems.map((item) => ({
      ...item,
      id: "tx-" + Math.random().toString(36).substring(2, 11),
    }));
    setTransactions((prev) => [...withIds, ...prev]);
  };

  const handleSaveSingleTransaction = (item: Omit<Transaction, "id">) => {
    const withId = {
      ...item,
      id: "tx-" + Math.random().toString(36).substring(2, 11),
    };
    setTransactions((prev) => [withId, ...prev]);
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleConfirmTransaction = (id: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "REALIZADO" } : t)));
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Remover Lançamento",
      message: "Deseja realmente remover este lançamento de forma definitiva do seu livro caixa?",
      onConfirm: () => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
    });
  };

  const handleResetData = () => {
    setConfirmModal({
      isOpen: true,
      title: "Restaurar Dados de Demonstração",
      message: "⚠️ Deseja ativar o Modo de Demonstração e restaurar a base de dados restaurando lançamentos simulados de teste? Isso substituirá suas transações e faturas atuais.",
      onConfirm: () => {
        setIsDemoMode(true);
        localStorage.setItem("oab_demo_mode", "true");
        setTransactions(INITIAL_TRANSACTIONS);
        setPriorityBills(INITIAL_PRIORITY_BILLS.map(b => ({ ...b, month: "2026-06" })));
        setSelectedMonth("2026-06");
      }
    });
  };

  const handleClearAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: "Limpar Todo o Sistema (Zerar Banco)",
      message: "⚠️ Atenção! Isso limpará de forma permanente todo o Livro Caixa e os Controles de Despesas, e o sistema ficará 100% limpo para você cadastrar seus dados reais manualmente. Deseja prosseguir?",
      onConfirm: () => {
        setIsDemoMode(false);
        localStorage.setItem("oab_demo_mode", "false");
        setTransactions([]);
        setPriorityBills([]);
        localStorage.setItem("oab_finance_ledger_v1", JSON.stringify([]));
        localStorage.setItem("oab_priority_bills_v1", JSON.stringify([]));
      }
    });
  };

  // Profile Save action
  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newName = formData.get("p_name") as string;
    const newOab = formData.get("p_oab") as string;
    const newOffice = formData.get("p_office") as string;
    const newSub = formData.get("p_sub") as string;

    if (newName && newName.trim()) {
      setUserName(newName.trim());
      localStorage.setItem("oab_user_name", newName.trim());
    }
    if (newOab && newOab.trim()) {
      setUserOab(newOab.trim());
      localStorage.setItem("oab_user_oab", newOab.trim());
    }
    if (newOffice && newOffice.trim()) {
      setOfficeName(newOffice.trim().toUpperCase());
      localStorage.setItem("oab_office_name", newOffice.trim().toUpperCase());
    }
    if (newSub && newSub.trim()) {
      setOfficeSub(newSub.trim().toUpperCase());
      localStorage.setItem("oab_office_sub", newSub.trim().toUpperCase());
    }
    setIsEditProfileOpen(false);
  };

  // Navigation functions for previous and next fiscal months
  const handlePrevMonth = () => {
    if (selectedMonth === "ALL") {
      setSelectedMonth("2026-06");
      return;
    }
    const [year, month] = selectedMonth.split("-").map(Number);
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth === 0) {
      newMonth = 12;
      newYear = year - 1;
    }
    const newMonthStr = newMonth < 10 ? `0${newMonth}` : `${newMonth}`;
    setSelectedMonth(`${newYear}-${newMonthStr}`);
  };

  const handleNextMonth = () => {
    if (selectedMonth === "ALL") {
      setSelectedMonth("2026-06");
      return;
    }
    const [year, month] = selectedMonth.split("-").map(Number);
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth === 13) {
      newMonth = 1;
      newYear = year + 1;
    }
    const newMonthStr = newMonth < 10 ? `0${newMonth}` : `${newMonth}`;
    setSelectedMonth(`${newYear}-${newMonthStr}`);
  };

  // Generate expanded list of selectable months in order to satisfy viewing past & next months/years
  const generatedMonthsList = (() => {
    const monthsSet = new Set<string>();
    
    // Seed with active fiscal months around mid-2026 for easy navigation
    const coreMonths = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
    coreMonths.forEach(m => monthsSet.add(m));

    // Add any manual dates outer range from transactions or priority bills
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });

    priorityBills.forEach((b) => {
      if (b.month && b.month.length >= 7) {
        monthsSet.add(b.month);
      }
    });

    return Array.from(monthsSet).sort().reverse();
  })();


  // Login gate
  if (!isAuthenticated) {
    return (
      <LoginPage onLogin={handleLogin} />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col md:flex-row font-sans">
      {/* MOBILE ACTIONS HEADER BAR */}
      <div className="md:hidden bg-[#0f172a] text-white p-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#8b5cf6]" />
          <span className="font-bold text-xs uppercase tracking-wider font-display">{officeSub}</span>
        </div>
        <button 
          id="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 px-2 text-slate-300 hover:text-white transition-colors border border-slate-800 rounded bg-slate-900/60"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* PERSISTENT LEFT SIDEBAR FOR HIGH DENSITY THEME */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1d]/95 backdrop-blur-md md:bg-[#0a0f1d] text-white flex flex-col p-5 border-r border-[#1a2333]/40 transition-transform duration-300
        md:translate-x-0 md:sticky md:top-0 md:flex md:h-screen shrink-0 overflow-y-auto
        ${mobileMenuOpen ? "translate-x-0 font-sans" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Sidebar Brand Header */}
        <div className="flex items-center gap-3 mb-7 border-b border-[#1e293b]/50 pb-5">
          <div className="bg-[#8b5cf6]/10 p-2.5 rounded-xl text-[#a78bfa] border border-[#8b5cf6]/20 shadow-inner flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-slate-100 font-display leading-tight">{officeName}</h1>
            <p className="text-[10px] text-[#a78bfa] font-semibold tracking-widest font-mono uppercase mt-0.5">{officeSub}</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1.5 flex-grow font-sans">
          {/* Dashboard Tab */}
          <button
            id="nav-tab-dashboard"
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-blue-950/40 to-slate-900/30 text-white font-bold border-l-4 border-[#2563eb] shadow-md shadow-blue-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 transition-transform duration-200 ${activeTab === "dashboard" ? "scale-110 text-[#3b82f6]" : "text-slate-400"}`} />
            <span>Dashboard Geral</span>
          </button>

          {/* AI Reconciliation Tab */}
          <button
            id="nav-tab-ai"
            onClick={() => { setActiveTab("ai"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "ai"
                ? "bg-gradient-to-r from-violet-950/40 to-slate-900/30 text-white font-bold border-l-4 border-[#8b5cf6] shadow-md shadow-violet-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className={`w-4 h-4 transition-transform duration-200 ${activeTab === "ai" ? "scale-110 text-[#a78bfa] animate-pulse" : "text-slate-400"}`} />
            <span>Conciliação com IA</span>
          </button>

          {/* Ledger Tab */}
          <button
            id="nav-tab-ledger"
            onClick={() => { setActiveTab("ledger"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "ledger"
                ? "bg-gradient-to-r from-emerald-950/40 to-slate-900/30 text-white font-bold border-l-4 border-[#10b981] shadow-md shadow-emerald-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 transition-transform duration-200 ${activeTab === "ledger" ? "scale-110 text-[#34d399]" : "text-slate-400"}`} />
            <span>Livro Caixa (Ledger)</span>
          </button>

          {/* Priorities Tab */}
          <button
            id="nav-tab-priorities"
            onClick={() => { setActiveTab("priorities"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "priorities"
                ? "bg-gradient-to-r from-amber-950/40 to-slate-900/30 text-white font-bold border-l-4 border-amber-500 shadow-md shadow-amber-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Briefcase className={`w-4 h-4 transition-transform duration-200 ${activeTab === "priorities" ? "scale-110 text-amber-400" : "text-slate-400"}`} />
            <span>Priorização de Contas</span>
          </button>

          {/* Contract Goals Tab */}
          <button
            id="nav-tab-metas"
            onClick={() => { setActiveTab("metas"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "metas"
                ? "bg-gradient-to-r from-indigo-950/40 to-slate-900/30 text-white font-bold border-l-4 border-indigo-500 shadow-md shadow-indigo-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Target className={`w-4 h-4 transition-transform duration-200 ${activeTab === "metas" ? "scale-110 text-indigo-400" : "text-slate-400"}`} />
            <span>Metas de Contratos</span>
          </button>

          {/* Report Tab */}
          <button
            id="nav-tab-report"
            onClick={() => { setActiveTab("report"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "report"
                ? "bg-gradient-to-r from-rose-950/40 to-slate-900/30 text-white font-bold border-l-4 border-[#ef4444] shadow-md shadow-rose-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileCheck2 className={`w-4 h-4 transition-transform duration-200 ${activeTab === "report" ? "scale-110 text-red-400" : "text-slate-400"}`} />
            <span>Relatório de Caixa</span>
          </button>

          {/* WhatsApp Tab */}
          <button
            id="nav-tab-whatsapp"
            onClick={() => { setActiveTab("whatsapp"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "whatsapp"
                ? "bg-gradient-to-r from-teal-950/40 to-slate-900/30 text-white font-bold border-l-4 border-[#128c7e] shadow-md shadow-teal-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className={`w-4 h-4 transition-transform duration-200 ${activeTab === "whatsapp" ? "scale-110 text-emerald-400" : "text-slate-400"}`} />
            <span>Integração WhatsApp</span>
          </button>

          {/* Cloud Users Tab */}
          <button
            id="nav-tab-users"
            onClick={() => { setActiveTab("users"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:translate-x-1 ${
              activeTab === "users"
                ? "bg-gradient-to-r from-purple-950/40 to-slate-900/30 text-white font-bold border-l-4 border-violet-500 shadow-md shadow-violet-900/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <UserCheck className={`w-4 h-4 transition-transform duration-200 ${activeTab === "users" ? "scale-110 text-violet-400" : "text-slate-400"}`} />
            <span>Usuários Registrados (Nuvem)</span>
          </button>
        </nav>

        {/* Sidebar Footer Info */}
        <div className="mt-auto border-t border-slate-800 pt-3 text-[10px] text-slate-500 space-y-2.5">
          <button
            id="sidebar-edit-profile-action"
            onClick={() => { setIsEditProfileOpen(true); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-violet-600/20 hover:bg-violet-600/35 text-violet-300 hover:text-white rounded text-[10px] font-bold border border-violet-700/30 font-sans cursor-pointer transition-all"
          >
            <Edit3 className="w-3 h-3" />
            Editar Nome / Escritório
          </button>
          
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-bold text-slate-300">V1.4.2 - Licença Premium</p>
            <div className="flex items-center gap-1.5 text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>Sistema Operacional</span>
            </div>
          </div>
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE DRAW MENU */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 md:hidden"
        />
      )}

      {/* RIGHT-HAND MAIN WORKING CONTAINER */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        
        {/* NEW COHESIVE UPPER CONTROLLERS BAR inside content - Space Saving Redesign */}
        <header className="bg-white border-b border-[#e2e8f0] py-2 px-4 sticky top-0 z-30 shadow-xs min-h-[52px] flex items-center">
          <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Context Titles & Core Tab Indicator */}
            <div className="flex items-center gap-2">
              <button 
                id="mobile-menu-toggle-header"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 rounded-md bg-slate-50 cursor-pointer"
                title="Abrir Menu Lateral"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block"></span>
                <span className="text-xs font-bold text-slate-700 tracking-wide font-sans">
                  Controladoria Financeira
                </span>
                <span className="text-[8px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100 hidden sm:inline-block font-extrabold tracking-wider uppercase select-none">
                  Ambiente Seguro
                </span>
                
                {/* Sync status badge */}
                {syncStatus === "syncing" && (
                  <span className="text-[8px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                    Supabase: Sincronizando
                  </span>
                )}
                {syncStatus === "synced" && (
                  <span className="text-[8px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Supabase: Sincronizado
                  </span>
                )}
                {syncStatus === "error" && (
                  <span className="text-[8px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full border border-rose-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none animate-bounce" title="Erro ao salvar alterações no banco de dados Firestore.">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Erro na Nuvem
                  </span>
                )}
                {syncStatus === "offline" && (
                  <span className="text-[8px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100 font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Modo Offline
                  </span>
                )}
              </div>
            </div>

            {/* Concise and tightly grouped interactive actions */}
            <div className="flex items-center flex-wrap gap-1.5 justify-end">
              
              {/* Competence box - highly compact */}
              <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-md border border-[#e2e8f0]">
                <button
                  id="header-prev-month-btn"
                  onClick={handlePrevMonth}
                  disabled={selectedMonth === "ALL"}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>

                <div className="flex items-center px-1">
                  <select
                    id="competence-select-header"
                    className="bg-transparent text-[11px] text-slate-700 font-bold focus:outline-hidden cursor-pointer"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="ALL">Todo Período</option>
                    {generatedMonthsList.map((m) => {
                      const parts = m.split("-");
                      const ptMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                      const mLabel = `${ptMonths[parseInt(parts[1]) - 1]} ${parts[0]}`;
                      return (
                        <option key={m} value={m}>
                          {mLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  id="header-next-month-btn"
                  onClick={handleNextMonth}
                  disabled={selectedMonth === "ALL"}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* New entry trigger (Compact adaptativo) */}
              <button
                id="header-new-record-btn"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-all shadow-xs shrink-0 cursor-pointer select-none"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline font-sans">Lançar Movimentação</span>
                <span className="sm:hidden font-sans">Lançar</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

              {/* User Profile Badge (Minimalist & Premium) */}
              <button
                id="header-profile-btn"
                onClick={() => setIsEditProfileOpen(true)}
                className="flex items-center gap-1.5 pl-1 py-0.5 text-left hover:opacity-85 transition-all cursor-pointer group"
                title={`Configurar: ${userName} (${userOab})`}
              >
                <div className="w-7 h-7 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] font-extrabold text-[10px] flex items-center justify-center border border-[#8b5cf6]/20 shadow-xs group-hover:bg-[#8b5cf6]/20 transition-all">
                  {userName ? userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "GD"}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-[10px] font-bold text-slate-700 leading-none flex items-center gap-0.5 group-hover:text-indigo-600 transition-colors">
                    {userName ? userName.split(" ")[0] : "Doutor"}
                    <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-500 inline" />
                  </div>
                </div>
              </button>

              {/* Sair do sistema (Icon only, modern & minimalist) */}
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-[#e2e8f0] transition-colors cursor-pointer bg-white"
                title="Sair do sistema"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-red-600"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>

            </div>
          </div>
        </header>

        {/* DETAILED WORKSPACE VIEW AREA */}
        <main className="flex-grow p-4 lg:p-6 space-y-6 relative">
          {isLoadingCloud && (
            <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-3 py-20 rounded-xl">
              <div className="w-10 h-10 border-4 border-violet-500/35 border-t-violet-600 rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500 animate-pulse font-sans">Sincronizando com o Banco de Dados Supabase...</p>
            </div>
          )}
        
        {/* VIEW 1: PANEL / CONTROLLER VIEW */}
        {/* VIEW 1: PANEL / CONTROLLER VIEW */}
        {activeTab === "dashboard" && (
          <div id="view-dashboard-container" className="space-y-6">
            
            {/* Indicators Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-l-4 border-indigo-600 pl-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Demonstrativo de Integração PJ/PF</h2>
                <p className="text-xs text-slate-500">Separador inteligente e monitor de mistura patrimonial para advogados titulares</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono italic">Atualizado hoje às {new Date().toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}</span>
            </div>

            {/* Dashboard Sub-Tabs Selector */}
            <div className="flex border-b border-slate-200 pb-0.5 overflow-x-auto scrollbar-none font-sans gap-2">
              <button
                type="button"
                onClick={() => setDashboardSubTab("overview")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  dashboardSubTab === "overview"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                📊 Visão Geral
              </button>
              <button
                type="button"
                onClick={() => setDashboardSubTab("forecast")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  dashboardSubTab === "forecast"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                ⚖️ Previsto x Realizado
              </button>
              <button
                type="button"
                onClick={() => setDashboardSubTab("categories")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  dashboardSubTab === "categories"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                🍩 Gráficos por Categoria
              </button>
            </div>

            {dashboardSubTab === "overview" && (
              <div className="space-y-6 animate-slide-up">
                {/* Cards Stats Indicators */}
                <DashboardStats transactions={transactions} selectedMonth={selectedMonth} />

                {/* Charts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <CashFlowChart transactions={transactions} />
                  </div>
                  <div className="xl:col-span-1">
                    {/* Embedded quick guidelines card */}
                    <div id="dashboard-guidelines-box" className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between h-full min-h-[340px]">
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
                        id="goto-ai-tab-btn"
                        onClick={() => { setActiveTab("ai"); setMobileMenuOpen(false); }}
                        className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Ir para Separador com IA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bento Categories Distribuction */}
                <CategoryPieChart transactions={transactions} selectedMonth={selectedMonth} />
              </div>
            )}

            {dashboardSubTab === "forecast" && (
              <ForecastComparison 
                transactions={transactions} 
                selectedMonth={selectedMonth} 
                onConfirmTransaction={handleConfirmTransaction} 
              />
            )}

            {dashboardSubTab === "categories" && (
              <CategoryChartsView 
                transactions={transactions} 
                selectedMonth={selectedMonth} 
              />
            )}
          </div>
        )}

        {/* VIEW 2: AI CONCILIATOR SCREEN */}
        {activeTab === "ai" && (
          <div id="view-ai-container" className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-l-4 border-indigo-600 pl-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Alocação por Inteligência Artificial</h2>
                <p className="text-xs text-slate-500">Mecanismo para processar extratos bancários e classificar dados sem digitação manual</p>
              </div>
            </div>

            <AISeparator onAddTransactions={handleAddTransactions} />
          </div>
        )}

        {/* VIEW 3: LEDGER INTEGRATED SYSTEM JOURNAL */}
        {activeTab === "ledger" && (
          <div id="view-ledger-container" className="space-y-6">
            <div className="flex justify-between items-center border-l-4 border-indigo-600 pl-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Livro de Movimentações (Ledger)</h2>
                <p className="text-xs text-slate-500">Demonstrativo geral das receitas e despesas registradas</p>
              </div>
            </div>

            <TransactionList
              transactions={transactions}
              selectedMonth={selectedMonth}
              onSetSelectedMonth={setSelectedMonth}
              onDeleteTransaction={handleDeleteTransaction}
              onConfirmTransaction={handleConfirmTransaction}
              onEditTransaction={(tx) => {
                setTransactionToEdit(tx);
                setIsModalOpen(true);
              }}
              onTriggerNewTransaction={() => {
                setTransactionToEdit(null);
                setIsModalOpen(true);
              }}
              onClearAllTransactions={() => {
                setConfirmModal({
                  isOpen: true,
                  title: "Excluir Todos os Lançamentos",
                  message: "⚠️ Atenção! Isso excluirá permanentemente todos os lançamentos do livro caixa. Essa ação não pode ser desfeita e você começará com o saldo zerado. Deseja prosseguir?",
                  onConfirm: () => {
                    setTransactions([]);
                  }
                });
              }}
            />
          </div>
        )}

        {/* VIEW 4: MONTH CONSOLIDATED REPORT */}
        {activeTab === "report" && (
          <div id="view-report-container" className="space-y-6">
            <div className="flex justify-between items-center border-l-4 border-indigo-600 pl-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Relatório Consolidado para Contabilidade</h2>
                <p className="text-xs text-slate-500">Gere resumos analíticos prontos para exportar ou imprimir</p>
              </div>
            </div>

            <MonthlyReport transactions={transactions} selectedMonth={selectedMonth} onSetSelectedMonth={setSelectedMonth} />
          </div>
        )}

        {/* VIEW 5: ACCOUNT PRIORITIES MANAGEMENT PANEL */}
        {activeTab === "priorities" && (() => {
          const targetMonthForPriorities = selectedMonth === "ALL" ? "2026-06" : selectedMonth;
          const currentMonthBills = priorityBills.filter(b => b.month === targetMonthForPriorities);

          const handleUpdateCurrentMonthBills = (updatedMonthBills: PriorityBill[]) => {
            setPriorityBills((prev) => {
              const otherMonthsBills = prev.filter(b => (b.month || "2026-06") !== targetMonthForPriorities);
              
              const currentMonthProcessed = updatedMonthBills
                .filter(b => (b.month || targetMonthForPriorities) === targetMonthForPriorities)
                .map(b => ({ ...b, month: targetMonthForPriorities }));
                
              const otherMonthsProcessed = updatedMonthBills
                .filter(b => (b.month || targetMonthForPriorities) !== targetMonthForPriorities)
                .map(b => ({ ...b, month: b.month || targetMonthForPriorities }));

              const otherMonthsFiltered = otherMonthsBills.filter(
                oldBill => !otherMonthsProcessed.some(newBill => newBill.id === oldBill.id)
              );

              return [...otherMonthsFiltered, ...currentMonthProcessed, ...otherMonthsProcessed];
            });
          };

          const parts = targetMonthForPriorities.split("-");
          const ptMonths = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
          const readableMonth = `${ptMonths[parseInt(parts[1]) - 1]} de ${parts[0]}`;

          return (
            <div id="view-priorities-container" className="space-y-6">
              <div className="flex justify-between items-center border-l-4 border-indigo-600 pl-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Priorização de Despesas de Caixa ({readableMonth})</h2>
                  <p className="text-xs text-slate-500">Abater ou reter despesas e compromissos fiscais de {readableMonth}: Pagar vs Esperar</p>
                </div>
              </div>

              <ExpensePrioritizer
                bills={currentMonthBills}
                onUpdateBills={handleUpdateCurrentMonthBills}
                onResetBills={handleResetPriorityBills}
                selectedMonth={targetMonthForPriorities}
                onSetSelectedMonth={setSelectedMonth}
                onAddTransactionToLedger={(item) => {
                  const newTx: Transaction = {
                    id: "tx-pb-" + Math.random().toString(36).substring(2, 9),
                    date: item.date,
                    description: item.description,
                    type: TransactionType.EXPENSE,
                    scope: item.scope,
                    category: item.category,
                    amount: item.amount,
                    paymentMethod: "Outros",
                    notes: `Registrado via painel de priorização de despesas de ${readableMonth}.`,
                  };
                  setTransactions((prev) => [newTx, ...prev]);
                }}
              />
            </div>
          );
        })()}

        {/* VIEW 6: WHATSAPP SYSTEM TAB */}
        {activeTab === "whatsapp" && (
          <WhatsAppTab bills={priorityBills} />
        )}

        {/* VIEW 7: CONTRACT CLOSING GOALS & SERVICES PRICING SIMULATOR */}
        {activeTab === "metas" && (() => {
          const targetMonth = selectedMonth === "ALL" ? "2026-06" : selectedMonth;
          const collectedRevenue = transactions
            .filter(t => {
              const compMatches = selectedMonth === "ALL" || t.date.substring(0, 7) === selectedMonth;
              return compMatches && t.scope === TransactionScope.PROFESSIONAL && t.type === TransactionType.REVENUE;
            })
            .reduce((sum, t) => sum + t.amount, 0);

          const handleAddSimulatedTransaction = (description: string, amount: number, category: string) => {
            const targetDate = selectedMonth === "ALL" ? "2026-06-18" : `${selectedMonth}-18`;
            handleSaveSingleTransaction({
              date: targetDate,
              description,
              type: TransactionType.REVENUE,
              scope: TransactionScope.PROFESSIONAL,
              category,
              amount,
              paymentMethod: "Pix",
              notes: "Contrato efetivado automaticamente a partir do Simulador de Metas de Fechamento."
            });
          };

          return (
            <div id="view-metas-container" className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-l-4 border-indigo-600 pl-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Metas de Fechamento de Contratos Jurídicos</h2>
                  <p className="text-xs text-slate-500">Planeje seu faturamento bruto simulando fechamentos de serviços jurídicos sugeridos</p>
                </div>
              </div>

              <ContractGoalsSim
                currentCollectedRevenue={collectedRevenue}
                selectedMonth={targetMonth}
                onAddTransaction={handleAddSimulatedTransaction}
              />
            </div>
          );
        })()}

        {/* VIEW 8: REGISTERED USERS CLOUD AUDIT PANEL */}
        {activeTab === "users" && (
          <CloudUsersTab />
        )}

      </main>

      {/* PERSISTENT MANUALLY MODAL FORM ENTRY */}
      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSave={handleSaveSingleTransaction}
        onSaveBulk={handleAddTransactions}
        onUpdate={handleUpdateTransaction}
        initialTransaction={transactionToEdit}
      />

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div id="edit-profile-modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-950 text-white p-4">
              <div className="flex items-center gap-1.5 font-sans">
                <Building className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold tracking-tight">Personalização da Plataforma</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                id="close-profile-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Nome do Advogado Titular / Proprietário</label>
                <input
                  type="text"
                  name="p_name"
                  defaultValue={userName}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-sans text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Documento Executivo (OAB ou CPF/CNPJ)</label>
                <input
                  type="text"
                  name="p_oab"
                  defaultValue={userOab}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-sans text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Razão Social / Nome Fantasia do Escritório PJ</label>
                <input
                  type="text"
                  name="p_office"
                  defaultValue={officeName}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-mono text-slate-800 uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Assinatura Visual / Subnome Institucional</label>
                <input
                  type="text"
                  name="p_sub"
                  defaultValue={officeSub}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 font-mono text-slate-800 uppercase"
                  required
                />
              </div>

              {/* Maintenance Tools */}
              <div className="border-t border-slate-100 pt-3.5 space-y-2 text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações do Banco de Dados</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditProfileOpen(false);
                      handleResetData();
                    }}
                    className="py-2 px-2.5 border border-indigo-200 hover:border-indigo-300 text-indigo-700 hover:bg-indigo-50/20 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer text-center"
                    title="Carrega dados de demonstração de simulação para exploração rápida de relatórios e IA"
                  >
                    🧪 Carrega Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditProfileOpen(false);
                      handleClearAllData();
                    }}
                    className="py-2 px-2.5 border border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50/20 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer text-center"
                    title="Apaga todo o histórico e zera as faturas e movimentações"
                  >
                    🗑️ Zerar Sistema
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM SYSTEM FOOTER */}
      <footer className="bg-white border-t border-[#e2e8f0] py-4 px-6 text-xs text-[#64748b] mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-[#8b5cf6]" />
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

      {/* Elegante Modal de Confirmação Customizado (substituto seguro do confirm do navegador) */}
      {confirmModal.isOpen && (
        <div id="custom-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">{confirmModal.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{confirmModal.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer bg-slate-100 border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    confirmModal.onConfirm();
                  } catch (err) {
                    console.error("Erro ao executar confirmação:", err);
                  }
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
