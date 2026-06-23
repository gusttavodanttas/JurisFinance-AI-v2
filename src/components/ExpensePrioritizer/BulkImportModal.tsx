import React from "react";
import { FileSpreadsheet, HelpCircle, CheckCircle, Trash2, AlertCircle, Sparkles, Check, X } from "lucide-react";
import { PriorityBill, TransactionScope } from "../../types";

interface PriorityGroup { id: string; name: string; color: string; }

interface BulkImportModalProps {
  priorityGroups: PriorityGroup[];
  parsedPreviewBills: PriorityBill[];
  pastedText: string;
  isAiLoading: boolean;
  aiError: string;
  bulkImportError: string;
  formatCurrency: (val: number) => string;
  onClose: () => void;
  onPasteChange: (text: string) => void;
  onUpdateField: (id: string, key: keyof PriorityBill, value: any) => void;
  onRemoveItem: (id: string) => void;
  onImport: () => void;
  onAiParse: () => void;
  onClearPreview: () => void;
}

export default function BulkImportModal({
  priorityGroups, parsedPreviewBills, pastedText, isAiLoading, aiError, bulkImportError,
  formatCurrency, onClose, onPasteChange, onUpdateField, onRemoveItem, onImport, onAiParse, onClearPreview,
}: BulkImportModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden text-left">
        <div className="flex justify-between items-center bg-slate-900 text-white p-4">
          <div className="flex items-center gap-1.5 font-sans">
            <FileSpreadsheet className="w-5 h-5 text-[#8b5cf6]" />
            <h3 className="text-sm font-bold tracking-tight uppercase">Importar Despesas em Lote (Priorização por Grupos)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 max-h-[80vh] overflow-y-auto">
          {/* Left Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                Como funciona o formato?
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cole uma lista de uma planilha (Excel, Sheets) ou texto. Cada linha representa uma despesa.
              </p>
              <div className="bg-slate-900 text-slate-200 text-[10px] font-mono leading-relaxed p-2.5 rounded-lg border border-slate-800 space-y-1">
                <p className="text-[#a78bfa] font-bold">// Exemplos suportados:</p>
                <p>Aluguel da Sala; 1800,00; G1; PJ</p>
                <p>Softwares Jurídicos; 250,00; G2; PJ</p>
                <p>Impostos DAS; 650,45; G3; PJ</p>
                <p>Supermercado PF; 350,00; WAIT; PF</p>
              </div>
              <div className="text-[10px] text-slate-500 leading-snug space-y-1 pt-1 border-t border-slate-200">
                <p>💡 <b>Campos:</b> Descrição ; Valor ; Grupo ; Escopo</p>
                <p>💡 <b>Grupos:</b> G1, G2, G3 ou WAIT (Esperar)</p>
                <p>💡 <b>Escopo:</b> PJ (Escritório) ou PF (Pessoal)</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Cole sua lista de contas aqui:</label>
              <textarea
                rows={12}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                placeholder={"Aluguel Escritório; 1500,00; G1; PJ\nLicença Software; 220,00; G2\nImpostos; 450,00; G3\nLuz PF; 180; WAIT; PF"}
                value={pastedText}
                onChange={e => onPasteChange(e.target.value)}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium px-1">
                <span>Aceita Tab, ponto e vírgula (;), vírgula, ou texto livre com IA!</span>
                <span>{parsedPreviewBills.length} itens detectados</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isAiLoading || !pastedText.trim()}
                  onClick={onAiParse}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm text-white ${
                    isAiLoading ? "bg-slate-400 cursor-not-allowed"
                    : !pastedText.trim() ? "bg-emerald-600/50 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 text-emerald-200 ${isAiLoading ? "animate-spin" : ""}`} />
                  {isAiLoading ? "Analisando com Inteligência Artificial..." : "Identificar Grupos e Categorizar com IA"}
                </button>

                {aiError && (
                  <div className="mt-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5 text-[11px] leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-8 flex flex-col space-y-3 min-h-[300px]">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Prévia de Importação Inteligente
              </h4>
              {parsedPreviewBills.length > 0 && (
                <button type="button" onClick={onClearPreview} className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer">
                  Limpar Verificação
                </button>
              )}
            </div>

            {parsedPreviewBills.length === 0 ? (
              <div className="flex-grow border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-400 text-center bg-slate-50/55 min-h-[300px]">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 stroke-1 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Pronto para processar dados</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">Cole uma lista de despesas na caixa da esquerda. Analisaremos os valores, grupos e escopos automaticamente!</p>
              </div>
            ) : (
              <div className="flex-grow border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col max-h-[55vh]">
                <div className="overflow-x-auto overflow-y-auto flex-grow p-3 md:p-0">
                  <table className="hidden md:table w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 w-[38%]">Descrição</th>
                        <th className="p-2.5 w-[16%]">Valor (R$)</th>
                        <th className="p-2.5 w-[22%]">Grupo de Prioridade</th>
                        <th className="p-2.5 w-[16%]">Escopo</th>
                        <th className="p-2.5 w-[8%] text-center">Excluir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {parsedPreviewBills.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2">
                            <input type="text"
                              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                              value={item.description}
                              onChange={e => onUpdateField(item.id, "description", e.target.value)}
                            />
                            {item.category && (
                              <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mt-1 inline-block">
                                📁 {item.category}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            <input type="number" step="0.01" min="0.01"
                              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                              value={item.amount || ""}
                              onChange={e => onUpdateField(item.id, "amount", parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-2">
                            <select
                              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs font-semibold focus:outline-hidden text-slate-700"
                              value={item.groupType}
                              onChange={e => onUpdateField(item.id, "groupType", e.target.value)}
                            >
                              {priorityGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>
                              ))}
                              <option value="WAIT">ESPERAR - Fila de Espera</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs focus:outline-hidden text-slate-700"
                              value={item.scope}
                              onChange={e => onUpdateField(item.id, "scope", e.target.value)}
                            >
                              <option value={TransactionScope.PROFESSIONAL}>💼 Escritório (PJ)</option>
                              <option value={TransactionScope.PERSONAL}>🏠 Pessoal (PF)</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button type="button" onClick={() => onRemoveItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <div className="block md:hidden space-y-4">
                    {parsedPreviewBills.map(item => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          {item.category && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">📁 {item.category}</span>
                          )}
                          <button type="button" onClick={() => onRemoveItem(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg bg-slate-50 border border-slate-100 transition-colors cursor-pointer ml-auto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</label>
                            <input type="text"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800"
                              value={item.description}
                              onChange={e => onUpdateField(item.id, "description", e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor (R$)</label>
                              <input type="number" step="0.01" min="0.01"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                                value={item.amount || ""}
                                onChange={e => onUpdateField(item.id, "amount", parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Escopo</label>
                              <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-hidden text-slate-700"
                                value={item.scope}
                                onChange={e => onUpdateField(item.id, "scope", e.target.value)}
                              >
                                <option value={TransactionScope.PROFESSIONAL}>💼 Escritório (PJ)</option>
                                <option value={TransactionScope.PERSONAL}>🏠 Pessoal (PF)</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grupo de Prioridade</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-hidden text-slate-700"
                              value={item.groupType}
                              onChange={e => onUpdateField(item.id, "groupType", e.target.value)}
                            >
                              {priorityGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>
                              ))}
                              <option value="WAIT">ESPERAR - Fila de Espera</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-100 p-2.5 px-4 text-[11px] text-slate-600 flex justify-between items-center border-t border-slate-200 font-sans">
                  <span>Total parcial dos itens editados:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatCurrency(parsedPreviewBills.reduce((acc, curr) => acc + curr.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {bulkImportError && (
          <div className="mx-5 mb-4 bg-red-50 text-rose-600 border border-rose-100 text-xs font-semibold p-3 rounded-lg text-center">
            ⚠️ {bulkImportError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 bg-slate-50 border-t border-slate-200">
          <button type="button" onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-extrabold text-[#64748b] bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer text-center">
            Cancelar
          </button>
          <button type="button" onClick={onImport} disabled={parsedPreviewBills.length === 0}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${parsedPreviewBills.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
            <Check className="w-3.5 h-3.5" />
            Importar {parsedPreviewBills.length} Lançamentos
          </button>
        </div>
      </div>
    </div>
  );
}
