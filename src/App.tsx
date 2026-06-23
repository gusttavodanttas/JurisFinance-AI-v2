import React, { useState, useEffect, useCallback } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import AppHeader from "./components/layout/AppHeader";
import MainContent from "./components/layout/MainContent";
import EditProfileModal from "./components/layout/EditProfileModal";
import ConfirmModal from "./components/layout/ConfirmModal";
import NewTransactionModal from "./components/NewTransactionModal";
import CommandPalette from "./components/CommandPalette";

function AppShell() {
  const {
    isAuthenticated, handleLogin,
    isModalOpen, setIsModalOpen,
    transactionToEdit, setTransactionToEdit,
    handleSaveSingleTransaction, handleAddTransactions, handleUpdateTransaction,
    mobileMenuOpen, setMobileMenuOpen,
    transactions, priorityBills,
    setActiveTab, setIsModalOpen: openModal,
  } = useApp();

  const [cmdOpen, setCmdOpen] = useState(false);

  // Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Badge on document.title: count PAGAR bills due today or overdue
  useEffect(() => {
    if (!isAuthenticated) return;
    const today = new Date().toISOString().substring(0, 10);
    const [ty, tm] = today.split("-");
    const todayDay = parseInt(today.split("-")[2]);
    const urgentCount = priorityBills.filter(b => {
      if (b.paid || b.status !== "PAGAR" || !b.month || !b.dueDay) return false;
      const [by, bm] = b.month.split("-");
      if (by < ty || (by === ty && bm < tm)) return true; // overdue month
      if (by === ty && bm === tm && b.dueDay <= todayDay) return true; // due today or overdue this month
      return false;
    }).length;
    document.title = urgentCount > 0 ? `(${urgentCount}) JurisFinance AI` : "JurisFinance AI";
  }, [priorityBills, isAuthenticated]);

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col md:flex-row font-sans">
      {/* Mobile top bar */}
      <div className="md:hidden bg-[#0f172a] text-white p-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs uppercase tracking-wider font-display">Menu</span>
        </div>
      </div>

      <Sidebar />

      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 md:hidden" />
      )}

      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        <AppHeader onOpenCommandPalette={() => setCmdOpen(true)} />
        <MainContent />
      </div>

      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }}
        onSave={handleSaveSingleTransaction}
        onSaveBulk={handleAddTransactions}
        onUpdate={handleUpdateTransaction}
        initialTransaction={transactionToEdit}
      />

      <EditProfileModal />
      <ConfirmModal />

      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        transactions={transactions}
        onNavigate={(tab) => setActiveTab(tab as any)}
        onNewTransaction={() => { setIsModalOpen(true); setCmdOpen(false); }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
