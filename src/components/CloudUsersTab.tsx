import React, { useState, useEffect } from "react";
import { getAllFirestoreUsers, FirestoreUser } from "../lib/usersDb";
import { RefreshCw, Users, Shield, Briefcase, Mail, Calendar, Search } from "lucide-react";

export default function CloudUsersTab() {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllFirestoreUsers();
      // Sort users by name
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setUsers(sorted);
    } catch (e: any) {
      console.error(e);
      setError("Não foi possível carregar a lista de usuários da nuvem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.oab.toLowerCase().includes(query)
    );
  });

  return (
    <div id="cloud-users-container" className="space-y-6 animate-fade-in">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-indigo-600 pl-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Usuários Registrados em Nuvem</h2>
          <p className="text-xs text-slate-500">
            Abaixo estão documentados todos os advogados com acesso ativo que se cadastraram em nossa infraestrutura integrada no Supabase.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 hover:text-indigo-800 disabled:text-slate-400 font-bold text-xs rounded-lg border border-indigo-150 transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Sincronizando..." : "Atualizar Lista"}
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wilder font-bold font-mono">Contas Registradas</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{loading ? "..." : users.length}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wilder font-bold font-mono">Infraestrutura</p>
            <h3 className="text-sm font-bold text-emerald-700 mt-1">Supabase (PostgreSQL)</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-violet-50 text-violet-600 p-3 rounded-xl border border-violet-100">
            <RefreshCw className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wilder font-bold font-mono">Sincronização</p>
            <h3 className="text-xs font-bold text-slate-700 mt-1">Real-time Unificado</h3>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou OAB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-medium transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Buscando advogados cadastrados na nuvem...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 space-y-2">
            <p className="text-sm font-bold">⚠️ Falha na sincronização</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-25/50">
            <p className="text-sm font-semibold">Nenhum usuário cadastrado encontrado</p>
            <p className="text-xs text-slate-400">Tente buscar por termos diferentes ou certifique-se de que existem contas ativas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="cloud-users-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">E-mail de Cadastro</th>
                  <th className="py-3 px-4">Inscrição OAB</th>
                  <th className="py-3 px-3 text-right">Status da Conta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user, idx) => (
                  <tr key={user.email + idx} className="hover:bg-slate-25/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 flex items-center justify-center text-[11px] shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.oab}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        Ativo na Nuvem
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/60 p-4 rounded-xl leading-relaxed flex items-start gap-2.5">
        <span className="text-base shrink-0 leading-none">🛡️</span>
        <div className="space-y-1">
          <p className="font-bold text-slate-800">Segurança de Dados Compartilhada</p>
          <p>
            O banco de dados Supabase (PostgreSQL) unifica as credenciais do JurisFinance AI entre múltiplos domínios ou navegadores. Qualquer novo advogado que clicar em <b>Criar Conta</b> no site público ou na versão de desenvolvimento será sincronizado instantaneamente na nuvem e aparecerá nesta lista de auditoria com segurança absoluta.
          </p>
        </div>
      </div>
    </div>
  );
}
