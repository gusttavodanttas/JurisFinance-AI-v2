import React from "react";
import { Transaction, TransactionScope, TransactionType, ALL_CATEGORIES_MAP } from "../../types";
import { X, Check, Eye, EyeOff, Repeat } from "lucide-react";

interface SingleEntryFormProps {
  isEditMode: boolean;
  date: string; setDate: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  scope: TransactionScope; setScope: (v: TransactionScope) => void;
  type: TransactionType; setType: (v: TransactionType) => void;
  category: string; setCategory: (v: string) => void;
  amount: string; setAmount: (v: string) => void;
  paymentMethod: string; setPaymentMethod: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  isMixedIncident: boolean; setIsMixedIncident: (v: boolean) => void;
  status: "PREVISTO" | "REALIZADO"; setStatus: (v: "PREVISTO" | "REALIZADO") => void;
  repeat: boolean; setRepeat: (v: boolean) => void;
  repeatCount: number; setRepeatCount: (v: number) => void;
  matchedCategoriesList: string[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function SingleEntryForm({
  isEditMode, date, setDate, description, setDescription,
  scope, setScope, type, setType, category, setCategory,
  amount, setAmount, paymentMethod, setPaymentMethod,
  notes, setNotes, isMixedIncident, setIsMixedIncident,
  status, setStatus, repeat, setRepeat, repeatCount, setRepeatCount,
  matchedCategoriesList, onSubmit, onClose,
}: SingleEntryFormProps) {
  return (
    <form onSubmit={onSubmit} className="p-5 space-y-4 font-sans" id="single-entry-form">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escopo Alçada</label>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
            {([TransactionScope.PROFESSIONAL, TransactionScope.PERSONAL] as const).map((s, i) => (
              <button key={s} type="button" onClick={() => setScope(s)}
                className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${scope === s ? `bg-white ${i === 0 ? "text-indigo-950" : "text-sky-950"} shadow-xs` : "text-slate-500 hover:text-slate-700"}`}>
                {i === 0 ? "Escritório (PJ)" : "Pessoal (PF)"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo Fluxo</label>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button type="button"
              onClick={() => { setType(TransactionType.EXPENSE); setStatus("REALIZADO"); }}
              className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${type === TransactionType.EXPENSE ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}>
              Despesa (Saída)
            </button>
            <button type="button"
              onClick={() => { setType(TransactionType.REVENUE); setStatus("PREVISTO"); }}
              className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${type === TransactionType.REVENUE ? "bg-white text-[#10b981] shadow-xs" : "text-slate-500 hover:text-slate-700"}`}>
              Receita (Entrada)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="tx-date" className="block text-xs font-bold text-slate-500">Data da Operação</label>
          <input id="tx-date" type="date" required value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800" />
        </div>
        <div className="space-y-1">
          <label htmlFor="tx-amount" className="block text-xs font-bold text-slate-500">Valor Líquido (R$)</label>
          <input id="tx-amount" type="number" step="0.01" min="0.01" placeholder="0,00" required value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-500">Status do Lançamento</label>
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg font-sans">
          <button type="button" onClick={() => setStatus("REALIZADO")}
            className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              status === "REALIZADO"
                ? type === TransactionType.REVENUE ? "bg-[#10b981] text-white shadow-xs" : "bg-rose-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            {type === TransactionType.REVENUE ? "Confirmado (Recebido)" : "Confirmado (Pago)"}
          </button>
          <button type="button" onClick={() => setStatus("PREVISTO")}
            className={`w-full text-center py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${status === "PREVISTO" ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-700"}`}>
            {type === TransactionType.REVENUE ? "Previsto (A receber)" : "Previsto (A pagar)"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="tx-description" className="block text-xs font-bold text-slate-500">Descrição Comercial / Histórico</label>
        <input id="tx-description" type="text" required placeholder="Ex: Honorários Contratuais - Proc. 1042/2026"
          value={description} onChange={e => setDescription(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="tx-category" className="block text-xs font-bold text-slate-500">Categoria Contábil</label>
          <select id="tx-category" required value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold">
            {matchedCategoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="tx-method" className="block text-xs font-bold text-slate-500">Meio de Transação</label>
          <select id="tx-method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800">
            <option value="PIX">⚡ PIX</option>
            <option value="Boleto Bancário">📄 Boleto Bancário</option>
            <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
            <option value="Cartão de Débito">💵 Cartão de Débito</option>
            <option value="Transferência Bancária">🏦 Transferência (TED/DOC)</option>
            <option value="Dinheiro">🪙 Dinheiro Espécie</option>
          </select>
        </div>
      </div>

      {scope === TransactionScope.PERSONAL && type === TransactionType.EXPENSE && (
        <div className="flex items-start gap-2.5 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <input type="checkbox" id="mixed-flag-checkbox" className="mt-0.5 rounded-sm accent-amber-600 cursor-pointer"
            checked={isMixedIncident} onChange={e => setIsMixedIncident(e.target.checked)} />
          <div className="space-y-0.5 select-none text-left">
            <p className="text-xs font-bold text-amber-800">Paguei com o Caixa do Escritório (Conta PJ)</p>
            <p className="text-[10px] text-amber-700 leading-tight">Marque se pagou essa despesa pessoal usando o saldo ou cartão corporativo do escritório jurídico.</p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="tx-notes" className="block text-xs font-bold text-slate-500">Observações adicionais (Opcional)</label>
        <textarea id="tx-notes" placeholder="Ex: Número do processo, nome do cliente, parcelamentos..."
          value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 min-h-[50px] text-slate-800" />
      </div>

      {/* Parcelamento */}
      {!isEditMode && (
        <div className={`rounded-lg border p-3 transition-colors ${repeat ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200"}`}>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)}
              className="rounded accent-indigo-600 w-3.5 h-3.5 cursor-pointer" />
            <Repeat className={`w-3.5 h-3.5 ${repeat ? "text-indigo-600" : "text-slate-400"}`} />
            <span className={`text-xs font-bold ${repeat ? "text-indigo-800" : "text-slate-600"}`}>Repetir mensalmente (parcelamento)</span>
          </label>
          {repeat && (
            <div className="mt-2.5 flex items-center gap-3 pl-6">
              <span className="text-[10px] text-slate-500 font-mono">Repetir por</span>
              <input type="number" min={2} max={60} value={repeatCount} onChange={e => setRepeatCount(Math.max(2, Math.min(60, parseInt(e.target.value) || 2)))}
                className="w-16 border border-indigo-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-indigo-800 focus:outline-none focus:border-indigo-400 bg-white text-center" />
              <span className="text-[10px] text-slate-500 font-mono">meses (parcelas)</span>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded font-mono">
                {repeatCount}× {amount ? `R$ ${(parseFloat(amount) || 0).toFixed(2)}` : "R$ 0,00"}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 px-1 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-xs font-extrabold text-[#64748b] bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer">
          Cancelar
        </button>
        <button type="submit"
          className="px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs">
          <Check className="w-3.5 h-3.5" />
          {isEditMode ? "Salvar Alterações" : repeat && repeatCount > 1 ? `Criar ${repeatCount} Parcelas` : "Salvar Lançamento"}
        </button>
      </div>
    </form>
  );
}
