import React from "react";
import { TransactionScope, TransactionType, ALL_CATEGORIES_MAP } from "../../types";
import { Check, Plus, Trash2, HelpCircle } from "lucide-react";

export interface BulkRow {
  date: string;
  description: string;
  scope: TransactionScope;
  type: TransactionType;
  category: string;
  amount: string;
  paymentMethod: string;
  status: "PREVISTO" | "REALIZADO";
}

interface BulkEntryFormProps {
  bulkRows: BulkRow[];
  bulkError: string;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, key: keyof BulkRow, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function BulkEntryForm({
  bulkRows, bulkError, onAddRow, onRemoveRow, onUpdateRow, onSubmit, onClose,
}: BulkEntryFormProps) {
  return (
    <form onSubmit={onSubmit} className="p-5 space-y-4 font-sans text-left" id="bulk-entry-form">
      <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-150 text-indigo-900 text-xs flex gap-2">
        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Dica: Lançamento Múltiplo</p>
          <p className="text-indigo-700 leading-relaxed mt-0.5">Preencha várias movimentações ao mesmo tempo. Deixe em branco as linhas que não precisar. Com 1 clique todos os lançamentos preenchidos são salvos.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
        <table className="w-full text-xs text-left font-sans">
          <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-2.5 w-[12%]">Data</th>
              <th className="p-2.5 w-[20%]">Descrição Comercial</th>
              <th className="p-2.5 w-[11%]">Escopo</th>
              <th className="p-2.5 w-[11%]">Fluxo</th>
              <th className="p-2.5 w-[16%]">Categoria</th>
              <th className="p-2.5 w-[11%]">Valor (R$)</th>
              <th className="p-2.5 w-[11%]">Status</th>
              <th className="p-2.5 w-[8%] text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {bulkRows.map((row, index) => {
              const rowCategories = ALL_CATEGORIES_MAP[`${row.scope}_${row.type}`] || [];
              return (
                <tr key={index} className="hover:bg-indigo-50/10 transition-colors">
                  <td className="p-2">
                    <input type="date" required value={row.date} onChange={e => onUpdateRow(index, "date", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:outline-hidden focus:ring-indigo-500 text-slate-800" />
                  </td>
                  <td className="p-2">
                    <input type="text" placeholder="Ex: Custas Judiciais..." value={row.description}
                      onChange={e => onUpdateRow(index, "description", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:outline-hidden focus:ring-indigo-500 text-slate-800 font-medium" />
                  </td>
                  <td className="p-2">
                    <select value={row.scope} onChange={e => onUpdateRow(index, "scope", e.target.value as TransactionScope)}
                      className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-semibold focus:outline-hidden text-slate-700">
                      <option value={TransactionScope.PROFESSIONAL}>💼 Escritório</option>
                      <option value={TransactionScope.PERSONAL}>🏠 Pessoal</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select value={row.type} onChange={e => onUpdateRow(index, "type", e.target.value as TransactionType)}
                      className={`w-full bg-white border border-slate-200 rounded p-1 text-xs font-bold focus:outline-hidden ${row.type === TransactionType.EXPENSE ? "text-rose-600" : "text-emerald-600"}`}>
                      <option value={TransactionType.EXPENSE}>🔴 Saída (Desp)</option>
                      <option value={TransactionType.REVENUE}>🟢 Entrada (Rec)</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select value={row.category} onChange={e => onUpdateRow(index, "category", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 text-xs focus:outline-hidden text-slate-700">
                      {rowCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input type="number" step="0.01" min="0.01" placeholder="0,00" value={row.amount}
                      onChange={e => onUpdateRow(index, "amount", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono text-slate-800" />
                  </td>
                  <td className="p-2">
                    <select value={row.status} onChange={e => onUpdateRow(index, "status", e.target.value as "PREVISTO" | "REALIZADO")}
                      className={`w-full bg-white border border-slate-200 rounded p-1 text-xs font-semibold focus:outline-hidden ${row.status === "PREVISTO" ? "text-amber-600 font-bold" : "text-slate-700"}`}>
                      <option value="REALIZADO">Realizado</option>
                      <option value="PREVISTO">Previsto</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => onRemoveRow(index)}
                      className="p-1 px-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer">
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
        <button type="button" onClick={onAddRow}
          className="flex items-center gap-1 py-1.5 px-3 border border-indigo-200 text-indigo-600 hover:bg-slate-100 hover:text-indigo-800 font-bold text-xs bg-white rounded-lg transition-colors cursor-pointer select-none">
          <Plus className="w-3.5 h-3.5" /> Adicionar Outra Linha
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

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-xs font-extrabold text-[#64748b] bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer">
          Cancelar
        </button>
        <button type="submit"
          className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
          <Check className="w-3.5 h-3.5" />
          Salvar Lançamentos Preenchidos
        </button>
      </div>
    </form>
  );
}
