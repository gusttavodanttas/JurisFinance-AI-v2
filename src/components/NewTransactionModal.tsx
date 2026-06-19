import React, { useState, useEffect } from "react";
import { 
  Transaction, 
  TransactionScope, 
  TransactionType, 
  ALL_CATEGORIES_MAP 
} from "../types";
import { X, Check, Plus, Trash2, HelpCircle } from "lucide-react";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, "id">) => void;
  onSaveBulk?: (transactions: Omit<Transaction, "id">[]) => void;
  onUpdate?: (transaction: Transaction) => void;
  initialTransaction?: Transaction | null;
}

interface BulkRow {
  date: string;
  description: string;
  scope: TransactionScope;
  type: TransactionType;
  category: string;
  amount: string;
  paymentMethod: string;
}

export default function NewTransactionModal({ 
  isOpen, 
  onClose, 
  onSave,
  onSaveBulk,
  onUpdate,
  initialTransaction 
}: NewTransactionModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<"single" | "bulk">("single");

  // Single form states
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [notes, setNotes] = useState("");
  const [isMixedIncident, setIsMixedIncident] = useState(false);

  // Bulk form state (prefilled with 3 empty rows)
  const [bulkRows, setBulkRows] = useState<BulkRow[]>(() => [
    {
      date: new Date().toISOString().split("T")[0],
      description: "",
      scope: TransactionScope.PROFESSIONAL,
      type: TransactionType.EXPENSE,
      category: "Outras Despesas Profissionais",
      amount: "",
      paymentMethod: "PIX",
    },
    {
      date: new Date().toISOString().split("T")[0],
      description: "",
      scope: TransactionScope.PROFESSIONAL,
      type: TransactionType.EXPENSE,
      category: "Outras Despesas Profissionais",
      amount: "",
      paymentMethod: "PIX",
    },
    {
      date: new Date().toISOString().split("T")[0],
      description: "",
      scope: TransactionScope.PROFESSIONAL,
      type: TransactionType.EXPENSE,
      category: "Outras Despesas Profissionais",
      amount: "",
      paymentMethod: "PIX",
    }
  ]);

  const [bulkError, setBulkError] = useState("");

  const isEditMode = !!initialTransaction;

  // Single category sync
  const matchedCategoriesList = ALL_CATEGORIES_MAP[`${scope}_${type}`] || [];

  // Reset category whenever scope or type changes to avoid orphan selections, preserving edit values if initialized
  useEffect(() => {
    if (initialTransaction && initialTransaction.scope === scope && initialTransaction.type === type) {
      setCategory(initialTransaction.category);
    } else if (matchedCategoriesList.length > 0) {
      if (!matchedCategoriesList.includes(category)) {
        setCategory(matchedCategoriesList[0]);
      }
    } else {
      setCategory("");
    }
  }, [scope, type, initialTransaction, matchedCategoriesList]);

  // Handle open modal/editing states
  useEffect(() => {
    if (isOpen) {
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
        
        let rawNotes = initialTransaction.notes || "";
        if (rawNotes.startsWith("Aviso: Lançado como despesa pessoal paga incorretamente")) {
          const textAfter = rawNotes.replace(/^Aviso: Lançado como despesa pessoal paga incorretamente com o caixa PJ do escritório\.\s*/, "");
          rawNotes = textAfter;
        }
        setNotes(rawNotes);
        setIsMixedIncident(!!initialTransaction.isAiCategorized);
      } else {
        setDate(new Date().toISOString().split("T")[0]);
        setDescription("");
        setScope(TransactionScope.PROFESSIONAL);
        setType(TransactionType.EXPENSE);
        setAmount("");
        setPaymentMethod("PIX");
        setNotes("");
        setIsMixedIncident(false);
        
        // Reset bulk rows to fresh defaults
        setBulkRows([
          {
            date: new Date().toISOString().split("T")[0],
            description: "",
            scope: TransactionScope.PROFESSIONAL,
            type: TransactionType.EXPENSE,
            category: "Outras Despesas Profissionais",
            amount: "",
            paymentMethod: "PIX",
          },
          {
            date: new Date().toISOString().split("T")[0],
            description: "",
            scope: TransactionScope.PROFESSIONAL,
            type: TransactionType.EXPENSE,
            category: "Outras Despesas Profissionais",
            amount: "",
            paymentMethod: "PIX",
          },
          {
            date: new Date().toISOString().split("T")[0],
            description: "",
            scope: TransactionScope.PROFESSIONAL,
            type: TransactionType.EXPENSE,
            category: "Outras Despesas Profissionais",
            amount: "",
            paymentMethod: "PIX",
          }
        ]);
      }
    }
  }, [isOpen, initialTransaction]);

  if (!isOpen) return null;

  // Single submit handler
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;

    const actualNotes = isMixedIncident 
      ? `Aviso: Lançado como despesa pessoal paga incorretamente com o caixa PJ do escritório. ${notes}`.trim()
      : notes;

    if (initialTransaction && onUpdate) {
      onUpdate({
        ...initialTransaction,
        date,
        description,
        type,
        scope,
        category,
        amount: parseFloat(amount),
        paymentMethod,
        notes: actualNotes,
        isAiCategorized: isMixedIncident
      });
    } else {
      onSave({
        date,
        description,
        type,
        scope,
        category,
        amount: parseFloat(amount),
        paymentMethod,
        notes: actualNotes,
        isAiCategorized: isMixedIncident
      });
    }

    // Reset Form
    setDescription("");
    setAmount("");
    setNotes("");
    setIsMixedIncident(false);
    setDate(new Date().toISOString().split("T")[0]);
    onClose();
  };

  // Bulk operation handlers
  const handleAddBulkRow = () => {
    setBulkRows((prev) => [
      ...prev,
      {
        date: new Date().toISOString().split("T")[0],
        description: "",
        scope: TransactionScope.PROFESSIONAL,
        type: TransactionType.EXPENSE,
        category: "Outras Despesas Profissionais",
        amount: "",
        paymentMethod: "PIX",
      }
    ]);
  };

  const handleRemoveBulkRow = (index: number) => {
    if (bulkRows.length <= 1) {
      setBulkError("Por favor, preencha pelo menos uma linha para lançar.");
      return;
    }
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateBulkRow = (index: number, key: keyof BulkRow, value: any) => {
    setBulkRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [key]: value };

      // Switch category selection matching new Scope or Type
      if (key === "scope" || key === "type") {
        const nextScope = key === "scope" ? value : row.scope;
        const nextType = key === "type" ? value : row.type;
        const list = ALL_CATEGORIES_MAP[`${nextScope}_${nextType}`] || [];
        row.category = list[0] || "";
      }

      updated[index] = row;
      return updated;
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError("");

    // Validate rows
    const filledRows = bulkRows.filter(r => r.description.trim() !== "" || r.amount.trim() !== "");
    
    if (filledRows.length === 0) {
      setBulkError("Por favor, preencha a descrição e valor de pelo menos um lançamento.");
      return;
    }

    // Validate that all initiated rows are complete
    const invalidRow = filledRows.find(r => r.description.trim() === "" || !r.amount.trim() || parseFloat(r.amount) <= 0);
    if (invalidRow) {
      setBulkError("Preencha a descrição e o valor positivo para todos os lançamentos iniciados.");
      return;
    }

    // Format for bulk saving
    const formattedRows: Omit<Transaction, "id">[] = filledRows.map(row => ({
      date: row.date || new Date().toISOString().split("T")[0],
      description: row.description.trim(),
      type: row.type,
      scope: row.scope,
      category: row.category,
      amount: parseFloat(row.amount),
      paymentMethod: row.paymentMethod || "PIX",
      notes: "Lançamento em Lote Rápido",
      isAiCategorized: false
    }));

    if (onSaveBulk) {
      onSaveBulk(formattedRows);
    } else {
      // Loop fallback
      formattedRows.forEach(tx => onSave(tx));
    }

    onClose();
  };

  return (
    <div id="new-transaction-modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className={`bg-white rounded-2xl w-full ${activeSubTab === "bulk" ? "max-w-5xl" : "max-w-lg"} shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300 animate-scale-up`}>
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-950 text-white p-4">
          <div className="flex items-center gap-1.5 font-sans">
            <h3 id="modal-title" className="text-sm font-bold tracking-tight uppercase tracking-wider">
              {isEditMode ? "Editar Lançamento" : "Nova Movimentação Financeira"}
            </h3>
          </div>
          <button
            id="close-modal-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher - Hidden if editing a single transaction */}
        {!isEditMode && (
          <div className="flex bg-slate-100 p-1 border-b border-slate-200" id="modal-tab-selector">
            <button
              id="tab-single-btn"
              type="button"
              onClick={() => setActiveSubTab("single")}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeSubTab === "single"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📝 Lançamento Único
            </button>
            <button
              id="tab-bulk-btn"
              type="button"
              onClick={() => setActiveSubTab("bulk")}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === "bulk"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📥 Lançamento em Lote / Rápido
            </button>
          </div>
        )}

        {/* VIEW 1: SINGLE ENTRY FORM */}
        {activeSubTab === "single" ? (
          <form onSubmit={handleSingleSubmit} className="p-5 space-y-4 font-sans" id="single-entry-form">
            {/* Dual Scope & Type Toggles */}
            <div className="grid grid-cols-2 gap-3">
              {/* Scope Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escopo Alçada</label>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setScope(TransactionScope.PROFESSIONAL)}
                    className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      scope === TransactionScope.PROFESSIONAL
                        ? "bg-white text-indigo-950 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Escritório (PJ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope(TransactionScope.PERSONAL)}
                    className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      scope === TransactionScope.PERSONAL
                        ? "bg-white text-sky-950 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Pessoal (PF)
                  </button>
                </div>
              </div>

              {/* Type Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo Fluxo</label>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      type === TransactionType.EXPENSE
                        ? "bg-white text-rose-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Despesa (Saída)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.REVENUE)}
                    className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      type === TransactionType.REVENUE
                        ? "bg-white text-[#10b981] shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Receita (Entrada)
                  </button>
                </div>
              </div>
            </div>

            {/* Date & Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="tx-date" className="block text-xs font-bold text-slate-500">Data da Operação</label>
                <input
                  id="tx-date"
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  value={date}
                  required
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="tx-amount" className="block text-xs font-bold text-slate-500">Valor Líquido (R$)</label>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                  placeholder="0,00"
                  value={amount}
                  required
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="tx-description" className="block text-xs font-bold text-slate-500">Descrição Comercial / Histórico</label>
              <input
                id="tx-description"
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                placeholder="Ex: Honorários Contratuais - Proc. 1042/2026"
                value={description}
                required
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Category & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-1">
                <label htmlFor="tx-category" className="block text-xs font-bold text-slate-500">Categoria Contábil</label>
                <select
                  id="tx-category"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                  value={category}
                  required
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {matchedCategoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 col-span-1">
                <label htmlFor="tx-method" className="block text-xs font-bold text-slate-500">Meio de Transação</label>
                <select
                  id="tx-method"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="PIX">⚡ PIX</option>
                  <option value="Boleto Bancário">📄 Boleto Bancário</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                  <option value="Cartão de Débito">💵 Cartão de Débito</option>
                  <option value="Transferência Bancária">🏦 Transferência (TED/DOC)</option>
                  <option value="Dinheiro">🪙 Dinheiro Espécie</option>
                </select>
              </div>
            </div>

            {/* ADVOCACY SPECIFIC: Mixed Billing Flag */}
            {scope === TransactionScope.PERSONAL && type === TransactionType.EXPENSE && (
              <div id="mixed-bill-checkbox" className="flex items-start gap-2.5 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <input
                  id="mixed-flag-checkbox"
                  type="checkbox"
                  className="mt-0.5 rounded-sm accent-amber-600 cursor-pointer"
                  checked={isMixedIncident}
                  onChange={(e) => setIsMixedIncident(e.target.checked)}
                />
                <div className="space-y-0.5 select-none text-left">
                  <p className="text-xs font-bold text-amber-800">Paguei com o Caixa do Escritório (Conta PJ)</p>
                  <p className="text-[10px] text-amber-700 leading-tight">Marque se pagou essa despesa pessoal usando o saldo ou cartão corporativo do escritório jurídico. A inteligência artificial registrará o desvio de caixa.</p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label htmlFor="tx-notes" className="block text-xs font-bold text-slate-500">Observações adicionais (Opcional)</label>
              <textarea
                id="tx-notes"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 min-h-[50px] text-slate-800"
                placeholder="Ex de anotações: Número do processo, nome do cliente, parcelamentos ou detalhes."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Form Actions Footer */}
            <div className="flex justify-end gap-2 px-1 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-extrabold text-[#64748b] bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Salvar Alterações" : "Salvar Lançamento"}
              </button>
            </div>
          </form>
        ) : (
          /* VIEW 2: BULK SPREADSHEET FORM */
          <form onSubmit={handleBulkSubmit} className="p-5 space-y-4 font-sans text-left" id="bulk-entry-form">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-150 text-indigo-900 text-xs flex gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Dica de Produtividade: Lançamento Múltiplo</p>
                <p className="text-indigo-700 leading-relaxed mt-0.5">Preencha várias movimentações ao mesmo tempo nas linhas abaixo. Deixe em branco as linhas que não precisar. Quando terminar, todos os lançamentos preenchidos serão salvos instantaneamente com 1 clique.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 w-[14%]">Data</th>
                    <th className="p-2.5 w-[24%]">Descrição Comercial</th>
                    <th className="p-2.5 w-[12%]">Escopo</th>
                    <th className="p-2.5 w-[12%]">Fluxo</th>
                    <th className="p-2.5 w-[16%]">Categoria</th>
                    <th className="p-2.5 w-[12%]">Valor (R$)</th>
                    <th className="p-2.5 w-[10%] text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bulkRows.map((row, index) => {
                    const rowCategories = ALL_CATEGORIES_MAP[`${row.scope}_${row.type}`] || [];
                    return (
                      <tr key={index} className="hover:bg-indigo-50/10 transition-colors">
                        {/* Date */}
                        <td className="p-2">
                          <input
                            type="date"
                            required
                            className="w-full bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:outline-hidden focus:ring-indigo-500 text-slate-800"
                            value={row.date}
                            onChange={(e) => handleUpdateBulkRow(index, "date", e.target.value)}
                          />
                        </td>
                        
                        {/* Description */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Ex: Custas Judiciais..."
                            className="w-full bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:outline-hidden focus:ring-indigo-500 text-slate-800 font-medium"
                            value={row.description}
                            onChange={(e) => handleUpdateBulkRow(index, "description", e.target.value)}
                          />
                        </td>

                        {/* Scope */}
                        <td className="p-2">
                          <select
                            className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-semibold focus:outline-hidden text-slate-700"
                            value={row.scope}
                            onChange={(e) => handleUpdateBulkRow(index, "scope", e.target.value as TransactionScope)}
                          >
                            <option value={TransactionScope.PROFESSIONAL}>💼 Escritório</option>
                            <option value={TransactionScope.PERSONAL}>🏠 Pessoal</option>
                          </select>
                        </td>

                        {/* Type */}
                        <td className="p-2">
                          <select
                            className={`w-full bg-white border border-slate-200 rounded p-1 text-xs font-bold focus:outline-hidden ${
                              row.type === TransactionType.EXPENSE ? "text-rose-600" : "text-emerald-600"
                            }`}
                            value={row.type}
                            onChange={(e) => handleUpdateBulkRow(index, "type", e.target.value as TransactionType)}
                          >
                            <option value={TransactionType.EXPENSE}>🔴 Saída (Desp)</option>
                            <option value={TransactionType.REVENUE}>🟢 Entrada (Rec)</option>
                          </select>
                        </td>

                        {/* Category */}
                        <td className="p-2">
                          <select
                            className="w-full bg-white border border-slate-200 rounded p-1 text-xs focus:outline-hidden text-slate-700"
                            value={row.category}
                            onChange={(e) => handleUpdateBulkRow(index, "category", e.target.value)}
                          >
                            {rowCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Amount */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0,00"
                            className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono text-slate-800"
                            value={row.amount}
                            onChange={(e) => handleUpdateBulkRow(index, "amount", e.target.value)}
                          />
                        </td>

                        {/* Action - Delete row */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkRow(index)}
                            className="p-1 px-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title="Remover Linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center px-1">
              <button
                type="button"
                onClick={handleAddBulkRow}
                className="flex items-center gap-1 py-1.5 px-3 border border-indigo-200 text-indigo-600 hover:bg-slate-100 hover:text-indigo-800 font-bold text-xs bg-white rounded-lg transition-colors cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5" /> Th
                Adicionar Outra Linha
              </button>
              
              <div className="text-[11px] text-slate-500 font-medium">
                {bulkRows.filter(r => r.description.trim() !== "" && r.amount.trim() !== "").length} lançamento(s) prontos para salvar.
              </div>
            </div>

            {bulkError && (
              <p className="bg-red-50 text-rose-600 border border-rose-100 text-[11px] font-medium p-2.5 rounded-lg text-center">
                ⚠️ {bulkError}
              </p>
            )}

            {/* Bulk Actions Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-extrabold text-[#64748b] bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Salvar Lançamentos Preenchidos
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
