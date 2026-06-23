import React, { useState } from "react";
import { Client, Transaction, TransactionType, TransactionScope } from "../types";
import { Users, Plus, Trash2, Edit3, Phone, Mail, FileText, TrendingUp, Clock, Check, X, ExternalLink, Printer } from "lucide-react";
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

  const [statementClient, setStatementClient] = useState<Client | null>(null);

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
                    <button onClick={() => setStatementClient(c)} title="Ver extrato do cliente"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
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

      {/* Extrato modal */}
      {statementClient && (() => {
        const clientTxs = transactions
          .filter(t => t.clientName === statementClient.name)
          .sort((a, b) => b.date.localeCompare(a.date));
        const totalRec = clientTxs.filter(t => t.type === TransactionType.REVENUE && t.status !== "PREVISTO").reduce((s, t) => s + t.amount, 0);
        const totalPend = clientTxs.filter(t => t.type === TransactionType.REVENUE && t.status === "PREVISTO").reduce((s, t) => s + t.amount, 0);
        const totalExp = clientTxs.filter(t => t.type === TransactionType.EXPENSE && t.status !== "PREVISTO").reduce((s, t) => s + t.amount, 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setStatementClient(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-slate-950 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center">
                    <span className="text-indigo-300 font-black text-sm">{statementClient.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{statementClient.name}</p>
                    <p className="text-[10px] text-slate-400">Extrato completo de lançamentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Print the statement modal content
                      const printContent = document.getElementById("client-statement-print");
                      if (!printContent) return;
                      const win = window.open("", "_blank", "width=700,height=900");
                      if (!win) return;
                      win.document.write(`<html><head><title>Extrato — ${statementClient.name}</title>
                        <style>body{font-family:sans-serif;font-size:12px;color:#1e293b;padding:24px;}
                        h2{margin:0 0 4px}p{margin:2px 0}.kpi{display:flex;gap:24px;margin:16px 0;padding:12px;border:1px solid #e2e8f0;border-radius:8px;}
                        .kpi-item{flex:1;text-align:center}.kpi-label{font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:bold}
                        .kpi-value{font-size:20px;font-weight:900;font-family:monospace}.tx-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;align-items:center}
                        .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.green{background:#10b981}.red{background:#f43f5e}
                        .tx-desc{flex:1}.tx-date{color:#94a3b8;font-size:10px}.tx-amount{font-family:monospace;font-weight:bold}
                        </style></head><body>`);
                      win.document.write(printContent.innerHTML);
                      win.document.write("</body></html>");
                      win.document.close();
                      win.focus();
                      setTimeout(() => { win.print(); win.close(); }, 300);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition cursor-pointer border border-white/20">
                    <Printer className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={() => setStatementClient(null)} className="text-slate-400 hover:text-white transition cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
              </div>
              {/* Printable area */}
              <div id="client-statement-print" style={{ display: "none" }}>
                <h2>{statementClient.name}</h2>
                <p style={{ color: "#94a3b8", fontSize: 10 }}>Extrato completo de lançamentos</p>
                <div className="kpi">
                  <div className="kpi-item"><div className="kpi-label">Recebido</div><div className="kpi-value" style={{ color: "#059669" }}>R$ {totalRec.toFixed(2)}</div></div>
                  <div className="kpi-item"><div className="kpi-label">A Receber</div><div className="kpi-value" style={{ color: "#d97706" }}>R$ {totalPend.toFixed(2)}</div></div>
                  <div className="kpi-item"><div className="kpi-label">Custos</div><div className="kpi-value" style={{ color: "#e11d48" }}>R$ {totalExp.toFixed(2)}</div></div>
                </div>
                {clientTxs.map(t => (
                  <div key={t.id} className="tx-row">
                    <div className={`dot ${t.type === TransactionType.REVENUE ? "green" : "red"}`} />
                    <div className="tx-desc">
                      <div>{t.description}</div>
                      <div className="tx-date">{t.date.split("-").reverse().join("/")} · {t.category}</div>
                    </div>
                    <div className={`tx-amount`} style={{ color: t.type === TransactionType.REVENUE ? "#059669" : "#e11d48" }}>
                      {t.type === TransactionType.REVENUE ? "+" : "-"}R$ {t.amount.toFixed(2)}
                      {t.status === "PREVISTO" ? " (Prev)" : ""}
                    </div>
                  </div>
                ))}
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-200">
                {[
                  { label: "Recebido", value: totalRec, cls: "text-emerald-600" },
                  { label: "A Receber", value: totalPend, cls: "text-amber-600" },
                  { label: "Custos", value: totalExp, cls: "text-rose-600" },
                ].map(k => (
                  <div key={k.label} className="bg-white px-4 py-3 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
                    <p className={`text-lg font-black font-mono ${k.cls}`}>{formatCurrency(k.value)}</p>
                  </div>
                ))}
              </div>
              {/* Transactions */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {clientTxs.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-bold">Nenhum lançamento vinculado</p>
                    <p className="text-xs mt-1">Associe lançamentos a este cliente no Livro Caixa</p>
                  </div>
                ) : clientTxs.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.type === TransactionType.REVENUE ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{t.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{t.date.split("-").reverse().join("/")} · {t.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold font-mono ${t.type === TransactionType.REVENUE ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.type === TransactionType.REVENUE ? "+" : "-"}{formatCurrency(t.amount)}
                      </p>
                      {t.status === "PREVISTO" && <span className="text-[9px] text-amber-600 font-bold">Previsto</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
