import React, { useState } from "react";
import { Client, Transaction, TransactionType } from "../types";
import { Users, Plus, Trash2, Edit3, Phone, Mail, FileText, TrendingUp, Clock, Check, X } from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface ClientsTabProps {
  clients: Client[];
  transactions: Transaction[];
  onAddClient: (c: Omit<Client, "id" | "createdAt">) => void;
  onUpdateClient: (c: Client) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientsTab({ clients, transactions, onAddClient, onUpdateClient, onDeleteClient }: ClientsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const resetForm = () => { setName(""); setEmail(""); setPhone(""); setNotes(""); setEditingId(null); setShowForm(false); };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editingId) {
      const existing = clients.find(c => c.id === editingId)!;
      onUpdateClient({ ...existing, name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, notes: notes.trim() || undefined });
    } else {
      onAddClient({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, notes: notes.trim() || undefined });
    }
    resetForm();
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id); setName(c.name); setEmail(c.email || ""); setPhone(c.phone || ""); setNotes(c.notes || ""); setShowForm(true);
  };

  const getClientStats = (clientName: string) => {
    const txs = transactions.filter(t => t.clientName === clientName && t.status !== "PREVISTO");
    const received = txs.filter(t => t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
    const pending = transactions.filter(t => t.clientName === clientName && t.status === "PREVISTO" && t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
    return { received, pending, txCount: txs.length };
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));
  const totalReceived = clients.reduce((s, c) => s + getClientStats(c.name).received, 0);
  const totalPending = clients.reduce((s, c) => s + getClientStats(c.name).pending, 0);

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total de Clientes", value: clients.length.toString(), sub: "cadastrados", color: "text-indigo-600" },
          { label: "Honorários Recebidos", value: formatCurrency(totalReceived), sub: "efetivamente pagos", color: "text-emerald-600" },
          { label: "A Receber (Previsto)", value: formatCurrency(totalPending), sub: "pendente de pagamento", color: "text-amber-600" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">{label}</p>
            <h3 className={`text-2xl font-black font-display ${color}`}>{value}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400" />
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Novo Cliente
          </button>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-xs font-bold text-slate-700">{editingId ? "Editar Cliente" : "Cadastrar Novo Cliente"}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome / Razão Social *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João da Silva" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">E-mail</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Telefone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(81) 99999-0000" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Observações</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Processo, tipo de causa..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                <Check className="w-3.5 h-3.5" /> {editingId ? "Salvar" : "Cadastrar"}
              </button>
              <button onClick={resetForm} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 text-xs rounded-lg cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="font-bold text-sm">Nenhum cliente cadastrado</p>
            <p className="text-xs mt-1">Clique em "Novo Cliente" para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => {
              const stats = getClientStats(c.name);
              return (
                <div key={c.id} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 hover:border-indigo-200 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-700 font-black text-sm">{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{c.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.email && <span className="flex items-center gap-1 text-[10px] text-slate-400"><Mail className="w-3 h-3" />{c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1 text-[10px] text-slate-400"><Phone className="w-3 h-3" />{c.phone}</span>}
                      {c.notes && <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[140px]"><FileText className="w-3 h-3" />{c.notes}</span>}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 flex-shrink-0 text-center">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Recebido</p>
                      <p className="text-sm font-black text-emerald-600 font-mono">{formatCurrency(stats.received)}</p>
                    </div>
                    {stats.pending > 0 && (
                      <div>
                        <p className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">A Receber</p>
                        <p className="text-sm font-black text-amber-600 font-mono">{formatCurrency(stats.pending)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Lançamentos</p>
                      <p className="text-sm font-black text-slate-700">{stats.txCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteClient(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
