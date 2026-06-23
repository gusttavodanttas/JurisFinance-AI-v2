import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import AppHeader from "./components/layout/AppHeader";
import MainContent from "./components/layout/MainContent";
import EditProfileModal from "./components/layout/EditProfileModal";
import ConfirmModal from "./components/layout/ConfirmModal";
import NewTransactionModal from "./components/NewTransactionModal";

function AppShell() {
  const { isAuthenticated, handleLogin, isModalOpen, setIsModalOpen, transactionToEdit, setTransactionToEdit, handleSaveSingleTransaction, handleAddTransactions, handleUpdateTransaction, mobileMenuOpen, setMobileMenuOpen } = useApp();

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
        <AppHeader />
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
