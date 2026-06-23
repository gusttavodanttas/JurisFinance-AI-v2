import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  PriorityBill, TransactionScope, TransactionType,
  addCustomCategory, ALL_CATEGORIES_MAP,
} from "../types";
import {
  CheckCircle, Clock, ArrowRight, ArrowLeft, Plus, Trash2,
  AlertCircle, TrendingUp, FileSpreadsheet, Settings,
  ChevronLeft, ChevronRight, CalendarDays, X, Sparkles,
} from "lucide-react";
import BulkImportModal from "./ExpensePrioritizer/BulkImportModal";
import SettingsModal from "./ExpensePrioritizer/SettingsModal";
import { formatCurrency } from "../utils/currency";

const incrementMonth = (startMonthStr: string, increment: number): string => {
  const [yearStr, monthStr] = startMonthStr.split("-");
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1 + increment, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const PT_MONTHS_LONG = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

interface ExpensePrioritizerProps {
  bills: PriorityBill[];
  onUpdateBills: (updated: PriorityBill[]) => void;
  onResetBills: () => void;
  onAddTransactionToLedger: (item: { description: string; amount: number; scope: TransactionScope; category: string; date: string; paymentMethod?: string; }) => void;
  selectedMonth: string;
  onSetSelectedMonth?: (month: string) => void;
}

type PriorityGroup = { id: string; name: string; color: string };

export default function ExpensePrioritizer({
  bills, onUpdateBills, onResetBills, onAddTransactionToLedger, selectedMonth, onSetSelectedMonth,
}: ExpensePrioritizerProps) {
  const gdEmail = sessionStorage.getItem("gd_auth_email") || "default";

  // ── Add form state ──────────────────────────────────────────────────────────
  const [desc, setDesc] = useState("");
  const [amountVal, setAmountVal] = useState("");
  const [scopeVal, setScopeVal] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);
  const [targetStatus, setTargetStatus] = useState<"PAGAR" | "ESPERAR">("PAGAR");
  const [targetGroup, setTargetGroup] = useState<string>("P1");
  const [filterScope, setFilterScope] = useState<"ALL" | "PROFESSIONAL" | "PERSONAL">("ALL");
  const [billingType, setBillingType] = useState<"unique" | "fixed" | "installment">("unique");
  const [billingCount, setBillingCount] = useState<string>("12");
  const [dueDayVal, setDueDayVal] = useState<string>("");
  const [payMethodVal, setPayMethodVal] = useState<string>("");
  const [confirmingBillId, setConfirmingBillId] = useState<string | null>(null);

  // ── Settings state ──────────────────────────────────────────────────────────
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"groups" | "categories">("groups");
  const [catScope, setCatScope] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);
  const [catType, setCatType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("bg-blue-500");
  const [categoriesUpdatedTrigger, setCategoriesUpdatedTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setCategoriesUpdatedTrigger(p => p + 1);
    window.addEventListener("categories_updated", handler);
    return () => window.removeEventListener("categories_updated", handler);
  }, []);

  // ── Priority groups ─────────────────────────────────────────────────────────
  const [priorityGroups, setPriorityGroups] = useState<PriorityGroup[]>(() => {
    const saved = localStorage.getItem(`priority_groups_${gdEmail}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((g: PriorityGroup) => {
            if (g.id === "G1") return { ...g, id: "P1" };
            if (g.id === "G2") return { ...g, id: "P2" };
            if (g.id === "G3") return { ...g, id: "P3" };
            return g;
          });
          localStorage.setItem(`priority_groups_${gdEmail}`, JSON.stringify(migrated));
          return migrated;
        }
      } catch { /* ignore */ }
    }
    return [
      { id: "P1", name: "Subgrupo 1 • Custos Urgentes", color: "bg-red-500" },
      { id: "P2", name: "Subgrupo 2 • Acordos e Lazer", color: "bg-orange-500" },
      { id: "P3", name: "Subgrupo 3 • Assinaturas e Planos", color: "bg-[#8b5cf6]" },
    ];
  });

  const savePriorityGroups = (updated: PriorityGroup[]) => {
    setPriorityGroups(updated);
    localStorage.setItem(`priority_groups_${gdEmail}`, JSON.stringify(updated));
  };

  // Migrate old G1/G2/G3 keys in existing bills
  useEffect(() => {
    const hasOld = bills.some(b => b.groupType === "G1" || b.groupType === "G2" || b.groupType === "G3");
    if (hasOld) {
      onUpdateBills(bills.map(b => {
        if (b.groupType === "G1") return { ...b, groupType: "P1" };
        if (b.groupType === "G2") return { ...b, groupType: "P2" };
        if (b.groupType === "G3") return { ...b, groupType: "P3" };
        return b;
      }));
    }
  }, [bills, onUpdateBills]);

  // ── Bulk import state ───────────────────────────────────────────────────────
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [parsedPreviewBills, setParsedPreviewBills] = useState<PriorityBill[]>([]);
  const [bulkImportError, setBulkImportError] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // ── Computed values ─────────────────────────────────────────────────────────
  const filteredBills = useMemo(() =>
    bills.filter(b => filterScope === "ALL" || b.scope === filterScope),
    [bills, filterScope]
  );

  const getSubgroupTotals = useCallback((group: string) => {
    const items = filteredBills.filter(b => b.status === "PAGAR" && b.groupType === group && !b.paid);
    return { sum: items.reduce((a, b) => a + b.amount, 0), count: items.length, items };
  }, [filteredBills]);

  const { totalPagar, countPagar, pagarList } = useMemo(() => {
    const list = filteredBills.filter(b => b.status === "PAGAR");
    return { totalPagar: list.reduce((a, b) => a + (b.paid ? 0 : b.amount), 0), countPagar: list.filter(b => !b.paid).length, pagarList: list };
  }, [filteredBills]);

  const { totalEsperar, countEsperar, esperarList } = useMemo(() => {
    const list = filteredBills.filter(b => b.status === "ESPERAR");
    return { totalEsperar: list.reduce((a, b) => a + (b.paid ? 0 : b.amount), 0), countEsperar: list.filter(b => !b.paid).length, esperarList: list };
  }, [filteredBills]);

  const { totalPaid, countPaid } = useMemo(() => {
    const list = filteredBills.filter(b => b.paid);
    return { totalPaid: list.reduce((a, b) => a + b.amount, 0), countPaid: list.length };
  }, [filteredBills]);

  const readableMonth = (() => {
    const [y, m] = selectedMonth.split("-");
    return `${PT_MONTHS_LONG[parseInt(m) - 1]} de ${y}`;
  })();

  // ── Bill mutation handlers ──────────────────────────────────────────────────
  const handleToggleStatus = (id: string) => {
    onUpdateBills(bills.map(b => b.id === id ? {
      ...b,
      status: b.status === "PAGAR" ? "ESPERAR" : "PAGAR",
      groupType: b.status === "PAGAR" ? "WAIT" : (priorityGroups[0]?.id || "P1"),
    } : b));
  };

  const handleChangeGroup = (id: string, group: string) =>
    onUpdateBills(bills.map(b => b.id === id ? { ...b, groupType: group } : b));

  const handleDeleteBill = (id: string) =>
    onUpdateBills(bills.filter(b => b.id !== id));

  const handleUpdateBillField = (id: string, field: keyof PriorityBill, value: any) =>
    onUpdateBills(bills.map(b => b.id === id ? { ...b, [field]: value } : b));

  const handlePayAndRegister = (bill: PriorityBill) => {
    const month = bill.month || selectedMonth;
    const day = bill.dueDay ? String(bill.dueDay).padStart(2, "0") : new Date().toISOString().substring(8, 10);
    const dateStr = `${month}-${day}`;
    onAddTransactionToLedger({
      description: `Pgto Prioritário: ${bill.description}`,
      amount: bill.amount,
      scope: bill.scope,
      category: bill.category || (bill.scope === TransactionScope.PROFESSIONAL ? "Outras Despesas Profissionais" : "Outras Despesas Pessoais"),
      date: dateStr,
      paymentMethod: bill.paymentMethod,
    });
    onUpdateBills(bills.map(b => b.id === bill.id ? { ...b, paid: true } : b));
    setConfirmingBillId(null);
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amountVal) return;
    const numVal = parseFloat(amountVal.replace(",", "."));
    if (isNaN(numVal) || numVal <= 0) return;
    const dueDay = dueDayVal ? parseInt(dueDayVal) : undefined;

    const count = parseInt(billingCount) || 1;
    const generated: PriorityBill[] = [];

    if (billingType === "unique") {
      generated.push({
        id: "pb-custom-" + Math.random().toString(36).substring(2, 9),
        description: desc.trim(), amount: numVal, scope: scopeVal,
        status: targetStatus, groupType: targetStatus === "PAGAR" ? targetGroup : "WAIT",
        paid: false, month: selectedMonth,
        dueDay, paymentMethod: payMethodVal || undefined,
      });
    } else {
      for (let i = 0; i < count; i++) {
        const label = billingType === "installment"
          ? `${desc.trim()} (${String(i + 1).padStart(2, "0")}/${String(count).padStart(2, "0")})`
          : desc.trim();
        generated.push({
          id: "pb-custom-" + Math.random().toString(36).substring(2, 9),
          description: label, amount: numVal, scope: scopeVal,
          status: targetStatus, groupType: targetStatus === "PAGAR" ? targetGroup : "WAIT",
          paid: false, month: incrementMonth(selectedMonth, i),
          dueDay, paymentMethod: payMethodVal || undefined,
        });
      }
    }

    onUpdateBills([...generated, ...bills]);
    setDesc(""); setAmountVal(""); setBillingType("unique"); setDueDayVal(""); setPayMethodVal("");
  };

  // ── Group management ────────────────────────────────────────────────────────
  const handleRenameGroup = (id: string, name: string) =>
    savePriorityGroups(priorityGroups.map(g => g.id === id ? { ...g, name } : g));

  const handleChangeGroupColor = (id: string, color: string) =>
    savePriorityGroups(priorityGroups.map(g => g.id === id ? { ...g, color } : g));

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    savePriorityGroups([...priorityGroups, {
      id: "G_" + Math.random().toString(36).substring(2, 9),
      name: newGroupName.trim(), color: newGroupColor,
    }]);
    setNewGroupName("");
  };

  const handleDeletePriorityGroup = (groupId: string) => {
    if (priorityGroups.length <= 1) { alert("É necessário manter pelo menos um subgrupo de prioridade."); return; }
    const remaining = priorityGroups.filter(g => g.id !== groupId);
    const groupName = priorityGroups.find(g => g.id === groupId)?.name || groupId;
    if (!window.confirm(`Tem certeza que deseja excluir o subgrupo "${groupName}"? Todas as despesas nele serão movidas para "${remaining[0].name}".`)) return;
    onUpdateBills(bills.map(b => b.groupType === groupId ? { ...b, groupType: remaining[0].id } : b));
    savePriorityGroups(remaining);
    if (targetGroup === groupId) setTargetGroup(remaining[0].id);
  };

  // ── Category management ─────────────────────────────────────────────────────
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCustomCategory(catScope, catType, newCategoryName.trim());
    setNewCategoryName("");
  };

  // ── Bulk paste logic ────────────────────────────────────────────────────────
  const handleTextPasteChange = (text: string) => {
    setPastedText(text);
    if (!text.trim()) { setParsedPreviewBills([]); return; }

    const parsed: PriorityBill[] = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let parts: string[] = [];
      if (line.includes("\t")) parts = line.split("\t");
      else if (line.includes(";")) parts = line.split(";");
      else if (line.includes("|")) parts = line.split("|");
      else if (line.includes(",")) {
        parts = line.split(",");
        if (parts.length >= 3 && !isNaN(parseFloat(parts[1])) && parts[2].trim().length <= 2) {
          parts = [parts[0], `${parts[1]},${parts[2]}`, ...parts.slice(3)];
        }
      } else {
        parts = [line];
      }

      const trimmed = parts.map(p => p.trim()).filter(Boolean);
      if (!trimmed.length) continue;

      let description = "Despesa Lançada", amountNum = 0;
      let groupType: string = priorityGroups[0]?.id || "P1";
      let status: "PAGAR" | "ESPERAR" = "PAGAR";
      let scope = TransactionScope.PROFESSIONAL;

      if (parts.length >= 2) {
        description = trimmed[0] || "Despesa Lançada";
        let clean = (trimmed[1] || "0").replace(/R\$/gi, "").replace(/\s/g, "");
        if (clean.includes(".") && clean.includes(",")) clean = clean.replace(/\./g, "").replace(/,/g, ".");
        else if (clean.includes(",")) clean = clean.replace(/,/g, ".");
        const n = parseFloat(clean);
        if (!isNaN(n)) amountNum = n;

        const rawGroup = trimmed[2] || "";
        const matchedG = priorityGroups.find(g => g.id.toUpperCase() === rawGroup.toUpperCase() || g.name.toUpperCase().includes(rawGroup.toUpperCase()));
        if (matchedG) { groupType = matchedG.id; }
        else if (/WAIT|ESPERAR|AGUARDAR|RETID|RETER/i.test(rawGroup)) { groupType = "WAIT"; status = "ESPERAR"; }

        if (/PF|PESSOAL|PERSONAL/i.test(trimmed[3] || "")) scope = TransactionScope.PERSONAL;
      } else {
        const brlRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})|(?:R\$\s*)?(\d+,\d{2})/i;
        const decRegex = /(?:R\$\s*)?(\d+\.\d{2})/i;
        const plainRegex = /(?:R\$\s*)?(\d+)/i;
        const match = line.match(brlRegex) || line.match(decRegex) || line.match(plainRegex);
        if (match) {
          let clean = (match[1] || match[2] || match[0]).replace(/R\$/gi, "").replace(/\s/g, "");
          if (clean.includes(".") && clean.includes(",")) clean = clean.replace(/\./g, "").replace(/,/g, ".");
          else if (clean.includes(",")) clean = clean.replace(/,/g, ".");
          const n = parseFloat(clean);
          if (!isNaN(n)) amountNum = n;
          description = line.replace(match[0], "").replace(/^[-\s,;:|]+|[-\s,;:|]+$/g, "").replace(/\s*R\$\s*/gi, "").trim() || "Despesa Lançada";
        } else {
          description = line.trim();
        }
        if (/WAIT|ESPERAR|AGUARDAR|POSTERG/i.test(line)) { groupType = "WAIT"; status = "ESPERAR"; }
        if (/PF|PESSOAL|PERSONAL|CASA|DOMEST/i.test(line)) scope = TransactionScope.PERSONAL;
      }

      parsed.push({ id: "pb-bulk-" + Math.random().toString(36).substring(2, 9), description, amount: amountNum, scope, status, groupType, paid: false });
    }
    setParsedPreviewBills(parsed);
  };

  const handleUpdatePreviewBillField = (id: string, key: keyof PriorityBill, value: any) => {
    setParsedPreviewBills(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [key]: value };
      if (key === "groupType") updated.status = value === "WAIT" ? "ESPERAR" : "PAGAR";
      return updated;
    }));
  };

  const handleImportPreviewBills = () => {
    if (!parsedPreviewBills.length) { setBulkImportError("Nenhum lançamento válido para importar."); return; }
    if (parsedPreviewBills.some(b => b.amount <= 0 || !b.description.trim())) {
      setBulkImportError("Verifique se todas as descrições estão preenchidas e os valores são maiores que R$ 0,00."); return;
    }
    onUpdateBills([...parsedPreviewBills.map(b => ({ ...b, month: selectedMonth })), ...bills]);
    setIsBulkPasteOpen(false); setPastedText(""); setParsedPreviewBills([]); setBulkImportError("");
  };

  const handleAiParse = async () => {
    if (!pastedText.trim()) return;
    setIsAiLoading(true); setAiError(""); setBulkImportError("");
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: pastedText, customDate: new Date().toISOString().split("T")[0] }),
      });
      if (!res.ok) throw new Error("Erro de processamento no servidor.");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Formato de dados retornado inválido.");

      const parsed: PriorityBill[] = data.map((item: any): PriorityBill => {
        const upperGroup = String(item.groupType || "").toUpperCase();
        let groupType = priorityGroups[0]?.id || "P1";
        if (/WAIT|ESPERAR|AGUARDAR/.test(upperGroup)) groupType = "WAIT";
        else {
          const matched = priorityGroups.find(g => g.id.toUpperCase() === upperGroup || upperGroup.includes(g.id.toUpperCase()));
          if (matched) groupType = matched.id;
        }
        return {
          id: "pb-bulk-ai-" + Math.random().toString(36).substring(2, 9),
          description: item.description,
          amount: parseFloat(String(item.amount || 0)),
          scope: item.scope === "PERSONAL" ? TransactionScope.PERSONAL : TransactionScope.PROFESSIONAL,
          status: groupType === "WAIT" ? "ESPERAR" : "PAGAR",
          groupType, paid: false, category: item.category,
          notes: `Classificado via IA. Confiança: ${item.confidence}%. Raciocínio: ${item.reason}`,
        };
      }).filter((item) => item.amount > 0);

      if (!parsed.length) setAiError("Não conseguimos extrair nenhuma despesa com valor válido.");
      else setParsedPreviewBills(parsed);
    } catch (err: any) {
      setAiError(err.message || "Erro de conexão com a IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const navMonth = (direction: 1 | -1) => {
    if (!onSetSelectedMonth) return;
    const [y, m] = selectedMonth.split("-").map(Number);
    const newM = m + direction;
    const newDate = new Date(y, newM - 1, 1);
    onSetSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
  };

  // ── Bill row renders ────────────────────────────────────────────────────────
  const renderCategorySelect = (b: PriorityBill, cls = "") => (
    <select value={b.category || ""} onChange={e => handleUpdateBillField(b.id, "category", e.target.value)}
      className={`inline-block text-[9px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/60 border border-indigo-150 rounded cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500 py-0.5 px-1 ${cls}`}>
      <option value="">📁 Sem Categoria</option>
      {(ALL_CATEGORIES_MAP[`${b.scope}_${TransactionType.EXPENSE}`] || []).map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );

  return (
    <div id="expense-prioritizer" className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border-l-4 border-[#8b5cf6] p-4 text-white rounded-r-lg shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded mt-0.5 border border-[#8b5cf6]/30">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-bold font-display text-white">Priorizador de Despesas de Caixa ({selectedMonth.split("-").reverse().join("/")})</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
              Organize suas saídas de <b>{selectedMonth.split("-").reverse().join("/")}</b> de forma estratégica entre <b>PAGAR</b> ou <b>ESPERAR</b>.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 transition font-bold text-[10px] uppercase tracking-wider rounded border border-slate-700 text-slate-300 cursor-pointer">
              <Settings className="w-3.5 h-3.5" /> Personalizar
            </button>
            <button onClick={onResetBills}
              className="flex items-center gap-1 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 transition font-bold text-[10px] uppercase tracking-wider rounded border border-slate-700 text-slate-300 cursor-pointer">
              Resetar
            </button>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      {onSetSelectedMonth && (
        <div className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-sans">Competência de Caixa:</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navMonth(-1)} className="p-1 px-2.5 hover:bg-slate-200 text-slate-600 hover:text-violet-600 rounded-md transition-colors border border-slate-200 bg-white cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="bg-white px-5 py-1.5 rounded-lg border border-slate-200 text-center min-w-[145px]">
              <span className="text-xs font-extrabold text-slate-800 tracking-wide font-sans">{readableMonth}</span>
            </div>
            <button onClick={() => navMonth(1)} className="p-1 px-2.5 hover:bg-slate-200 text-slate-600 hover:text-violet-600 rounded-md transition-colors border border-slate-200 bg-white cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-widest font-mono">PAGAR (Priorizado)</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono font-bold rounded">{countPagar} pendentes</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#1e293b]">{formatCurrency(totalPagar)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Dividido em 3 prioridades essenciais</span>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">ESPERAR (Aguardar)</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono font-bold rounded">{countEsperar} retidos</span>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700">{formatCurrency(totalEsperar)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Segurando saída até recomposição de caixa</span>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest font-mono">PAGO / CONCILIADO</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded">{countPaid} liquidados</span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700">{formatCurrency(totalPaid)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Conciliados e baixados no Livro Caixa</span>
          </div>
        </div>
      </div>

      {/* Filter + Add form */}
      <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Filtrar por Escopo</label>
          <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded">
            {(["ALL", "PROFESSIONAL", "PERSONAL"] as const).map((s, i) => (
              <button key={s} onClick={() => setFilterScope(s)}
                className={`flex-1 text-center py-1 text-[11px] font-bold uppercase rounded ${filterScope === s ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>
                {["Todos", "PJ", "PF"][i]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddBill} className="lg:col-span-9 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Inserir Conta Extra</label>
              <input type="text" placeholder="Ex: Assinatura OAB de julho" value={desc} onChange={e => setDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Valor (R$)</label>
              <input type="text" placeholder="0,00" value={amountVal} onChange={e => setAmountVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Escopo</label>
              <select value={scopeVal} onChange={e => setScopeVal(e.target.value as TransactionScope)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6]">
                <option value={TransactionScope.PROFESSIONAL}>Escopo PJ</option>
                <option value={TransactionScope.PERSONAL}>Escopo PF</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Tipo</label>
              <select value={billingType} onChange={e => setBillingType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6]">
                <option value="unique">Único</option>
                <option value="fixed">Fixo (Mensal)</option>
                <option value="installment">Parcelado</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              {billingType !== "unique" ? (
                <>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                    {billingType === "fixed" ? "Meses (Repetir)" : "Nº Parcelas"}
                  </label>
                  <input type="number" min="1" max="120" value={billingCount} onChange={e => setBillingCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]" />
                </>
              ) : (
                <>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Prioridade</label>
                  <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6]">
                    {priorityGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Extra fields: due day + payment method */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Dia Vencimento</label>
              <input type="number" min="1" max="31" placeholder="Ex: 10" value={dueDayVal} onChange={e => setDueDayVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Método de Pagamento</label>
              <select value={payMethodVal} onChange={e => setPayMethodVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6]">
                <option value="">— Selecionar —</option>
                <option value="Pix">Pix</option>
                <option value="Boleto">Boleto</option>
                <option value="Débito Automático">Débito Automático</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Transferência">Transferência</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1.5">
            <span className="text-[10px] text-slate-400 font-semibold italic">
              {billingType === "fixed" && `💡 Irá cadastrar R$ ${amountVal || "0,00"} nos próximos ${billingCount} meses.`}
              {billingType === "installment" && `💡 Irá cadastrar ${billingCount} parcelas de R$ ${amountVal || "0,00"} nos próximos meses.`}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button type="submit"
                className="flex-grow sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-xs px-5 py-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer h-[36px] shadow-xs">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
              <button type="button" onClick={() => { setPastedText(""); setParsedPreviewBills([]); setBulkImportError(""); setIsBulkPasteOpen(true); }}
                className="px-4 border border-indigo-200 hover:border-indigo-300 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 font-bold uppercase tracking-wider text-xs py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer h-[36px]">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Colar Lote
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* PAGAR column */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#e2e8f0] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-widest font-mono">Seção Principal</span>
                <h3 className="text-sm font-bold text-[#1e293b]">Despesas a Pagar (Priorizadas)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Subtotal: {formatCurrency(totalPagar)}</span>
                <span className="text-[10px] text-slate-400">({countPagar} pendentes)</span>
              </div>
            </div>
            <div className="p-4 space-y-5">
              {priorityGroups.map(group => {
                const { sum, count, items } = getSubgroupTotals(group.id);
                return (
                  <div key={group.id} className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/20">
                    <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 ${group.color || "bg-slate-400"} rounded-full`}></span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{group.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">{formatCurrency(sum)} ({count} itens)</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <div className="p-3 text-center text-[11px] text-slate-400">Sem itens cadastrados nesta seção.</div>
                      ) : items.map(b => (
                        <div key={b.id}>
                          {/* Desktop row */}
                          <div className="hidden md:flex p-3 bg-white items-center justify-between gap-4 text-xs group hover:bg-indigo-50/20 hover:shadow-xs transition-all border-b border-slate-100 last:border-b-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-1 px-1.5 ${b.scope === TransactionScope.PROFESSIONAL ? "bg-blue-50 text-[#2563eb] border-blue-200" : "bg-violet-50 text-[#8b5cf6] border-violet-200"} rounded font-mono text-[9px] font-bold shrink-0 border`}>
                                {b.scope === TransactionScope.PROFESSIONAL ? "PJ" : "PF"}
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-slate-800 block truncate" title={b.description}>{b.description}</span>
                                {b.notes && <p className="text-[10px] text-slate-400 mt-0.5">{b.notes}</p>}
                                <div className="mt-1">{renderCategorySelect(b, "max-w-[170px] truncate")}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono font-bold text-slate-800">{formatCurrency(b.amount)}</span>
                              <button onClick={() => handleToggleStatus(b.id)} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded transition cursor-pointer" title="Segurar para Esperar">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <select value={b.groupType} onChange={e => handleChangeGroup(b.id, e.target.value)}
                                className="bg-transparent text-[10px] text-slate-500 font-bold focus:outline-hidden cursor-pointer">
                                {priorityGroups.map(g => <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>)}
                              </select>
                              {confirmingBillId === b.id ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-slate-600 font-bold">Confirmar?</span>
                                  <button onClick={() => handlePayAndRegister(b)} className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded cursor-pointer">Sim</button>
                                  <button onClick={() => setConfirmingBillId(null)} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded cursor-pointer">Não</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmingBillId(b.id)} className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition rounded text-[10px] font-bold uppercase shrink-0 cursor-pointer">
                                  Pagar & Lançar
                                </button>
                              )}
                              <button onClick={() => handleDeleteBill(b.id)} className="p-1 text-slate-300 hover:text-red-500 rounded transition cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Mobile card */}
                          <div className="flex md:hidden p-4 bg-white flex-col gap-3.5 text-xs border-b border-slate-100 last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`p-1 px-1.5 ${b.scope === TransactionScope.PROFESSIONAL ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-violet-50 text-[#8b5cf6] border-violet-200"} rounded font-mono text-[9px] font-bold border`}>
                                  {b.scope === TransactionScope.PROFESSIONAL ? "Escritório PJ" : "Pessoal PF"}
                                </span>
                                <select value={b.groupType} onChange={e => handleChangeGroup(b.id, e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 font-bold px-1.5 py-0.5 focus:outline-hidden cursor-pointer">
                                  {priorityGroups.map(g => <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>)}
                                </select>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleToggleStatus(b.id)} className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded transition border border-amber-200 cursor-pointer flex items-center gap-1 text-[9px] font-bold">
                                  <span>Segurar</span><ArrowRight className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteBill(b.id)} className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-100 transition cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-800 text-xs leading-snug">{b.description}</h4>
                              {b.notes && <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">{b.notes}</p>}
                              <div className="mt-1">{renderCategorySelect(b, "max-w-full")}</div>
                            </div>
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                              <span className="font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(b.amount)}</span>
                              {confirmingBillId === b.id ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-700 font-bold">Confirmar lançamento?</span>
                                  <button onClick={() => handlePayAndRegister(b)} className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded cursor-pointer">Sim</button>
                                  <button onClick={() => setConfirmingBillId(null)} className="px-2.5 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer">Cancelar</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmingBillId(b.id)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition rounded-md text-[10px] font-extrabold uppercase cursor-pointer">
                                  Pagar & Lançar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ESPERAR column */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#e2e8f0] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">Aguardar Caixa</span>
                <h3 className="text-sm font-bold text-[#1e293b]">Postergados (Esperar)</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {formatCurrency(totalEsperar)}
              </span>
            </div>
            <div className="p-4 divide-y divide-slate-100">
              {esperarList.filter(b => !b.paid).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Não há contas em espera de caixa!</div>
              ) : esperarList.filter(b => !b.paid).map(b => (
                <div key={b.id}>
                  {/* Desktop wait row */}
                  <div className="hidden md:flex py-3 flex-col gap-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <button onClick={() => handleToggleStatus(b.id)} className="p-1 text-slate-400 hover:text-[#2563eb] hover:bg-blue-50 rounded transition cursor-pointer" title="Mover para Prioritários">
                          <ArrowLeft className="w-4 h-4 text-[#2563eb]" />
                        </button>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 block">{b.description}</p>
                          {b.notes && <p className="text-[10px] text-slate-400">{b.notes}</p>}
                          <div className="mt-1">{renderCategorySelect(b, "max-w-[170px] truncate")}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-800 shrink-0">{formatCurrency(b.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] bg-slate-50 p-1 px-2 rounded">
                      <span className="text-slate-400 font-mono">{b.scope === TransactionScope.PROFESSIONAL ? "Escritório PJ" : "Pessoal PF"}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handlePayAndRegister(b)} className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition rounded font-bold uppercase text-[9px] cursor-pointer">
                          Liberar & Pagar
                        </button>
                        <button onClick={() => handleDeleteBill(b.id)} className="text-slate-300 hover:text-red-500 rounded transition cursor-pointer">
                          <Trash2 className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile wait card */}
                  <div className="flex md:hidden p-3.5 bg-white border border-slate-100 rounded-xl flex-col gap-3.5 text-xs my-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleToggleStatus(b.id)} className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition border border-indigo-200 cursor-pointer flex items-center gap-1 text-[9px] font-bold">
                        <ArrowLeft className="w-3 h-3" /><span>Priorizar</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 px-1.5 ${b.scope === TransactionScope.PROFESSIONAL ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-violet-50 text-[#8b5cf6] border-violet-200"} rounded font-mono text-[9px] font-bold border`}>
                          {b.scope === TransactionScope.PROFESSIONAL ? "Escritório PJ" : "Pessoal PF"}
                        </span>
                        <button onClick={() => handleDeleteBill(b.id)} className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-100 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs leading-snug">{b.description}</h4>
                      {b.notes && <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100">{b.notes}</p>}
                      <div className="mt-1">{renderCategorySelect(b, "max-w-full")}</div>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <span className="font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(b.amount)}</span>
                      <button onClick={() => handlePayAndRegister(b)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition rounded-md text-[10px] font-extrabold uppercase cursor-pointer">
                        Liberar & Pagar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isBulkPasteOpen && (
        <BulkImportModal
          priorityGroups={priorityGroups}
          parsedPreviewBills={parsedPreviewBills}
          pastedText={pastedText}
          isAiLoading={isAiLoading}
          aiError={aiError}
          bulkImportError={bulkImportError}
          formatCurrency={formatCurrency}
          onClose={() => setIsBulkPasteOpen(false)}
          onPasteChange={handleTextPasteChange}
          onUpdateField={handleUpdatePreviewBillField}
          onRemoveItem={id => setParsedPreviewBills(prev => prev.filter(i => i.id !== id))}
          onImport={handleImportPreviewBills}
          onAiParse={handleAiParse}
          onClearPreview={() => setParsedPreviewBills([])}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          priorityGroups={priorityGroups}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          catScope={catScope} setCatScope={setCatScope}
          catType={catType} setCatType={setCatType}
          newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName}
          newGroupName={newGroupName} setNewGroupName={setNewGroupName}
          newGroupColor={newGroupColor} setNewGroupColor={setNewGroupColor}
          onRenameGroup={handleRenameGroup}
          onChangeGroupColor={handleChangeGroupColor}
          onAddGroup={handleAddGroup}
          onDeleteGroup={handleDeletePriorityGroup}
          onAddCategory={handleAddCategorySubmit}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
