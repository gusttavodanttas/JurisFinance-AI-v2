import React, { useState, useEffect } from "react";
import { Transaction, TransactionScope, TransactionType } from "../types";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Trash2,
  Clipboard,
  ShieldCheck,
  AlertCircle,
  History,
  ChevronDown
} from "lucide-react";
import { formatCurrency } from "../utils/currency";

interface ConciliationRecord {
  date: string;
  count: number;
  avgConfidence: number;
}

const HISTORY_KEY = "ai_conciliation_history";

interface AISeparatorProps {
  onAddTransactions: (newTransactions: Omit<Transaction, "id">[]) => void;
}

interface AIItem {
  date: string;
  description: string;
  type: TransactionType;
  scope: TransactionScope;
  category: string;
  amount: number;
  confidence: number;
  reason: string;
  selected: boolean;
  groupType?: string;
}

export default function AISeparator({ onAddTransactions }: AISeparatorProps) {
  const [rawText, setRawText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<AIItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [history, setHistory] = useState<ConciliationRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const handlePasteSample1 = () => {
    setRawText(
      `15/06 COMPRA PAPELARIA ARCO IRIS -54,90
15/06 RECEBIMENTO PIX HONORARIOS JORGE REIS +2500,00
16/06 IFOOD DELIVERY GOURMET -145,00 (paguei na conta pj por engano)
16/06 CUSTAS DE PREPARO RECURSAL TJSP CNPJ-PJ -380,00`
    );
  };

  const handlePasteSample2 = () => {
    setRawText(
      `Ontem fiz uma reunião com o Dr. Carlos e pagamos R$ 190,00 de almoço executivo no restaurante vips no cartão de crédito do escritório. Depois paguei a anuidade da OAB de R$ 920,00 no boleto PJ, e comprei o presente de aniversário de casamento da minha esposa por R$ 350,00 no pix do escritório hoje cedo.`
    );
  };

  const handleProcess = async () => {
    if (!rawText.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessCount(null);
    setExtractedItems([]);

    try {
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawText: rawText,
          customDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de processamento no servidor backend.");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        const itemsWithSelection = data.map((item: any) => ({
          ...item,
          // Fallbacks for sanitization
          type: item.type === "REVENUE" ? TransactionType.REVENUE : TransactionType.EXPENSE,
          scope: item.scope === "PERSONAL" ? TransactionScope.PERSONAL : TransactionScope.PROFESSIONAL,
          amount: parseFloat(String(item.amount || 0)),
          confidence: parseInt(String(item.confidence || 90)),
          selected: true, // Default selected for importing
        }));
        setExtractedItems(itemsWithSelection);
      } else {
        throw new Error("Formato de dados retornado inválido.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Não foi possível conectar ao robô financeiro. Verifique se o servidor de desenvolvimento está rodando."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    const updated = [...extractedItems];
    updated[index].selected = !updated[index].selected;
    setExtractedItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = extractedItems.filter((_, idx) => idx !== index);
    setExtractedItems(updated);
  };

  // Convert Type/Scope back into user-friendly description
  const handleImport = () => {
    const selected = extractedItems.filter((item) => item.selected);
    if (selected.length === 0) return;

    const formatted: Omit<Transaction, "id">[] = selected.map((item) => ({
      date: item.date,
      description: item.description,
      type: item.type,
      scope: item.scope,
      category: item.category,
      amount: item.amount,
      notes: `Importado via IA. Confiança: ${item.confidence}%. Raciocínio: ${item.reason}`,
      isAiCategorized: item.scope === TransactionScope.PERSONAL, // Mark personal leak if categorized as personal
    }));

    onAddTransactions(formatted);
    setSuccessCount(selected.length);

    // Save to conciliation history
    const avgConf = Math.round(selected.reduce((sum, i) => sum + i.confidence, 0) / selected.length);
    const record: ConciliationRecord = { date: new Date().toISOString(), count: selected.length, avgConfidence: avgConf };
    const updated = [record, ...history].slice(0, 20);
    setHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}

    setExtractedItems([]);
    setRawText("");
  };


  return (
    <div id="ai-separator-widget" className="bg-[#0f172a] rounded-lg p-5 text-white shadow-md border border-slate-800">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded border border-[#8b5cf6]/30">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <h3 className="text-sm font-bold tracking-tight">Separador Inteligente de Custos com IA</h3>
      </div>
      <p className="text-[11px] text-slate-300 mb-4 leading-relaxed">
        Cole linhas de extrato bancário, planilhas geradas pelo banco PJ ou apenas relate o ocorrido por escrito. Nosso algorítmo acionado por inteligência artificial separa despesas de escritório das despesas e gastos pessoais, justificando a alocação de forma automatizada no Livro Caixa.
      </p>

      {/* INPUT FORM CODES */}
      <div className="space-y-3.5">
        <div>
          <label htmlFor="ai-raw-text" className="block text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase font-mono">
            Extrato bruto ou descrição livre dos fatos
          </label>
          <textarea
            id="ai-raw-text"
            className="w-full bg-[#090d16] border border-slate-800 rounded-md p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-[#8b5cf6] min-h-[110px]"
            placeholder="Cole linhas de extrato ou descreva ej: 'Paguei 55 reais de Netflix no mesmo dia com caixa do escritório e recebi R$ 3.500 de honorários...'"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        {/* SAMPLE PRE-SEEDS BUTTONS */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button
              id="ai-btn-sample-1"
              type="button"
              onClick={handlePasteSample1}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Clipboard className="w-3 h-3" />
              Exemplo: Extrato PJ Geral
            </button>
            <button
              id="ai-btn-sample-2"
              type="button"
              onClick={handlePasteSample2}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Exemplo: Relato de Conversa
            </button>
          </div>

          <button
            id="ai-btn-process"
            type="button"
            disabled={isLoading || !rawText.trim()}
            onClick={handleProcess}
            className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
              isLoading || !rawText.trim()
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 active:scale-[98%]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Separando Finanças...
              </>
            ) : (
              <>
                Analisar & Separar com IA
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERROR FEEDBACK */}
      {error && (
        <div id="ai-error-box" className="mt-4 bg-red-950/80 border border-red-800 text-red-100 rounded-xl p-4 flex gap-2 text-xs">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-red-400" />
          <div className="space-y-1">
            <p className="font-bold">Ocorreu um Erro</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {successCount && (
        <div id="ai-success-box" className="mt-4 bg-emerald-950/80 border border-emerald-800 text-emerald-100 rounded-xl p-4 flex gap-2.5 text-xs animate-fade-in">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-bold">Processado com Sucesso!</p>
            <p>{successCount} transações foram catalogadas, separadas eletronicamente e adicionadas aos relatórios.</p>
          </div>
        </div>
      )}

      {/* RENDER EXTRACTIONS PREVIEW */}
      {extractedItems.length > 0 && (
        <div id="ai-extracted-preview" className="mt-6 border-t border-indigo-900/60 pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {extractedItems.length} Transações Identificadas e Processadas
            </h4>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Revisão por Alçada</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-indigo-900 bg-slate-950/80 max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-indigo-900 text-indigo-400 font-semibold bg-slate-900/40">
                  <th className="p-3 text-center w-10">
                    <input 
                      type="checkbox" 
                      className="rounded-sm accent-indigo-600 bg-slate-900 border-indigo-700"
                      checked={extractedItems.every(el => el.selected)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setExtractedItems(extractedItems.map(el => ({ ...el, selected: checked })));
                      }}
                    />
                  </th>
                  <th className="p-3 w-20">Data</th>
                  <th className="p-3">Descrição / Origem</th>
                  <th className="p-3 w-28">Escopo AI</th>
                  <th className="p-3 w-32">Categoria Sugerida</th>
                  <th className="p-3 text-right w-24">Valor</th>
                  <th className="p-3 text-center w-10">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-950">
                {extractedItems.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-indigo-950/20 transition-all ${item.selected ? "opacity-100" : "opacity-40"}`}>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.selected}
                        onChange={() => handleToggleSelect(idx)}
                        className="rounded-sm accent-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-mono text-[11px] whitespace-nowrap">{item.date}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-100">{item.description}</div>
                      {item.reason && (
                        <div className="text-[10px] text-indigo-400 mt-0.5 leading-tight italic">
                          💡 &ldquo;{item.reason}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${
                          item.scope === TransactionScope.PROFESSIONAL
                            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                            : "bg-sky-500/10 text-sky-300 border-sky-500/30"
                        }`}>
                          {item.scope === TransactionScope.PROFESSIONAL ? "Profissional PJ" : "Pessoal PF"}
                        </span>
                        {item.type === TransactionType.EXPENSE && item.groupType && (
                          <span className={`inline-block px-1 py-0.5 rounded text-[8px] font-bold font-mono border whitespace-nowrap ${
                            item.groupType === "G1"
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                              : item.groupType === "G2"
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                              : item.groupType === "G3"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                              : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                          }`}>
                            ⚡ Prioridade: {item.groupType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-slate-200">{item.category}</div>
                      <span className="text-[9px] text-slate-500">Confiança: {item.confidence}%</span>
                    </td>
                    <td className="p-3 text-right font-semibold font-mono text-slate-100">
                      <span className={item.type === TransactionType.REVENUE ? "text-emerald-400" : "text-rose-400"}>
                        {item.type === TransactionType.REVENUE ? "+" : "-"} {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 hover:bg-indigo-900/50 hover:text-red-400 text-slate-400 rounded-sm transition-all"
                        title="Remover transação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              id="ai-btn-cancel-extracted"
              type="button"
              onClick={() => setExtractedItems([])}
              className="px-4 py-2 bg-slate-900 border border-indigo-900 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all"
            >
              Descartar Prévia
            </button>
            <button
              id="ai-btn-import-extracted"
              type="button"
              onClick={handleImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/10 border border-emerald-500 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 active:scale-[98%]"
            >
              <Plus className="w-4 h-4" />
              Aprovar e Lançar no Livro Caixa
            </button>
          </div>
        </div>
      )}

      {/* CONCILIATION HISTORY */}
      {history.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-widest transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            Histórico de Conciliações ({history.length})
            <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <div className="mt-3 space-y-1.5">
              {history.map((rec, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300 font-mono text-[10px]">
                      {new Date(rec.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px]">{rec.count} transações</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${rec.avgConfidence >= 90 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {rec.avgConfidence}% confiança
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
