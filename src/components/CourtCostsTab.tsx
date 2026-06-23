import React, { useState } from "react";
import { CourtCost } from "../types";
import { Scale, Plus, Trash2, Edit3, Check, X, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface CourtCostsTabProps {
  courtCosts: CourtCost[];
  onAdd: (c: Omit<CourtCost, "id">) => void;
  onUpdate: (c: CourtCost) => void;
  onDelete: (id: string) => void;
}

const emptyForm = (): Omit<CourtCost, "id"> => ({
  date: new Date().toISOString().substring(0, 10),
  description: "",
  amount: 0,
  processNumber: "",
  clientName: "",
  reimbursed: false,
  notes: "",
});

export default function CourtCostsTab({ courtCosts, onAdd, onUpdate, onDelete }: CourtCostsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState<"all" | "pending" | "reimbursed">("all");
  const [search, setSearch] = useState("");

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setShowForm(false); };

  const handleSubmit = () => {
    if (!form.description.trim() || form.amount <= 0) return;
    if (editingId) {
      onUpdate({ ...form, id: editingId });
    } else {
      onAdd(form);
    }
    resetForm();
  };

  const startEdit = (c: CourtCost) => {
    setEditingId(c.id);
    setForm({ date: c.date, description: c.description, amount: c.amount, processNumber: c.processNumber || "", clientName: c.clientName || "", reimbursed: c.reimbursed, reimbursedDate: c.reimbursedDate, notes: c.notes || "" });
    setShowForm(true);
  };

  const toggleReimbursed = (c: CourtCost) => {
    onUpdate({ ...c, reimbursed: !c.reimbursed, reimbursedDate: !c.reimbursed ? new Date().toISOString().substring(0, 10) : undefined });
  };

  const filtered = courtCosts
    .filter(c => filter === "all" || (filter === "reimbursed" ? c.reimbursed : !c.reimbursed))
    .filter(c => !search || c.description.toLowerCase().includes(search.toLowerCase()) || c.clientName?.toLowerCase().includes(search.toLowerCase()) || c.processNumber?.includes(search));

  const totalPaid = courtCosts.reduce((s, c) => s + c.amount, 0);
  const totalReimbursed = courtCosts.filter(c => c.reimbursed).reduce((s, c) => s + c.amount, 0);
  const totalPending = totalPaid - totalReimbursed;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total de Custas Pagas", value: formatCurrency(totalPaid), sub: `${courtCosts.length} registros`, color: "text-slate-800" },
          { label: "Reembolsado por Clientes", value: formatCurrency(totalReimbursed), sub: `${courtCosts.filter(c => c.reimbursed).length} custas`, color: "text-emerald-600" },
          { label: "A Reembolsar (Pendente)", value: formatCurrency(totalPending), sub: `${courtCosts.filter(c => !c.reimbursed).length} custas em aberto`, color: totalPending > 0 ? "text-amber-600" : "text-slate-400" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">{label}</p>
            <h3 className={`text-2xl font-black font-display ${color}`}>{value}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descrição, cliente ou processo..."
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400" />
          <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            {(["all","pending","reimbursed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[10px] font-bold rounded transition cursor-pointer ${filter === f ? "bg-white shadow text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>
                {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : "Reembolsadas"}
              </button>
            ))}
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Registrar Custa
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-700">{editingId ? "Editar Custa" : "Registrar Custa Processual"}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Data *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Descrição *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Taxa de preparo recursal TJPE"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valor (R$) *</label>
                <input type="number" step="0.01" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nº do Processo</label>
                <input value={form.processNumber || ""} onChange={e => setForm(f => ({ ...f, processNumber: e.target.value }))}
                  placeholder="0000000-00.0000.0.00.0000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cliente</label>
                <input value={form.clientName || ""} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="Nome do cliente"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="reimbursed-check" checked={form.reimbursed}
                  onChange={e => setForm(f => ({ ...f, reimbursed: e.target.checked }))} className="accent-emerald-600 cursor-pointer" />
                <label htmlFor="reimbursed-check" className="text-xs text-slate-600 cursor-pointer">Já reembolsado</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                <Check className="w-3.5 h-3.5" /> {editingId ? "Salvar" : "Registrar"}
              </button>
              <button onClick={resetForm} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Scale className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="font-bold text-sm">Nenhuma custa registrada</p>
            <p className="text-xs mt-1">Registre custas processuais para controlar reembolsos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-2 px-3 text-left">Data</th>
                  <th className="py-2 px-3 text-left">Descrição</th>
                  <th className="py-2 px-3 text-left">Processo</th>
                  <th className="py-2 px-3 text-left">Cliente</th>
                  <th className="py-2 px-3 text-right">Valor</th>
                  <th className="py-2 px-3 text-center">Reembolso</th>
                  <th className="py-2 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className={`hover:bg-slate-50/50 ${c.reimbursed ? "" : "bg-amber-50/20"}`}>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{c.date.split("-").reverse().join("/")}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-xs truncate">{c.description}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{c.processNumber || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.clientName || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-800">{formatCurrency(c.amount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button onClick={() => toggleReimbursed(c)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border cursor-pointer transition ${c.reimbursed ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"}`}>
                        {c.reimbursed ? <><CheckCheck className="w-3 h-3" /> Reembolsado</> : <><Clock className="w-3 h-3" /> Pendente</>}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
