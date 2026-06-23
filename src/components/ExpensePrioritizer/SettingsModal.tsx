import React from "react";
import { Settings, Trash2, X } from "lucide-react";
import {
  TransactionScope, TransactionType,
  deleteCustomCategory, ALL_CATEGORIES_MAP,
  PROFESSIONAL_REVENUE_CATEGORIES, PROFESSIONAL_EXPENSE_CATEGORIES,
  PERSONAL_REVENUE_CATEGORIES, PERSONAL_EXPENSE_CATEGORIES,
} from "../../types";

interface PriorityGroup { id: string; name: string; color: string; }

interface SettingsModalProps {
  priorityGroups: PriorityGroup[];
  settingsTab: "groups" | "categories";
  setSettingsTab: (tab: "groups" | "categories") => void;
  catScope: TransactionScope;
  setCatScope: (s: TransactionScope) => void;
  catType: TransactionType;
  setCatType: (t: TransactionType) => void;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  newGroupName: string;
  setNewGroupName: (v: string) => void;
  newGroupColor: string;
  setNewGroupColor: (v: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onChangeGroupColor: (id: string, color: string) => void;
  onAddGroup: (e: React.FormEvent) => void;
  onDeleteGroup: (id: string) => void;
  onAddCategory: (e: React.FormEvent) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { value: "bg-red-500", label: "🔴 Vermelho" },
  { value: "bg-orange-500", label: "🟠 Laranja" },
  { value: "bg-amber-500", label: "🟡 Amarelo" },
  { value: "bg-emerald-500", label: "🟢 Verde" },
  { value: "bg-blue-500", label: "🔵 Azul" },
  { value: "bg-indigo-500", label: "🟣 Indigo" },
  { value: "bg-[#8b5cf6]", label: "🔮 Violeta" },
  { value: "bg-pink-500", label: "🌸 Rosa" },
  { value: "bg-slate-500", label: "⚫ Cinza" },
];

function isDefaultCategory(scope: TransactionScope, type: TransactionType, name: string): boolean {
  if (scope === TransactionScope.PROFESSIONAL) {
    return type === TransactionType.REVENUE
      ? PROFESSIONAL_REVENUE_CATEGORIES.includes(name)
      : PROFESSIONAL_EXPENSE_CATEGORIES.includes(name);
  }
  return type === TransactionType.REVENUE
    ? PERSONAL_REVENUE_CATEGORIES.includes(name)
    : PERSONAL_EXPENSE_CATEGORIES.includes(name);
}

export default function SettingsModal({
  priorityGroups, settingsTab, setSettingsTab,
  catScope, setCatScope, catType, setCatType,
  newCategoryName, setNewCategoryName,
  newGroupName, setNewGroupName, newGroupColor, setNewGroupColor,
  onRenameGroup, onChangeGroupColor, onAddGroup, onDeleteGroup, onAddCategory, onClose,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-scale-up text-left">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col text-slate-800">
        <div className="flex justify-between items-center bg-slate-900 text-white p-4">
          <div className="flex items-center gap-2 font-sans">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-tight uppercase">Painel de Personalização</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-5">
          <div className="flex border-b border-slate-200">
            <button type="button" onClick={() => setSettingsTab("groups")}
              className={`py-2.5 px-5 text-xs font-bold transition-all border-b-2 cursor-pointer ${settingsTab === "groups" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              📁 Subgrupos de Prioridade (Despesas)
            </button>
            <button type="button" onClick={() => setSettingsTab("categories")}
              className={`py-2.5 px-5 text-xs font-bold transition-all border-b-2 cursor-pointer ${settingsTab === "categories" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              🏷️ Categorias de Lançamentos
            </button>
          </div>

          {/* GROUPS TAB */}
          {settingsTab === "groups" && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3.5 rounded-r-lg text-xs text-indigo-900">
                Gerencie os subgrupos de priorização. Renomeie, mude a cor, delete ou crie novos subgrupos conforme a realidade financeira do seu escritório.
              </div>

              <form onSubmit={onAddGroup} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-6 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nome do Novo Subgrupo</label>
                  <input type="text" required placeholder="Ex: Subgrupo 4 • Custos Operacionais"
                    value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800" />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Cor do Indicador</label>
                  <select value={newGroupColor} onChange={e => setNewGroupColor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-semibold">
                    {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer">
                    + Criar
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subgrupos Ativos</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  {priorityGroups.map(g => (
                    <div key={g.id} className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${g.color || "bg-slate-400"}`}></span>
                        <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">{g.id}</span>
                        <input type="text" value={g.name} onChange={e => onRenameGroup(g.id, e.target.value)}
                          className="bg-transparent hover:bg-slate-100 focus:bg-white border-b border-transparent focus:border-indigo-400 px-1 py-0.5 text-xs text-slate-800 font-semibold w-full md:w-[320px] rounded focus:outline-hidden" />
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                        <select value={g.color || "bg-slate-500"} onChange={e => onChangeGroupColor(g.id, e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[11px] focus:outline-hidden text-slate-700 font-medium">
                          {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label.replace(/[🔴🟠🟡🟢🔵🟣🔮🌸⚫] /, "")}</option>)}
                        </select>
                        <button type="button" onClick={() => onDeleteGroup(g.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {settingsTab === "categories" && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3.5 rounded-r-lg text-xs text-indigo-900">
                Configure categorias personalizadas de lançamentos. Escolha o escopo e o tipo para gerenciar as opções exibidas nos formulários.
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([
                  [TransactionScope.PROFESSIONAL, TransactionType.EXPENSE, "💼 PJ: Despesas"],
                  [TransactionScope.PROFESSIONAL, TransactionType.REVENUE, "💼 PJ: Receitas"],
                  [TransactionScope.PERSONAL, TransactionType.EXPENSE, "🏠 PF: Despesas"],
                  [TransactionScope.PERSONAL, TransactionType.REVENUE, "🏠 PF: Receitas"],
                ] as [TransactionScope, TransactionType, string][]).map(([sc, ty, label]) => (
                  <button key={`${sc}_${ty}`} type="button"
                    onClick={() => { setCatScope(sc); setCatType(ty); }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      catScope === sc && catType === ty
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={onAddCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3 items-end">
                <div className="flex-grow space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Nova Categoria ({catScope === TransactionScope.PROFESSIONAL ? "Escritório/PJ" : "Pessoal/PF"} • {catType === TransactionType.EXPENSE ? "Despesa" : "Receita"})
                  </label>
                  <input type="text" required placeholder="Ex: Carro, Combustível, Uber..."
                    value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800" />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-5 rounded-lg transition-colors cursor-pointer h-[36px]">
                  Adicionar
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categorias Cadastradas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/60">
                  {(ALL_CATEGORIES_MAP[`${catScope}_${catType}`] || []).map(catName => {
                    const isDefault = isDefaultCategory(catScope, catType, catName);
                    return (
                      <div key={catName} className="p-2.5 bg-white border border-slate-200/50 rounded-lg flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                        <span className="font-semibold text-slate-700">{catName}</span>
                        {isDefault ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">Padrão</span>
                        ) : (
                          <button type="button" onClick={() => deleteCustomCategory(catScope, catType, catName)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all cursor-pointer">
            Concluir e Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
