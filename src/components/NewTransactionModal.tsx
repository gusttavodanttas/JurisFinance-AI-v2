import React, { useState, useEffect } from "react";
import { Transaction, TransactionScope, TransactionType, ALL_CATEGORIES_MAP } from "../types";
import { X } from "lucide-react";
import SingleEntryForm from "./NewTransactionModal/SingleEntryForm";
import BulkEntryForm, { BulkRow } from "./NewTransactionModal/BulkEntryForm";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, "id">) => void;
  onSaveBulk?: (transactions: Omit<Transaction, "id">[]) => void;
  onUpdate?: (transaction: Transaction) => void;
  initialTransaction?: Transaction | null;
}

const defaultBulkRow = (): BulkRow => ({
  date: new Date().toISOString().split("T")[0],
  description: "",
  scope: TransactionScope.PROFESSIONAL,
  type: TransactionType.EXPENSE,
  category: "Outras Despesas Profissionais",
  amount: "",
  paymentMethod: "PIX",
  status: "REALIZADO",
});

export default function NewTransactionModal({
  isOpen, onClose, onSave, onSaveBulk, onUpdate, initialTransaction,
}: NewTransactionModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<"single" | "bulk">("single");

  // Single form state
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [notes, setNotes] = useState("");
  const [isMixedIncident, setIsMixedIncident] = useState(false);
  const [status, setStatus] = useState<"PREVISTO" | "REALIZADO">("REALIZADO");
  const [repeat, setRepeat] = useState(false);
  const [repeatCount, setRepeatCount] = useState(2);

  // Bulk form state
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([defaultBulkRow(), defaultBulkRow(), defaultBulkRow()]);
  const [bulkError, setBulkError] = useState("");

  const isEditMode = !!initialTransaction;

  // Keep categories list updated when custom categories change
  const [categoriesVersion, setCategoriesVersion] = useState(0);
  useEffect(() => {
    const handler = () => setCategoriesVersion(p => p + 1);
    window.addEventListener("categories_updated", handler);
    return () => window.removeEventListener("categories_updated", handler);
  }, []);

  const matchedCategoriesList = ALL_CATEGORIES_MAP[`${scope}_${type}`] || [];

  useEffect(() => {
    if (initialTransaction && initialTransaction.scope === scope && initialTransaction.type === type) {
      setCategory(initialTransaction.category);
    } else if (matchedCategoriesList.length > 0) {
      if (!matchedCategoriesList.includes(category)) setCategory(matchedCategoriesList[0]);
    } else {
      setCategory("");
    }
  }, [scope, type, initialTransaction, matchedCategoriesList, categoriesVersion]);

  useEffect(() => {
    if (!isOpen) return;
    setBulkError("");
    if (initialTransaction) {
      setActiveSubTab("single");
      setDate(initialTransaction.date);
      setDescription(initialTransaction.description);
      setScope(initialTransaction.scope);
      setType(initialTransaction.type);
      setCategory(initialTransaction.category);
      setAmount(initialTransaction.amount.toString());
      setPaymentMethod(initialTransaction.paymentMethod || "PIX");
      setStatus(initialTransaction.status || "REALIZADO");
      let rawNotes = initialTransaction.notes || "";
      if (rawNotes.startsWith("Aviso: Lançado como despesa pessoal")) {
        rawNotes = rawNotes.replace(/^Aviso: Lançado como despesa pessoal paga incorretamente com o caixa PJ do escritório\.\s*/, "");
      }
      setNotes(rawNotes);
      setIsMixedIncident(!!initialTransaction.isAiCategorized);
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setDescription(""); setAmount(""); setPaymentMethod("PIX"); setNotes("");
      setIsMixedIncident(false); setStatus("REALIZADO"); setRepeat(false); setRepeatCount(2);
      setScope(TransactionScope.PROFESSIONAL); setType(TransactionType.EXPENSE);
      setBulkRows([defaultBulkRow(), defaultBulkRow(), defaultBulkRow()]);
    }
  }, [isOpen, initialTransaction]);

  if (!isOpen) return null;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;
    const actualNotes = isMixedIncident
      ? `Aviso: Lançado como despesa pessoal paga incorretamente com o caixa PJ do escritório. ${notes}`.trim()
      : notes;

    if (initialTransaction && onUpdate) {
      onUpdate({ ...initialTransaction, date, description, type, scope, category, amount: parseFloat(amount), paymentMethod, notes: actualNotes, isAiCategorized: isMixedIncident, status });
    } else if (repeat && repeatCount > 1 && onSaveBulk) {
      // Generate N installments, each 1 month apart
      const items: Omit<Transaction, "id">[] = Array.from({ length: repeatCount }, (_, i) => {
        const d = new Date(date + "T12:00:00");
        d.setMonth(d.getMonth() + i);
        const dd = d.toISOString().split("T")[0];
        return {
          date: dd,
          description: `${description} (${i + 1}/${repeatCount})`,
          type, scope, category,
          amount: parseFloat(amount),
          paymentMethod,
          notes: actualNotes,
          isAiCategorized: isMixedIncident,
          status: i === 0 ? status : "PREVISTO",
        };
      });
      onSaveBulk(items);
    } else {
      onSave({ date, description, type, scope, category, amount: parseFloat(amount), paymentMethod, notes: actualNotes, isAiCategorized: isMixedIncident, status });
    }
    setDescription(""); setAmount(""); setNotes(""); setIsMixedIncident(false);
    setDate(new Date().toISOString().split("T")[0]);
    onClose();
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError("");
    const filledRows = bulkRows.filter(r => r.description.trim() !== "" || r.amount.trim() !== "");
    if (filledRows.length === 0) { setBulkError("Por favor, preencha a descrição e valor de pelo menos um lançamento."); return; }
    const invalidRow = filledRows.find(r => r.description.trim() === "" || !r.amount.trim() || parseFloat(r.amount) <= 0);
    if (invalidRow) { setBulkError("Preencha a descrição e o valor positivo para todos os lançamentos iniciados."); return; }

    const formatted: Omit<Transaction, "id">[] = filledRows.map(row => ({
      date: row.date || new Date().toISOString().split("T")[0],
      description: row.description.trim(),
      type: row.type, scope: row.scope, category: row.category,
      amount: parseFloat(row.amount), paymentMethod: row.paymentMethod || "PIX",
      notes: "Lançamento em Lote Rápido", isAiCategorized: false, status: row.status,
    }));

    if (onSaveBulk) onSaveBulk(formatted);
    else formatted.forEach(tx => onSave(tx));
    onClose();
  };

  const handleUpdateBulkRow = (index: number, key: keyof BulkRow, value: any) => {
    setBulkRows(prev => {
      const updated = [...prev];
      const row = { ...updated[index], [key]: value };
      if (key === "scope" || key === "type") {
        const nextScope = key === "scope" ? value : row.scope;
        const nextType = key === "type" ? value : row.type;
        const list = ALL_CATEGORIES_MAP[`${nextScope}_${nextType}`] || [];
        row.category = list[0] || "";
        if (key === "type") row.status = value === TransactionType.REVENUE ? "PREVISTO" : "REALIZADO";
      }
      updated[index] = row;
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className={`bg-white rounded-2xl w-full ${activeSubTab === "bulk" ? "max-w-5xl" : "max-w-lg"} shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300 animate-scale-up`}>
        <div className="flex justify-between items-center bg-slate-950 text-white p-4">
          <h3 className="text-sm font-bold tracking-tight uppercase tracking-wider font-sans">
            {isEditMode ? "Editar Lançamento" : "Nova Movimentação Financeira"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditMode && (
          <div className="flex bg-slate-100 p-1 border-b border-slate-200">
            {(["single", "bulk"] as const).map((tab, i) => (
              <button key={tab} type="button" onClick={() => setActiveSubTab(tab)}
                className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeSubTab === tab ? `bg-white ${i === 1 ? "text-indigo-700" : "text-slate-800"} shadow-sm` : "text-slate-500 hover:text-slate-800"}`}>
                {i === 0 ? "📝 Lançamento Único" : "📥 Lançamento em Lote / Rápido"}
              </button>
            ))}
          </div>
        )}

        {activeSubTab === "single" ? (
          <SingleEntryForm
            isEditMode={isEditMode}
            date={date} setDate={setDate}
            description={description} setDescription={setDescription}
            scope={scope} setScope={setScope}
            type={type} setType={setType}
            category={category} setCategory={setCategory}
            amount={amount} setAmount={setAmount}
            paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
            notes={notes} setNotes={setNotes}
            isMixedIncident={isMixedIncident} setIsMixedIncident={setIsMixedIncident}
            status={status} setStatus={setStatus}
            repeat={repeat} setRepeat={setRepeat}
            repeatCount={repeatCount} setRepeatCount={setRepeatCount}
            matchedCategoriesList={matchedCategoriesList}
            onSubmit={handleSingleSubmit}
            onClose={onClose}
          />
        ) : (
          <BulkEntryForm
            bulkRows={bulkRows}
            bulkError={bulkError}
            onAddRow={() => setBulkRows(prev => [...prev, defaultBulkRow()])}
            onRemoveRow={(index) => {
              if (bulkRows.length <= 1) { setBulkError("Por favor, preencha pelo menos uma linha para lançar."); return; }
              setBulkRows(prev => prev.filter((_, i) => i !== index));
            }}
            onUpdateRow={handleUpdateBulkRow}
            onSubmit={handleBulkSubmit}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
