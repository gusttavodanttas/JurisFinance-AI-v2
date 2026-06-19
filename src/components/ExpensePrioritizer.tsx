import React, { useState, useEffect } from "react";
import { 
  PriorityBill, 
  TransactionScope, 
  TransactionType, 
  addCustomCategory, 
  deleteCustomCategory, 
  ALL_CATEGORIES_MAP,
  PROFESSIONAL_REVENUE_CATEGORIES,
  PROFESSIONAL_EXPENSE_CATEGORIES,
  PERSONAL_REVENUE_CATEGORIES,
  PERSONAL_EXPENSE_CATEGORIES
} from "../types";
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Plus, 
  Trash2, 
  HelpCircle, 
  Building2, 
  User, 
  RotateCcw, 
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Send,
  Check,
  BookOpen,
  Settings,
  Terminal,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Wifi,
  Activity,
  X,
  Sparkles
} from "lucide-react";

// Increment month string e.g. "2026-06" by X months
const incrementMonth = (startMonthStr: string, increment: number): string => {
  const [yearStr, monthStr] = startMonthStr.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed
  const date = new Date(year, month + increment, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
};

interface ExpensePrioritizerProps {
  bills: PriorityBill[];
  onUpdateBills: (updated: PriorityBill[]) => void;
  onResetBills: () => void;
  onAddTransactionToLedger: (item: {
    description: string;
    amount: number;
    scope: TransactionScope;
    category: string;
    date: string;
  }) => void;
  selectedMonth: string;
  onSetSelectedMonth?: (month: string) => void;
}

export default function ExpensePrioritizer({
  bills,
  onUpdateBills,
  onResetBills,
  onAddTransactionToLedger,
  selectedMonth,
  onSetSelectedMonth
}: ExpensePrioritizerProps) {
  // Local form state
  const [desc, setDesc] = useState("");
  const [amountVal, setAmountVal] = useState("");
  const [scopeVal, setScopeVal] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);
  const [targetStatus, setTargetStatus] = useState<"PAGAR" | "ESPERAR">("PAGAR");
  const [targetGroup, setTargetGroup] = useState<string>("G1");
  const [filterScope, setFilterScope] = useState<"ALL" | "PROFESSIONAL" | "PERSONAL">("ALL");

  // Recurring & installments options
  const [billingType, setBillingType] = useState<"unique" | "fixed" | "installment">("unique");
  const [billingCount, setBillingCount] = useState<string>("12");

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const gdEmail = sessionStorage.getItem("gd_auth_email") || "default";
  
  // Custom groups state
  const [priorityGroups, setPriorityGroups] = useState<Array<{ id: string; name: string; color: string }>>(() => {
    const saved = localStorage.getItem(`priority_groups_${gdEmail}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "G1", name: "Subgrupo 1 • Custos Urgentes", color: "bg-red-500" },
      { id: "G2", name: "Subgrupo 2 • Acordos e Lazer", color: "bg-orange-500" },
      { id: "G3", name: "Subgrupo 3 • Assinaturas e Planos", color: "bg-[#8b5cf6]" }
    ];
  });

  // Custom Categories list states (to display in customization UI)
  const [categoriesUpdatedTrigger, setCategoriesUpdatedTrigger] = useState(0);
  useEffect(() => {
    const handler = () => setCategoriesUpdatedTrigger(prev => prev + 1);
    window.addEventListener("categories_updated", handler);
    return () => window.removeEventListener("categories_updated", handler);
  }, []);

  // Settings Tab and forms states
  const [settingsTab, setSettingsTab] = useState<"groups" | "categories">("groups");
  const [catScope, setCatScope] = useState<TransactionScope>(TransactionScope.PROFESSIONAL);
  const [catType, setCatType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("bg-blue-500");

  const updatePriorityGroups = (updated: Array<{ id: string; name: string; color: string }>) => {
    setPriorityGroups(updated);
    localStorage.setItem(`priority_groups_${gdEmail}`, JSON.stringify(updated));
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    const updated = priorityGroups.map(g => g.id === groupId ? { ...g, name: newName } : g);
    updatePriorityGroups(updated);
  };

  const handleChangeGroupColor = (groupId: string, newColor: string) => {
    const updated = priorityGroups.map(g => g.id === groupId ? { ...g, color: newColor } : g);
    updatePriorityGroups(updated);
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newId = "G_" + Math.random().toString(36).substring(2, 9);
    const newGroup = {
      id: newId,
      name: newGroupName.trim(),
      color: newGroupColor
    };
    updatePriorityGroups([...priorityGroups, newGroup]);
    setNewGroupName("");
  };

  const handleDeletePriorityGroup = (groupId: string) => {
    if (priorityGroups.length <= 1) {
      alert("É necessário manter pelo menos um subgrupo de prioridade.");
      return;
    }
    const remainingGroups = priorityGroups.filter(g => g.id !== groupId);
    const firstGroupId = remainingGroups[0].id;
    
    // Confirm deletion and migration
    const groupToDelete = priorityGroups.find(g => g.id === groupId);
    const groupName = groupToDelete ? groupToDelete.name : groupId;
    
    if (window.confirm(`Tem certeza que deseja excluir o subgrupo "${groupName}"? Todas as despesas cadastradas nele serão movidas para o subgrupo "${remainingGroups[0].name}".`)) {
      // Update bills
      const updatedBills = bills.map(b => {
        if (b.groupType === groupId) {
          return { ...b, groupType: firstGroupId };
        }
        return b;
      });
      onUpdateBills(updatedBills);
      
      // Update groups
      updatePriorityGroups(remainingGroups);
      
      // If the currently selected form group was the deleted one, reset it
      if (targetGroup === groupId) {
        setTargetGroup(firstGroupId);
      }
    }
  };

  const isDefaultCategory = (scope: TransactionScope, type: TransactionType, categoryName: string): boolean => {
    if (scope === TransactionScope.PROFESSIONAL) {
      return type === TransactionType.REVENUE 
        ? PROFESSIONAL_REVENUE_CATEGORIES.includes(categoryName)
        : PROFESSIONAL_EXPENSE_CATEGORIES.includes(categoryName);
    } else {
      return type === TransactionType.REVENUE 
        ? PERSONAL_REVENUE_CATEGORIES.includes(categoryName)
        : PERSONAL_EXPENSE_CATEGORIES.includes(categoryName);
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCustomCategory(catScope, catType, newCategoryName.trim());
    setNewCategoryName("");
  };

  // Bulk paste states for priority bills
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [parsedPreviewBills, setParsedPreviewBills] = useState<PriorityBill[]>([]);
  const [bulkImportError, setBulkImportError] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleTextPasteChange = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setParsedPreviewBills([]);
      return;
    }

    const lines = text.split(/\r?\n/);
    const parsed: PriorityBill[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(";")) {
        parts = line.split(";");
      } else if (line.includes("|")) {
        parts = line.split("|");
      } else if (line.includes(",")) {
        parts = line.split(",");
        if (parts.length >= 3 && !isNaN(parseFloat(parts[1].trim())) && !isNaN(parseFloat(parts[2].trim())) && parts[2].trim().length <= 2) {
          parts = [parts[0], `${parts[1]},${parts[2]}`, ...parts.slice(3)];
        }
      } else {
        parts = [line];
      }

      const trimmedParts = parts.map(p => p.trim()).filter(Boolean);
      if (trimmedParts.length === 0) continue;

      let description = "Despesa Lançada";
      let amountNum = 0;
      let groupType: string = priorityGroups[0]?.id || "G1";
      let status: "PAGAR" | "ESPERAR" = "PAGAR";
      let scopeSelected = TransactionScope.PROFESSIONAL;

      if (parts.length >= 2) {
        // Delimited format: [description, amount, group, scope]
        description = trimmedParts[0] || "Despesa Lançada";
        const rawAmount = trimmedParts[1] || "0";
        if (rawAmount) {
          let cleanAmount = rawAmount.replace(/R\$/gi, "").replace(/\s/g, "");
          if (cleanAmount.includes(".") && cleanAmount.includes(",")) {
            cleanAmount = cleanAmount.replace(/\./g, "").replace(/,/g, ".");
          } else if (cleanAmount.includes(",")) {
            cleanAmount = cleanAmount.replace(/,/g, ".");
          }
          const parsedAmount = parseFloat(cleanAmount);
          if (!isNaN(parsedAmount)) {
            amountNum = parsedAmount;
          }
        }

        const rawGroup = trimmedParts[2] || "";
        const matchedGroup = priorityGroups.find(g => g.id.toUpperCase() === rawGroup.toUpperCase() || g.name.toUpperCase().includes(rawGroup.toUpperCase()));
        if (matchedGroup) {
          groupType = matchedGroup.id;
          status = "PAGAR";
        } else if (rawGroup.toUpperCase() === "G2" && priorityGroups[1]) {
          groupType = priorityGroups[1].id;
          status = "PAGAR";
        } else if (rawGroup.toUpperCase() === "G3" && priorityGroups[2]) {
          groupType = priorityGroups[2].id;
          status = "PAGAR";
        } else if (rawGroup.toUpperCase() === "WAIT" || rawGroup.toUpperCase().includes("ESPERAR") || rawGroup.toUpperCase().includes("AGUARDAR") || rawGroup.toUpperCase().includes("RETID") || rawGroup.toUpperCase().includes("RETER")) {
          groupType = "WAIT";
          status = "ESPERAR";
        } else {
          groupType = priorityGroups[0]?.id || "G1";
          status = "PAGAR";
        }

        const rawScope = trimmedParts[3] || "PJ";
        if (rawScope.toUpperCase() === "PF" || rawScope.toUpperCase().includes("PESSOAL") || rawScope.toUpperCase() === "PERSONAL") {
          scopeSelected = TransactionScope.PERSONAL;
        }
      } else {
        // Plain text format: e.g. "Aluguel da sala R$ 1.500,00" or "Energia Light 350.00"
        // Try to match BRL currency format first: R$ X.XXX,XX or XXX,XX
        const brlRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})|(?:R\$\s*)?(\d+,\d{2})/i;
        let match = line.match(brlRegex);
        
        // If not found, try decimal/dot format: e.g. 1500.00 or 150.00
        if (!match) {
          const decimalRegex = /(?:R\$\s*)?(\d+\.\d{2})/i;
          match = line.match(decimalRegex);
        }

        // If not found, try simple numbers (e.g. 1500 or 150)
        if (!match) {
          const plainRegex = /(?:R\$\s*)?(\d+)/i;
          match = line.match(plainRegex);
        }

        if (match) {
          const matchedText = match[0];
          const rawAmount = match[1] || match[2] || matchedText;
          let cleanAmount = rawAmount.replace(/R\$/gi, "").replace(/\s/g, "");
          if (cleanAmount.includes(".") && cleanAmount.includes(",")) {
            cleanAmount = cleanAmount.replace(/\./g, "").replace(/,/g, ".");
          } else if (cleanAmount.includes(",")) {
            cleanAmount = cleanAmount.replace(/,/g, ".");
          }
          const parsedAmount = parseFloat(cleanAmount);
          if (!isNaN(parsedAmount)) {
            amountNum = parsedAmount;
          }

          // Clean description by removing the matched amount and clean formatting symbols
          let cleanDesc = line.replace(matchedText, "").trim();
          cleanDesc = cleanDesc
            .replace(/^[-\s,;:|]+|[-\s,;:|]+$/g, "") // remove leading/trailing delimiters
            .replace(/\s*R\$\s*/gi, "") // remove stray R$ symbols
            .trim();
          
          description = cleanDesc || "Despesa Lançada";
        } else {
          description = line.trim();
          amountNum = 0;
        }

        // Auto-detect group and scope based on keywords in description
        const upperLine = line.toUpperCase();
        let matched = false;
        for (const g of priorityGroups) {
          const mainPart = g.name.split("•")[1]?.trim() || g.name;
          if (upperLine.includes(g.id.toUpperCase()) || upperLine.includes(mainPart.toUpperCase())) {
            groupType = g.id;
            status = "PAGAR";
            matched = true;
            break;
          }
        }
        if (!matched) {
          if (upperLine.includes("WAIT") || upperLine.includes("ESPERAR") || upperLine.includes("AGUARDAR") || upperLine.includes("RETID") || upperLine.includes("POSTERG")) {
            groupType = "WAIT";
            status = "ESPERAR";
          } else {
            groupType = priorityGroups[0]?.id || "G1";
            status = "PAGAR";
          }
        }

        if (upperLine.includes("PF") || upperLine.includes("PESSOAL") || upperLine.includes("PERSONAL") || upperLine.includes("CASA") || upperLine.includes("DOMEST")) {
          scopeSelected = TransactionScope.PERSONAL;
        }
      }

      parsed.push({
        id: "pb-bulk-" + Math.random().toString(36).substring(2, 9),
        description,
        amount: amountNum,
        scope: scopeSelected,
        status,
        groupType,
        paid: false
      });
    }

    setParsedPreviewBills(parsed);
  };

  const handleUpdatePreviewBillField = (id: string, key: keyof PriorityBill, value: any) => {
    setParsedPreviewBills(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [key]: value };
        if (key === "groupType") {
          updated.status = value === "WAIT" ? "ESPERAR" : "PAGAR";
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemovePreviewBill = (id: string) => {
    setParsedPreviewBills(prev => prev.filter(item => item.id !== id));
  };

  const handleImportPreviewBills = () => {
    if (parsedPreviewBills.length === 0) {
      setBulkImportError("Nenhum lançamento válido para importar.");
      return;
    }

    const invalidItem = parsedPreviewBills.find(b => b.amount <= 0 || !b.description.trim());
    if (invalidItem) {
      setBulkImportError("Por favor, verifique se todas as descrições estão preenchidas e os valores são maiores que R$ 0,00.");
      return;
    }

    const importedWithMonth = parsedPreviewBills.map(b => ({
      ...b,
      month: selectedMonth
    }));

    onUpdateBills([...importedWithMonth, ...bills]);
    setIsBulkPasteOpen(false);
    setPastedText("");
    setParsedPreviewBills([]);
    setBulkImportError("");
  };

  const handleAiParse = async () => {
    if (!pastedText.trim()) return;
    setIsAiLoading(true);
    setAiError("");
    setBulkImportError("");
    try {
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawText: pastedText,
          customDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de processamento no servidor backend.");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de dados retornado inválido.");
      }

      const parsed: PriorityBill[] = data.map((item: any) => {
        let groupType: string = priorityGroups[0]?.id || "G1";
        const upperGroup = String(item.groupType || "").toUpperCase();
        if (upperGroup === "G2" || upperGroup.includes("G2")) {
          groupType = priorityGroups[1]?.id || "G2";
        } else if (upperGroup === "G3" || upperGroup.includes("G3")) {
          groupType = priorityGroups[2]?.id || "G3";
        } else if (upperGroup === "WAIT" || upperGroup.includes("WAIT") || upperGroup.includes("ESPERAR") || upperGroup.includes("AGUARDAR")) {
          groupType = "WAIT";
        } else {
          const matchedG = priorityGroups.find(g => g.id.toUpperCase() === upperGroup);
          if (matchedG) {
            groupType = matchedG.id;
          }
        }

        return {
          id: "pb-bulk-ai-" + Math.random().toString(36).substring(2, 9),
          description: item.description,
          amount: parseFloat(String(item.amount || 0)),
          scope: item.scope === "PERSONAL" ? TransactionScope.PERSONAL : TransactionScope.PROFESSIONAL,
          status: groupType === "WAIT" ? "ESPERAR" : "PAGAR",
          groupType: groupType,
          paid: false,
          category: item.category,
          notes: `Classificado via IA. Confiança: ${item.confidence}%. Raciocínio: ${item.reason}`
        };
      });

      const validParsed = parsed.filter(item => item.amount > 0);
      if (validParsed.length === 0) {
        setAiError("Não conseguimos extrair nenhuma despesa com valor válido.");
      } else {
        setParsedPreviewBills(validParsed);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Erro de conexão com a IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // WhatsApp Integration Tool states
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "👋 Olá! Sou o robô de controladoria financeira do seu escritório.\n\nEnvie o número correspondente à função desejada para consultar dados do caixa em tempo real:\n\n*1*️⃣ Listar Contas a Pagar\n*2*️⃣ Dashboard de Saldo Previsto\n*3*️⃣ Visualizar Contas sob Espera\n*4*️⃣ Como Integrar com WhatsApp Real",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  // Outbound Configuration states (stored locally to persist setups)
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem("ws_phone") || "+55 (11) 99999-9999");
  const [integrationType, setIntegrationType] = useState<"twilio" | "webhook">(() => (localStorage.getItem("ws_type") as "twilio" | "webhook") || "webhook");
  const [twilioSid, setTwilioSid] = useState(() => localStorage.getItem("ws_twilio_sid") || "");
  const [twilioToken, setTwilioToken] = useState(() => localStorage.getItem("ws_twilio_token") || "");
  const [twilioFrom, setTwilioFrom] = useState(() => localStorage.getItem("ws_twilio_from") || "whatsapp:+14155238886");
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem("ws_webhook_url") || "https://api.exemplo.com/whatsapp-webhook");
  const [webhookToken, setWebhookToken] = useState(() => localStorage.getItem("ws_webhook_token") || "");
  
  // Test alerts states
  const [isTesting, setIsTesting] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveStatusMsg, setSaveStatusMsg] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ws_phone", phoneNumber);
    localStorage.setItem("ws_type", integrationType);
    localStorage.setItem("ws_twilio_sid", twilioSid);
    localStorage.setItem("ws_twilio_token", twilioToken);
    localStorage.setItem("ws_twilio_from", twilioFrom);
    localStorage.setItem("ws_webhook_url", webhookUrl);
    localStorage.setItem("ws_webhook_token", webhookToken);
    
    setSaveStatusMsg("Configurações salvas com sucesso!");
    setTimeout(() => {
      setSaveStatusMsg("");
    }, 4000);
  };

  const handleTestApiAlert = async () => {
    setIsTesting(true);
    setApiStatus("idle");
    setApiLogs(["Iniciando disparador de alertas de vencimento...", "Montando payload de teste com as contas ativas..."]);

    const activePagar = bills.filter(b => b.status === "PAGAR" && !b.paid);
    const totalP = activePagar.reduce((acc, curr) => acc + curr.amount, 0);
    
    let alertMsg = `⚠️ *ALERTA DE VENCIMENTO - JURISFINANCE AI*\n`;
    alertMsg += `Olá! Este é um alerta automatizado de rotina sobre despesas que exigem atenção.\n\n`;
    alertMsg += `💸 *Contas Pendentes com Vencimento Próximo:*\n`;
    if (activePagar.length === 0) {
      alertMsg += `- Não encontramos nenhuma conta pendente no fluxo deste período.\n`;
    } else {
      activePagar.forEach((b, i) => {
        alertMsg += `- *${b.description}*: ${formatCurrency(b.amount)} (Essencial)\n`;
      });
    }
    alertMsg += `\nTotal Consolidado Pendente: *${formatCurrency(totalP)}*\n\n`;
    alertMsg += `Por favor, acesse o painel web para efetuar a liberação de caixa e evitar juros.`;

    try {
      setApiLogs(prev => [...prev, "Fazendo chamada POST para o endpoint do servidor local `/api/send-whatsapp-alert`..."]);
      const res = await fetch("/api/send-whatsapp-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: phoneNumber,
          type: integrationType,
          twilioSid,
          twilioToken,
          twilioFrom,
          webhookUrl,
          webhookToken,
          message: alertMsg
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setApiStatus("success");
        setApiLogs(prev => [...prev, ...data.logs, "✅ Processo de teste finalizado com SUCESSO!"]);
        
        // Add message to chatbot so user feels it reacts in real time
        setChatMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `🔔 *ALERTA DE TESTE ENVIADO COM SUCESSO!*\n\nDisparado com sucesso via API para o número *${phoneNumber}* utilizando canal *${integrationType.toUpperCase()}*.\n\n_Mensagem enviada:_ \n${alertMsg}`,
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        setApiStatus("error");
        setApiLogs(prev => [
          ...prev, 
          ...(data.logs || []), 
          `❌ Processo de teste finalizado com FALHA! (Status: ${res.status})`
        ]);
      }
    } catch (err: any) {
      setApiStatus("error");
      setApiLogs(prev => [...prev, `❌ Erro de Conexão na requisição para o servidor: ${err.message}`]);
    } finally {
      setIsTesting(false);
    }
  };

  const generateWhatsAppMessage = () => {
    const activePagar = bills.filter(b => b.status === "PAGAR" && !b.paid);
    const totalP = activePagar.reduce((acc, curr) => acc + curr.amount, 0);
    const activeWait = bills.filter(b => b.status === "ESPERAR" && !b.paid);
    const totalW = activeWait.reduce((acc, curr) => acc + curr.amount, 0);

    let msg = `*JurisFinance AI - Controle de Despesas e Caixa*\n`;
    msg += `------------------------------------\n`;
    msg += `*📆 Competência Fiscal*\n`;
    msg += `💸 *Contas a Pagar Priorizadas (Total: ${formatCurrency(totalP)}):*\n\n`;
    
    if (activePagar.length === 0) {
      msg += `_Nenhuma conta pendente registrada!_\n`;
    } else {
      activePagar.forEach((b, i) => {
        msg += `${i+1}. *${b.description}* - ${formatCurrency(b.amount)} (${b.groupType === 'G1' ? 'G1 - Essencial' : b.groupType === 'G2' ? 'G2 - Importante' : 'G3 - Contornável'})\n`;
      });
    }

    msg += `\n📌 *Contas em Lista de Espera (Total: ${formatCurrency(totalW)}):*\n`;
    if (activeWait.length === 0) {
      msg += `_Nenhuma conta sob espera!_\n`;
    } else {
      activeWait.forEach((b) => {
        msg += `• ${b.description} - ${formatCurrency(b.amount)}\n`;
      });
    }

    msg += `\n_Atualizado automaticamente via consolidação de caixa JurisFinance AI_`;
    return msg;
  };

  const handleShareWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = () => {
    const msg = generateWhatsAppMessage();
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    
    const userMsg = {
      sender: "user" as const,
      text: cleanText,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      let botResponse = "";
      const cmd = cleanText.toLowerCase();

      if (cmd === "1" || cmd.includes("listar") || cmd.includes("pagar") || cmd.includes("contas")) {
        const activePagar = bills.filter(b => b.status === "PAGAR" && !b.paid);
        if (activePagar.length === 0) {
          botResponse = "✅ *JurisFinance AI Bot:* Não há contas pendentes para pagar no momento! Tudo liquidado.";
        } else {
          const totalP = activePagar.reduce((acc, curr) => acc + curr.amount, 0);
          botResponse = `📋 *JurisFinance AI Bot:* Você tem *${activePagar.length} despesas pendentes* autorizadas para pagamento, somando *${formatCurrency(totalP)}*:\n\n` +
            activePagar.map((b, i) => `${i+1}. *${b.description}*: ${formatCurrency(b.amount)} (${b.groupType === 'G1' ? 'G1 - Essencial' : b.groupType === 'G2' ? 'G2 - Importante' : 'G3 - Contornável'})`).join("\n") +
            `\n\n_Dica: Para liquidá-las, use o botão 'Liberar & Pagar' no painel principal web._`;
        }
      } else if (cmd === "2" || cmd.includes("saldo") || cmd.includes("caixa") || cmd.includes("previsto")) {
        const activePagar = bills.filter(b => b.status === "PAGAR" && !b.paid).reduce((acc, curr) => acc + curr.amount, 0);
        botResponse = `🏦 *JurisFinance AI Bot:* *Fluxo de Caixa Previsto*\n\n• Desbalanceamento Patrimonial Ativo: Mistura PF/PJ Monitorada\n• Saída Imediata (PAGAR): *${formatCurrency(activePagar)}*\n• Saldo Líquido Operacional do mês atualizado com base nas suas últimas conciliações.`;
      } else if (cmd === "3" || cmd.includes("esperar") || cmd.includes("retidos") || cmd.includes("aguardar")) {
        const realWait = bills.filter(b => b.status === "ESPERAR" && !b.paid);
        if (realWait.length === 0) {
          botResponse = "📌 *JurisFinance AI Bot:* Nenhuma despesa retida sob Espera no caixa técnico.";
        } else {
          const totalW = realWait.reduce((acc, curr) => acc + curr.amount, 0);
          botResponse = `📌 *JurisFinance AI Bot:* Você tem *${realWait.length} contas retidas na lista de espera* (${formatCurrency(totalW)}):\n\n` +
            realWait.map((b, i) => `• *${b.description}*: ${formatCurrency(b.amount)}`).join("\n");
        }
      } else if (cmd === "4" || cmd.includes("ajuda") || cmd.includes("link") || cmd.includes("como")) {
        botResponse = "ℹ️ *JurisFinance AI Bot:* Suporte Técnico Real:\n\nEste simulador emula respostas em tempo real simulando integração a banco estruturado (Drizzle/PostgreSQL) ou cache local.\n\nPara ligar com um número real:\n1. Use um conector de API do WhatsApp (ex: Z-API ou Evolution API).\n2. Configure um Webhook Node.js apontando para a API destas ferramentas.\n3. Leia as instruções completas no painel de tutorial na tela.";
      } else {
        botResponse = "❌ *Opção Inválida.*\n\nEnvie:\n*1*️⃣ para Listar Contas a Pagar\n*2*️⃣ para Ver Saldo Operacional\n*3*️⃣ para Ver Lista de Espera\n*4*️⃣ para Guia de Integração Oficial";
      }

      setChatMessages(prev => [...prev, {
        sender: "bot",
        text: botResponse,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }]);
    }, 700);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Move bill between PAGAR and ESPERAR
  const handleToggleStatus = (id: string) => {
    const updated = bills.map((b) => {
      if (b.id === id) {
        const newStatus: "PAGAR" | "ESPERAR" = b.status === "PAGAR" ? "ESPERAR" : "PAGAR";
        return {
          ...b,
          status: newStatus,
          // Assign default groupType if moving to PAGAR
          groupType: newStatus === "PAGAR" ? (priorityGroups[0]?.id || "G1") : "WAIT",
        };
      }
      return b;
    });
    onUpdateBills(updated);
  };

  // Change sub-group for a PAGAR bill
  const handleChangeGroup = (id: string, group: string) => {
    const updated = bills.map((b) => {
      if (b.id === id) {
        return { ...b, groupType: group };
      }
      return b;
    });
    onUpdateBills(updated);
  };

  // Toggle paid state
  const handleTogglePaid = (id: string) => {
    const updated = bills.map((b) => {
      if (b.id === id) {
        return { ...b, paid: !b.paid };
      }
      return b;
    });
    onUpdateBills(updated);
  };

  // Delete bill
  const handleDeleteBill = (id: string) => {
    const updated = bills.filter((b) => b.id !== id);
    onUpdateBills(updated);
  };

  // Add customized bill
  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amountVal) return;
    const numVal = parseFloat(amountVal.replace(",", "."));
    if (isNaN(numVal) || numVal <= 0) return;

    const count = parseInt(billingCount) || 1;
    const generated: PriorityBill[] = [];

    if (billingType === "unique") {
      generated.push({
        id: "pb-custom-" + Math.random().toString(36).substring(2, 9),
        description: desc.trim(),
        amount: numVal,
        scope: scopeVal,
        status: targetStatus,
        groupType: targetStatus === "PAGAR" ? targetGroup : "WAIT",
        paid: false,
        month: selectedMonth
      });
    } else if (billingType === "fixed") {
      for (let i = 0; i < count; i++) {
        generated.push({
          id: "pb-custom-" + Math.random().toString(36).substring(2, 9),
          description: desc.trim(),
          amount: numVal,
          scope: scopeVal,
          status: targetStatus,
          groupType: targetStatus === "PAGAR" ? targetGroup : "WAIT",
          paid: false,
          month: incrementMonth(selectedMonth, i)
        });
      }
    } else if (billingType === "installment") {
      for (let i = 0; i < count; i++) {
        const padIndex = String(i + 1).padStart(2, "0");
        const padTotal = String(count).padStart(2, "0");
        generated.push({
          id: "pb-custom-" + Math.random().toString(36).substring(2, 9),
          description: `${desc.trim()} (${padIndex}/${padTotal})`,
          amount: numVal,
          scope: scopeVal,
          status: targetStatus,
          groupType: targetStatus === "PAGAR" ? targetGroup : "WAIT",
          paid: false,
          month: incrementMonth(selectedMonth, i)
        });
      }
    }

    onUpdateBills([...generated, ...bills]);
    setDesc("");
    setAmountVal("");
    setBillingType("unique");
  };

  // Direct checkout/payment registration onto main Ledger transactions
  const handlePayAndRegister = (bill: PriorityBill) => {
    // Determine category based on scope or use the pre-categorized one!
    const category = bill.category || (bill.scope === TransactionScope.PROFESSIONAL 
      ? "Outras Despesas Profissionais" 
      : "Outras Despesas Pessoais");

    onAddTransactionToLedger({
      description: `Pgto Prioritário: ${bill.description}`,
      amount: bill.amount,
      scope: bill.scope,
      category,
      date: new Date().toISOString().substring(0, 10), // Current date
    });

    // Mark as paid in local priorities state
    const updated = bills.map((b) => {
      if (b.id === bill.id) {
        return { ...b, paid: true };
      }
      return b;
    });
    onUpdateBills(updated);
  };

  // Filter bills by scope
  const filteredBills = bills.filter((b) => {
    if (filterScope === "ALL") return true;
    return b.scope === filterScope;
  });

  // Calculate sum of groupType functions
  const getSubgroupTotals = (group: string) => {
    const list = filteredBills.filter((b) => b.status === "PAGAR" && b.groupType === group && !b.paid);
    const sum = list.reduce((acc, curr) => acc + curr.amount, 0);
    return { sum, count: list.length, items: list };
  };

  const pagarList = filteredBills.filter((b) => b.status === "PAGAR");
  const totalPagar = pagarList.reduce((acc, curr) => acc + (curr.paid ? 0 : curr.amount), 0);
  const countPagar = pagarList.filter(b => !b.paid).length;

  const esperarList = filteredBills.filter((b) => b.status === "ESPERAR");
  const totalEsperar = esperarList.reduce((acc, curr) => acc + (curr.paid ? 0 : curr.amount), 0);
  const countEsperar = esperarList.filter(b => !b.paid).length;

  const totalPaid = bills.filter(b => b.paid).reduce((acc, curr) => acc + curr.amount, 0);
  const countPaid = bills.filter(b => b.paid).length;

  return (
    <div id="expense-prioritizer" className="space-y-6">
      {/* EXPLANATORY ALERT TOP HEADER */}
      <div className="bg-slate-900 border-l-4 border-[#8b5cf6] p-4 text-white rounded-r-lg shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded mt-0.5 border border-[#8b5cf6]/30">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-bold font-display text-white">Priorizador de Despesas de Caixa ({selectedMonth.split("-").reverse().join("/")})</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
              Organize suas saídas de <b>{selectedMonth.split("-").reverse().join("/")}</b> de forma estratégica entre <b>PAGAR</b> ou <b>ESPERAR</b>. 
              Ao alterar o mês na barra superior, as prioridades da legislatura atual são carregadas e persistidas separadamente.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 transition font-bold text-[10px] uppercase tracking-wider rounded border border-slate-700 text-slate-300 cursor-pointer"
              title="Personalizar Subgrupos e Categorias"
            >
              <Settings className="w-3.5 h-3.5" />
              Personalizar
            </button>
            <button
              onClick={onResetBills}
              className="flex items-center gap-1 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 transition font-bold text-[10px] uppercase tracking-wider rounded border border-slate-700 text-slate-300 cursor-pointer"
              title="Restaurar padrão"
            >
              <RotateCcw className="w-3 h-3" />
              Resetar Priorização
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT INTUITIVE MONTH NAVIGATION BAR */}
      {onSetSelectedMonth && (
        <div id="prioritizer-month-navigation" className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <CalendarDays className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-sans">Competência de Caixa:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="prioritizer-prev-month"
              type="button"
              onClick={() => {
                const [year, month] = selectedMonth.split("-").map(Number);
                let newMonth = month - 1;
                let newYear = year;
                if (newMonth === 0) { newMonth = 12; newYear = year - 1; }
                const newMonthStr = newMonth < 10 ? `0${newMonth}` : `${newMonth}`;
                onSetSelectedMonth(`${newYear}-${newMonthStr}`);
              }}
              className="p-1 px-2.5 hover:bg-slate-200 text-slate-600 hover:text-violet-600 rounded-md transition-colors border border-slate-200 bg-white cursor-pointer shadow-3xs"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="bg-white px-5 py-1.5 rounded-lg border border-slate-200 text-center min-w-[145px] shadow-3xs">
              <span className="text-xs font-extrabold text-slate-800 tracking-wide font-sans">
                {(() => {
                  const parts = selectedMonth.split("-");
                  const ptMonths = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                  return `${ptMonths[parseInt(parts[1]) - 1]} de ${parts[0]}`;
                })()}
              </span>
            </div>

            <button
              id="prioritizer-next-month"
              type="button"
              onClick={() => {
                const [year, month] = selectedMonth.split("-").map(Number);
                let newMonth = month + 1;
                let newYear = year;
                if (newMonth === 13) { newMonth = 1; newYear = year + 1; }
                const newMonthStr = newMonth < 10 ? `0${newMonth}` : `${newMonth}`;
                onSetSelectedMonth(`${newYear}-${newMonthStr}`);
              }}
              className="p-1 px-2.5 hover:bg-slate-200 text-slate-600 hover:text-violet-600 rounded-md transition-colors border border-slate-200 bg-white cursor-pointer shadow-3xs"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* THREE VALUE KANBAN SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pagar total */}
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-widest font-mono">PAGAR (Priorizado)</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono font-bold rounded">
              {countPagar} pendentes
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#1e293b]">{formatCurrency(totalPagar)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Dividido em 3 prioridades essenciais</span>
          </div>
        </div>

        {/* Esperar total */}
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">ESPERAR (Aguardar)</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono font-bold rounded">
              {countEsperar} retidos
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700">{formatCurrency(totalEsperar)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Segurando saída até recomposição de caixa</span>
          </div>
        </div>

        {/* Paid / Closed total */}
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest font-mono">PAGO / CONCILIADO</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded">
              {countPaid} liquidados
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700">{formatCurrency(totalPaid)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Conciliados e baixados no Livro Caixa</span>
          </div>
        </div>
      </div>

      {/* FILTER AND QUICK ADD ROW */}
      <div className="bg-white border border-[#e2e8f0] p-4 rounded-lg shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        {/* Scope selection filter */}
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Filtrar por Escopo
          </label>
          <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded">
            <button
              onClick={() => setFilterScope("ALL")}
              className={`flex-1 text-center py-1 text-[11px] font-bold uppercase rounded ${
                filterScope === "ALL" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterScope("PROFESSIONAL")}
              className={`flex-1 text-center py-1 text-[11px] font-bold uppercase rounded ${
                filterScope === "PROFESSIONAL" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              PJ
            </button>
            <button
              onClick={() => setFilterScope("PERSONAL")}
              className={`flex-1 text-center py-1 text-[11px] font-bold uppercase rounded ${
                filterScope === "PERSONAL" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              PF
            </button>
          </div>
        </div>

        {/* Quick form insertion of customized priority account */}
        <form onSubmit={handleAddBill} className="lg:col-span-9 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Inserir Conta Extra
              </label>
              <input
                type="text"
                placeholder="Ex: Assinatura OAB de julho"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Valor (R$)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={amountVal}
                onChange={(e) => setAmountVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Escopo
              </label>
              <select
                value={scopeVal}
                onChange={(e) => setScopeVal(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6]"
              >
                <option value={TransactionScope.PROFESSIONAL}>Escopo PJ</option>
                <option value={TransactionScope.PERSONAL}>Escopo PF</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Tipo Lançamento
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6]"
              >
                <option value="unique">Único</option>
                <option value="fixed">Fixo (Mensal)</option>
                <option value="installment">Parcelado</option>
              </select>
            </div>

            {billingType !== "unique" ? (
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  {billingType === "fixed" ? "Meses (Repetir)" : "Nº Parcelas"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={billingCount}
                  onChange={(e) => setBillingCount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]"
                />
              </div>
            ) : (
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  Prioridade Inicial
                </label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#8b5cf6]"
                >
                  {priorityGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1.5">
            <span className="text-[10px] text-slate-400 font-semibold italic">
              {billingType === "fixed" && `💡 Irá cadastrar R$ ${amountVal || "0,00"} nos próximos ${billingCount} meses.`}
              {billingType === "installment" && `💡 Irá cadastrar ${billingCount} parcelas de R$ ${amountVal || "0,00"} nos próximos meses.`}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-grow sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-xs px-5 py-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer h-[36px] shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPastedText("");
                  setParsedPreviewBills([]);
                  setBulkImportError("");
                  setIsBulkPasteOpen(true);
                }}
                className="px-4 border border-indigo-200 hover:border-indigo-300 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 font-bold uppercase tracking-wider text-xs py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer h-[36px]"
                title="Colar lista de despesas em lote"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Colar Lote</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CORE COLUMNS WITH BOTO ACCORDIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COMPACT COLUMN: PAGAR CLASS SUBGROUPS (8/12 layout depth) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#e2e8f0] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-widest font-mono">Seção Principal</span>
                <h3 className="text-sm font-bold text-[#1e293b]">Despesas a Pagar (Priorizadas)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Subtotal: {formatCurrency(totalPagar)}
                </span>
                <span className="text-[10px] text-slate-400">({countPagar} pendentes)</span>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {priorityGroups.map((group) => {
                const totals = getSubgroupTotals(group.id);
                const dotColor = group.color || "bg-slate-400";
                
                return (
                  <div key={group.id} className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/20">
                    <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 ${dotColor} rounded-full`}></span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{group.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {formatCurrency(totals.sum)} ({totals.count} itens)
                      </span>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {totals.items.length === 0 ? (
                        <div className="p-3 text-center text-[11px] text-slate-400">Sem itens cadastrados nesta seção.</div>
                      ) : (
                        totals.items.map(b => (
                          <div key={b.id} id={`bill-item-${b.id}`} className="transition-all">
                            {/* DESKTOP ROW */}
                            <div className="hidden md:flex p-2.5 bg-white items-center justify-between gap-4 text-xs group hover:bg-slate-50/50">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {b.scope === TransactionScope.PROFESSIONAL ? (
                                  <div className="p-1 px-1.5 bg-blue-50 text-[#2563eb] rounded font-mono text-[9px] font-bold shrink-0 border border-blue-200">PJ</div>
                                ) : (
                                  <div className="p-1 px-1.5 bg-violet-50 text-[#8b5cf6] rounded font-mono text-[9px] font-bold shrink-0 border border-violet-200">PF</div>
                                )}
                                <div className="truncate">
                                  <span className="font-bold text-slate-800 leading-tight block truncate" title={b.description}>{b.description}</span>
                                  {b.notes && <p className="text-[10px] text-slate-400 leading-none mt-0.5">{b.notes}</p>}
                                  {b.category && (
                                    <span className="inline-block text-[8px] font-extrabold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100/60 mt-1">
                                      📁 {b.category}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono font-bold text-slate-800 text-right shrink-0">{formatCurrency(b.amount)}</span>
                                
                                <button
                                  onClick={() => handleToggleStatus(b.id)}
                                  className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded transition cursor-pointer"
                                  title="Segurar / Postegar para Esperar"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>

                                <select
                                  value={b.groupType}
                                  onChange={(e) => handleChangeGroup(b.id, e.target.value)}
                                  className="bg-transparent text-[10px] text-slate-500 font-bold focus:outline-hidden cursor-pointer"
                                >
                                  {priorityGroups.map(g => (
                                    <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handlePayAndRegister(b)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition rounded text-[10px] font-bold uppercase shrink-0 cursor-pointer"
                                >
                                  Pagar & Lançar
                                </button>

                                <button onClick={() => handleDeleteBill(b.id)} className="p-1 text-slate-300 hover:text-red-500 rounded transition shrink-0 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* MOBILE CARD VIEW */}
                            <div className="flex md:hidden p-4 bg-white flex-col gap-3.5 text-xs hover:bg-slate-50/40 border-b border-slate-100 last:border-b-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {b.scope === TransactionScope.PROFESSIONAL ? (
                                    <span className="p-1 px-1.5 bg-blue-50 text-blue-700 rounded font-mono text-[9px] font-bold border border-blue-200">Escritório PJ</span>
                                  ) : (
                                    <span className="p-1 px-1.5 bg-violet-50 text-[#8b5cf6] rounded font-mono text-[9px] font-bold border border-violet-200">Pessoal PF</span>
                                  )}
                                  
                                  <select
                                    value={b.groupType}
                                    onChange={(e) => handleChangeGroup(b.id, e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 font-bold px-1.5 py-0.5 focus:outline-hidden cursor-pointer"
                                  >
                                    {priorityGroups.map(g => (
                                      <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleStatus(b.id)}
                                    className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded transition border border-amber-200 cursor-pointer flex items-center gap-1 text-[9px] font-bold"
                                    title="Segurar / Postegar para Esperar"
                                  >
                                    <span>Segurar</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteBill(b.id)} 
                                    className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-100 transition cursor-pointer"
                                    title="Excluir despesa"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">{b.description}</h4>
                                {b.notes && (
                                  <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 leading-normal">
                                    {b.notes}
                                  </p>
                                )}
                                {b.category && (
                                  <div className="mt-1">
                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/60">
                                      📁 {b.category}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                                <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base">
                                  {formatCurrency(b.amount)}
                                </span>
                                
                                <button
                                  onClick={() => handlePayAndRegister(b)}
                                  className="px-3.5 py-1.5 bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-500 text-white transition rounded-md text-[10px] font-extrabold uppercase tracking-wide cursor-pointer shadow-3xs flex items-center gap-1"
                                >
                                  Pagar & Lançar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ESPERAR CONTAS ON HOLD (4/12 layout depth) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-2xs overflow-hidden">
            <div className="bg-slate-50 border-b border-[#e2e8f0] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono font-sans">Aguardar Caixa</span>
                <h3 className="text-sm font-bold text-[#1e293b]">Postergados (Esperar)</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {formatCurrency(totalEsperar)}
                </span>
              </div>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {esperarList.filter(b => !b.paid).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Não há mais contas em espera de caixa!
                </div>
              ) : (
                esperarList.filter(b => !b.paid).map(b => (
                  <div key={b.id} id={`wait-item-${b.id}`} className="transition-all">
                    {/* DESKTOP WAIT ITEM */}
                    <div className="hidden md:flex py-3 flex-col gap-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <button
                            onClick={() => handleToggleStatus(b.id)}
                            className="p-1 text-slate-400 hover:text-[#2563eb] hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Inserir de volta para Prioritários / Pagar"
                          >
                            <ArrowLeft className="w-4 h-4 text-[#2563eb]" />
                          </button>
                          <div className="truncate">
                            <p className="font-bold text-slate-800 leading-tight block">{b.description}</p>
                            {b.notes && <p className="text-[10px] text-slate-400">{b.notes}</p>}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-right shrink-0">{formatCurrency(b.amount)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] bg-slate-50 p-1 px-2 rounded mt-0.5">
                        <span className="text-slate-400 flex items-center gap-1 font-mono">
                          {b.scope === TransactionScope.PROFESSIONAL ? <Building2 className="w-3 h-3 text-blue-500" /> : <User className="w-3 h-3 text-[#8b5cf6]" />}
                          {b.scope === TransactionScope.PROFESSIONAL ? "Escritório PJ" : "Pessoal PF"}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePayAndRegister(b)}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition rounded font-bold uppercase shrink-0 text-[9px] cursor-pointer"
                          >
                            Liberar & Pagar
                          </button>
                          <button onClick={() => handleDeleteBill(b.id)} className="text-slate-300 hover:text-red-500 rounded transition cursor-pointer">
                            <Trash2 className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* MOBILE WAIT CARD */}
                    <div className="flex md:hidden p-3.5 bg-white border border-slate-100 rounded-lg flex-col gap-3.5 text-xs hover:bg-slate-50/40 my-2 shadow-2xs">
                      {/* Header Line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(b.id)}
                            className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition border border-indigo-200 cursor-pointer flex items-center gap-1 text-[9px] font-bold"
                            title="Desfazer retenção"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Priorizar</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {b.scope === TransactionScope.PROFESSIONAL ? (
                            <span className="p-1 px-1.5 bg-blue-50 text-blue-700 rounded font-mono text-[9px] font-bold border border-blue-200">Escritório PJ</span>
                          ) : (
                            <span className="p-1 px-1.5 bg-violet-50 text-[#8b5cf6] rounded font-mono text-[9px] font-bold border border-violet-200">Pessoal PF</span>
                          )}

                          <button 
                            onClick={() => handleDeleteBill(b.id)} 
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-100 transition cursor-pointer"
                            title="Excluir despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Body: Description */}
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">{b.description}</h4>
                        {b.notes && (
                          <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 leading-normal">
                            {b.notes}
                          </p>
                        )}
                      </div>

                      {/* Footer: Price and trigger */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                        <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base">
                          {formatCurrency(b.amount)}
                        </span>
                        
                        <button
                          onClick={() => handlePayAndRegister(b)}
                          className="px-3.5 py-1.5 bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-500 text-white transition rounded-md text-[10px] font-extrabold uppercase tracking-wide cursor-pointer shadow-3xs flex items-center gap-1"
                        >
                          Liberar & Pagar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* WHATSAPP INTEGRATION & ALERTS PANEL MOVED TO ANOTHER TAB */}
      {false && (
      <div id="whatsapp-integration-section" className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-2xs space-y-0 mt-6 font-sans">
        {/* Banner header */}
        <div className="bg-[#128c7e] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-lg border border-white/25">
              <MessageSquare className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display leading-tight">MÓDULO DE INTEGRAÇÃO & ALERTAS WHATSAPP</h3>
              <p className="text-[10px] text-emerald-100 font-medium">Envie avisos de pendências e consulte o caixa móvel em qualquer lugar do mundo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setConfigOpen(!configOpen); if (!configOpen) { setChatOpen(false); setGuideOpen(false); } }}
              className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider text-white border transition-all cursor-pointer ${
                configOpen ? "bg-[#075e54] border-emerald-950 shadow-inner" : "bg-white/10 hover:bg-white/20 border-white/15"
              }`}
            >
              <Settings className="w-3.5 h-3.5 inline mr-1 animate-spin-slow" />
              {configOpen ? "Fechar Configuração" : "Configurar API"}
            </button>
            <button
              onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) { setConfigOpen(false); setGuideOpen(false); } }}
              className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider text-white border transition-all cursor-pointer ${
                chatOpen ? "bg-[#075e54] border-emerald-950 shadow-inner" : "bg-white/10 hover:bg-white/20 border-white/15"
              }`}
            >
              {chatOpen ? "Ocultar Simulador" : "Simulador Ativo"}
            </button>
            <button
              onClick={() => { setGuideOpen(!guideOpen); if (!guideOpen) { setChatOpen(false); setConfigOpen(false); } }}
              className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider text-white border transition-all cursor-pointer ${
                guideOpen ? "bg-[#075e54] border-emerald-950 shadow-inner" : "bg-white/10 hover:bg-white/20 border-white/15"
              }`}
            >
              {guideOpen ? "Fechar Guia Técnico" : "Guia: Como Fazer?"}
            </button>
          </div>
        </div>

        {/* API Credentials and Numbers Settings Area */}
        {configOpen && (
          <div id="whatsapp-api-config-area" className="bg-slate-50 p-6 border-b border-slate-200">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Settings className="w-5 h-5 text-[#128c7e]" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Parâmetros de Conexão WhatsApp & Outbound Gateway</h4>
                    <p className="text-[10px] text-slate-500">Insira as credenciais do seu serviço Twilio ou Webhook para disparar alertas reais de vencimento</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                  Conexão Pronta
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-800">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      📞 Celular de Destino dos Alertas (Com DDD)
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+55 (11) 99999-9999"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-800"
                      required
                    />
                    <p className="text-[9px] text-slate-500 mt-1">Este número receberá a notificação automatizada no formato internacional (ex: +5511999999999).</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      ⚙️ Método de Canal de Disparo (Gateway)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIntegrationType("webhook")}
                        className={`p-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                          integrationType === "webhook"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-3xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Webhook Customizado
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntegrationType("twilio")}
                        className={`p-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                          integrationType === "twilio"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-3xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Twilio Gateway
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">Prevenção e Agendamento</p>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="check-alert-venc" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer" />
                      <label htmlFor="check-alert-venc" className="text-[10px] text-slate-600 font-medium cursor-pointer">Notificar automaticamente 24 horas antes do vencimento</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="check-alert-pag" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer" />
                      <label htmlFor="check-alert-pag" className="text-[10px] text-slate-600 font-medium cursor-pointer">Disparar log de confirmação de pagamento instantaneamente</label>
                    </div>
                  </div>
                </div>

                {/* Conditional Settings Fields */}
                <div className="space-y-4">
                  {integrationType === "webhook" ? (
                    <div className="bg-white card rounded-xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                      <div className="border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <p className="text-[10px] font-bold text-slate-700 font-mono">CONFIGURAÇÕES DE WEBHOOK (Z-API / EVOLUTION / MAKE)</p>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Endpoint URL de Destino (POST)</label>
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://api.z-api.io/instances/..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Token ou Bearer Token de Autorização (Opcional)</label>
                        <input
                          type="text"
                          value={webhookToken}
                          onChange={(e) => setWebhookToken(e.target.value)}
                          placeholder="Token Authorization Bearer da API"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white card rounded-xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                      <div className="border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                        <p className="text-[10px] font-bold text-slate-700 font-mono">CONEXÃO TWILIO WEB GATEWAY</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Account SID</label>
                          <input
                            type="text"
                            value={twilioSid}
                            onChange={(e) => setTwilioSid(e.target.value)}
                            placeholder="ACxxxxxxxxxxxxxxxxxx"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Auth Token</label>
                          <input
                            type="password"
                            value={twilioToken}
                            onChange={(e) => setTwilioToken(e.target.value)}
                            placeholder="••••••••••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Número Remetente Twilio (whatsapp:+...)</label>
                        <input
                          type="text"
                          value={twilioFrom}
                          onChange={(e) => setTwilioFrom(e.target.value)}
                          placeholder="whatsapp:+14155238886"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                        />
                        <p className="text-[8px] text-slate-400 mt-1">Por padrão, utilize o Sandbox da Sandbox do Twilio (`whatsapp:+14155238886`).</p>
                      </div>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Salvar Dados
                    </button>
                    <button
                      type="button"
                      onClick={handleTestApiAlert}
                      disabled={isTesting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? "Processando..." : "Enviar Alerta de Teste"}
                    </button>
                  </div>
                  {saveStatusMsg && (
                    <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded border border-emerald-200 text-center animate-fade-in">
                      {saveStatusMsg}
                    </div>
                  )}
                </div>
              </form>

              {/* Logs live console */}
              {(apiLogs.length > 0 || isTesting) && (
                <div className="bg-slate-950 text-slate-300 rounded-xl overflow-hidden font-mono text-[10px] border border-slate-800 shadow-md">
                  <div className="bg-slate-900 p-2.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-sans font-bold text-slate-400">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      Console de Resposta da API Gateway de Alertas
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full inline-block ${
                        apiStatus === 'success' ? 'bg-emerald-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                      }`}></span>
                      <span className="capitalize">{apiStatus === 'idle' ? 'Disparando...' : apiStatus}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1 bg-slate-950 text-slate-200 max-h-[160px] overflow-y-auto">
                    {apiLogs.map((log, i) => (
                      <p key={i} className={
                        log.startsWith("❌") ? "text-red-400" : log.startsWith("✅") ? "text-emerald-400" : "text-slate-300"
                      }>
                        &gt; {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              Ação Imediata: Compartilhar com Equipe, Sócio ou Secretária
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Use as ferramentas de disparo rápido para enviar um relatório com todas as despesas sob prioridade <span className="font-bold text-blue-600">Pagar</span> e <span className="font-bold text-amber-500">Espera</span> do mês. Extremamente útil para prestação de contas com o setor de pagamentos ou auto-gerenciamento!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 shrink-0">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 transition rounded-lg text-xs font-bold shadow-2xs shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar Relatório Formatado"}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white transition rounded-lg text-xs font-bold shadow-2xs shrink-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Disparar WhatsApp Web
            </button>
          </div>
        </div>

        {/* Expanded Guide Area */}
        {guideOpen && (
          <div className="bg-emerald-50/20 p-5 border-b border-emerald-100 text-[#1e293b] text-xs leading-relaxed space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wide">
              <BookOpen className="w-4.5 h-4.5" />
              Guia Técnico: Como Enviar Alertas & Consultar Despesas via WhatsApp Real
            </div>
            
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Para transformar este sistema financeiro em um robô ativo no WhatsApp do seu celular no dia a dia, você precisará conectar o aplicativo web a uma <b>API Gateway de WhatsApp</b>. Veja abaixo os detalhes práticos de como implementar:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-emerald-100 rounded-lg p-3.5 space-y-2 shadow-2xs">
                <p className="font-bold text-emerald-800 flex items-center gap-1">
                  <span className="text-[#128c7e]">1.</span> Como enviar Alertas Automáticos? (Push Notifications)
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ideal para lembrar no dia do vencimento ou quando uma nova despesa do escritório é movida para a lista "Esperar".
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[10.5px] text-slate-600">
                  <li>Contrate uma API parceira (Z-API, Evolution API ou Twilio Cloud).</li>
                  <li>Crie uma tarefa agendada (Cron Job) no seu servidor Express (`server.ts`) rodando às 08:00 diariamente.</li>
                  <li>Filtre despesas abertas com vencimento para hoje e faça um `POST` enviando o número do destinatário e a mensagem JSON.</li>
                </ol>
              </div>

              <div className="bg-white border border-emerald-100 rounded-lg p-3.5 space-y-2 shadow-2xs">
                <p className="font-bold text-emerald-800 flex items-center gap-1">
                  <span className="text-[#128c7e]">2.</span> Como consultar despesas em aberto por Chatbot? (Consulta de Dados/Pull)
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Para digitar "Listar despesas" no WhatsApp e receber a listagem instantânea extraída de forma verídica do banco de dados do sistema.
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[10.5px] text-slate-600">
                  <li>Configure um endpoint de Webhook público (ex: `/api/whatsapp-webhook`) no seu painel da API de WhatsApp.</li>
                  <li>Incentive o Express a receber o payload do WhatsApp contendo o texto da mensagem via `req.body.message`.</li>
                  <li>Verifique os comandos (`1`, `contas`, `saldo`) usando queries simples no de dados e faça a resposta para o remetente usando a API correspondente.</li>
                </ol>
              </div>
            </div>

            {/* Quick Node Express Endpoint Sample */}
            <div className="bg-slate-900 rounded-lg p-3 text-emerald-400 font-mono text-[9px] overflow-x-auto border border-slate-950 shadow-inner max-w-full">
              <p className="text-slate-400 font-sans font-bold text-[10px] mb-2 border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>Exemplo de Código Real para Webhook (Express + Node.js)</span>
                <span className="font-mono text-[8px] bg-emerald-950/50 p-0.5 px-1.5 rounded text-emerald-500">EXPRESS ROUTE</span>
              </p>
              <pre className="text-emerald-300 leading-normal">{`// Endereço do webhook configurado na API do WhatsApp
app.post('/api/whatsapp-webhook', async (req, res) => {
  const { sender, messageText } = req.body; // Dados recebidos da Z-API / EvolutionAPI
  
  if (messageText === '1') {
    // Busca as contas da lista "PAGAR" de forma dinâmica no banco de dadosSQL
    const pendingBills = await db.select().from(schema.priorityBills).where(eq(schema.priorityBills.status, 'PAGAR'));
    const textToSend = "📋 *Contas pendentes:*\\n" + pendingBills.map((b, i) => \`\${i+1}. \${b.description} - R\$ \${b.amount}\`).join("\\n");
    
    // Dispara a mensagem de volta para o cliente de forma automatizada
    await axios.post('https://api.z-api.io/instances/SUA_INSTANCIA/send-text', {
      phone: sender,
      message: textToSend
    }, { headers: { 'Authorization': 'Bearer SEU_TOKEN' } });
  }
  
  res.status(200).json({ status: 'success' });
});`}</pre>
            </div>
          </div>
        )}

        {/* WhatsApp Chatbot Simulator view */}
        {chatOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[330px] font-sans">
            {/* Left menu column list */}
            <div className="lg:col-span-4 bg-slate-50 border-r border-slate-100 p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#128c7e] uppercase tracking-widest font-mono">Simulação Interativa</span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans mt-1">
                  <b>Clique nos atalhos rápidos</b> para testar agora mesmo o comportamento em tempo real do assistente automatizado de WhatsApp com base no seu fluxo de caixa:
                </p>
                
                <div className="flex flex-col gap-1.5 pt-2">
                  <button
                    onClick={() => handleSendChatMessage("1")}
                    className="w-full text-left py-1.5 px-3 bg-white hover:bg-emerald-50 hover:text-[#128c7e] border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] text-slate-700 font-bold tracking-wide transition-all font-sans cursor-pointer flex items-center justify-between"
                  >
                    <span>1️⃣ Listar Contas a Pagar</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#128c7e]" />
                  </button>
                  <button
                    onClick={() => handleSendChatMessage("2")}
                    className="w-full text-left py-1.5 px-3 bg-white hover:bg-emerald-50 hover:text-[#128c7e] border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] text-slate-700 font-bold tracking-wide transition-all font-sans cursor-pointer flex items-center justify-between"
                  >
                    <span>2️⃣ Ver Saldo Operacional</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#128c7e]" />
                  </button>
                  <button
                    onClick={() => handleSendChatMessage("3")}
                    className="w-full text-left py-1.5 px-3 bg-white hover:bg-emerald-50 hover:text-[#128c7e] border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] text-slate-700 font-bold tracking-wide transition-all font-sans cursor-pointer flex items-center justify-between"
                  >
                    <span>3️⃣ Ver Contas sob Espera</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#128c7e]" />
                  </button>
                  <button
                    onClick={() => handleSendChatMessage("4")}
                    className="w-full text-left py-1.5 px-3 bg-white hover:bg-emerald-50 hover:text-[#128c7e] border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] text-slate-700 font-bold tracking-wide transition-all font-sans cursor-pointer flex items-center justify-between"
                  >
                    <span>4️⃣ Guia de Apoio Técnico</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#128c7e]" />
                  </button>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 bg-slate-100 p-2 rounded border border-slate-200 italic leading-snug">
                🤖 O bot acima é reativo! Lançar novas despesas ou marcar como "Liberar & Pagar" atualiza as mensagens dele instantaneamente.
              </div>
            </div>

            {/* Simulated Chat Interface Column */}
            <div className="lg:col-span-8 flex flex-col h-full bg-[#f0f2f5] relative">
              {/* Chat Header */}
              <div className="bg-[#075e54] text-white px-3.5 py-2 flex items-center justify-between shrink-0 relative z-10 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-900 border border-emerald-400 p-0.5 flex flex-col items-center justify-center font-bold text-[9px] text-[#25d366]">
                    🤖
                  </div>
                  <div>
                    <p className="text-xs font-bold font-sans text-white leading-tight">Chatbot JurisFinance AI</p>
                    <p className="text-[8px] text-[#25d366] font-bold uppercase leading-none font-sans animate-pulse">Online • Assistente de Caixa</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <span className="text-[9px] font-mono tracking-wider font-bold bg-[#128c7e] p-0.5 px-1.5 rounded select-none">SIMULADOR WHATSAPP</span>
                </div>
              </div>

              {/* Message scroll container */}
              <div className="flex-grow overflow-y-auto p-4 space-y-2 relative z-10 text-xs flex flex-col bg-[#efeae2] bg-opacity-95">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-lg p-2.5 shadow-3xs leading-relaxed flex flex-col space-y-1 ${
                      msg.sender === "user"
                        ? "bg-[#d9fdd3] text-slate-900 self-end rounded-tr-none ml-auto"
                        : "bg-white text-slate-900 self-start rounded-tl-none mr-auto"
                    }`}
                  >
                    <p className="whitespace-pre-line text-[11px] font-sans leading-normal">{msg.text}</p>
                    <span className="text-[8px] text-slate-400 self-end leading-none font-sans mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage(chatInput);
                }}
                className="bg-[#f0f2f5] p-2 flex items-center gap-2 relative z-10 shrink-0 border-t border-slate-200"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Selecione um atalho ao lado ou digite seu comando..."
                  className="flex-grow bg-white border border-slate-200 rounded-lg p-1.5 px-3 text-xs focus:ring-1 focus:ring-emerald-500 font-sans text-slate-800"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-[#00a884] hover:bg-emerald-700 text-white rounded-full transition-colors cursor-pointer"
                  title="Enviar"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      )}

      {/* BULK IMPORT MODAL FOR PRIORITY BILLS */}
      {isBulkPasteOpen && (
        <div id="bulk-paste-modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-left">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300 animate-scale-up text-left">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-4">
              <div className="flex items-center gap-1.5 font-sans">
                <FileSpreadsheet className="w-5 h-5 text-[#8b5cf6]" />
                <h3 className="text-sm font-bold tracking-tight uppercase tracking-wider">
                  Importar Despesas em Lote (Priorização por Grupos)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkPasteOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 max-h-[80vh] overflow-y-auto">
              
              {/* Left Panel: Instructions and textarea */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-violet-600" />
                    Como funciona o formato?
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Você pode copiar uma lista de uma planilha (Excel, Sheets), arquivo de texto ou CRM e colar abaixo. Cada linha representa uma despesa.
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
                    <p>💡 <b>Grupos:</b> G1 (Essencial), G2 (Importante), G3 (Contornável) ou WAIT (Esperar)</p>
                    <p>💡 <b>Escopo:</b> PJ (Escritório) ou PF (Pessoal)</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="bulk-paste-textarea" className="block text-xs font-bold text-slate-700">Cole sua lista de contas aqui:</label>
                  <textarea
                    id="bulk-paste-textarea"
                    rows={12}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    placeholder="Exemplo:&#10;Aluguel Escritório; 1500,00; G1; PJ&#10;Licença LexisNexis; 220,00; G2&#10;Impostos das Notas; 450,00; G3&#10;Fatura de Luz PF; 180; WAIT; PF"
                    value={pastedText}
                    onChange={(e) => handleTextPasteChange(e.target.value)}
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium px-1">
                    <span>Aceita Tab, Ponto e vírgula (;), etc. ou texto livre com IA!</span>
                    <span>{parsedPreviewBills.length} itens detectados</span>
                  </div>

                  {/* AI parser button and loader/error */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isAiLoading || !pastedText.trim()}
                      onClick={handleAiParse}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm text-white ${
                        isAiLoading 
                          ? "bg-slate-400 cursor-not-allowed" 
                          : !pastedText.trim()
                          ? "bg-emerald-600/50 cursor-not-allowed"
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

              {/* Right Panel: Parsed Live Preview Grid */}
              <div className="lg:col-span-8 flex flex-col space-y-3 min-h-[300px]">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Prévia de Importação Inteligente
                  </h4>
                  {parsedPreviewBills.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setParsedPreviewBills([])}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Limpar Verificação
                    </button>
                  )}
                </div>

                {parsedPreviewBills.length === 0 ? (
                  <div className="flex-grow border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-400 text-center bg-slate-50/55 min-h-[300px]">
                    <FileSpreadsheet className="w-12 h-12 text-slate-300 stroke-1 mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Pronto para processar dados</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">Cole uma lista de despesas na caixa amarela da esquerda. Nós analisaremos os valores, grupos de prioridade e escopos de forma automática!</p>
                  </div>
                ) : (
                  <div className="flex-grow border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col max-h-[55vh]">
                    <div className="overflow-x-auto overflow-y-auto flex-grow p-3 md:p-0">
                      {/* Desktop Table View */}
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
                          {parsedPreviewBills.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Descrição */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                                  value={item.description}
                                  onChange={(e) => handleUpdatePreviewBillField(item.id, "description", e.target.value)}
                                />
                                {item.category && (
                                  <div className="text-[10px] text-slate-500 mt-1.5 flex flex-wrap gap-1 leading-normal">
                                    <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                      📁 {item.category}
                                    </span>
                                  </div>
                                )}
                              </td>
                              
                              {/* Valor */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                                  value={item.amount || ""}
                                  onChange={(e) => handleUpdatePreviewBillField(item.id, "amount", parseFloat(e.target.value) || 0)}
                                />
                              </td>

                              {/* Grupo */}
                              <td className="p-2">
                                <select
                                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs font-semibold focus:outline-hidden text-slate-700"
                                  value={item.groupType}
                                  onChange={(e) => handleUpdatePreviewBillField(item.id, "groupType", e.target.value)}
                                >
                                  {priorityGroups.map(g => (
                                    <option key={g.id} value={g.id}>{g.id} - {g.name.split("•")[1]?.trim() || g.name}</option>
                                  ))}
                                  <option value="WAIT">ESPERAR - Fila de Espera</option>
                                </select>
                              </td>

                              {/* Escopo */}
                              <td className="p-2">
                                <select
                                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded p-1 text-xs focus:outline-hidden text-slate-700"
                                  value={item.scope}
                                  onChange={(e) => handleUpdatePreviewBillField(item.id, "scope", e.target.value)}
                                >
                                  <option value={TransactionScope.PROFESSIONAL}>💼 Escritório (PJ)</option>
                                  <option value={TransactionScope.PERSONAL}>🏠 Pessoal (PF)</option>
                                </select>
                              </td>

                              {/* Excluir da lista */}
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePreviewBill(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Remover este item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Mobile Card List View */}
                      <div className="block md:hidden space-y-4">
                        {parsedPreviewBills.map((item) => (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm space-y-3.5 relative hover:border-slate-300 transition-colors">
                            {/* Header inside Card */}
                            <div className="flex justify-between items-start">
                              <div className="flex flex-wrap gap-1.5">
                                {item.category && (
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/60 flex items-center gap-1">
                                    📁 {item.category}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePreviewBill(item.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-100 transition-colors cursor-pointer flex items-center justify-center"
                                title="Remover este item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Form Input fields */}
                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium transition-all"
                                  value={item.description}
                                  onChange={(e) => handleUpdatePreviewBillField(item.id, "description", e.target.value)}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor (R$)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono transition-all"
                                    value={item.amount || ""}
                                    onChange={(e) => handleUpdatePreviewBillField(item.id, "amount", parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Escopo</label>
                                  <select
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition-all"
                                    value={item.scope}
                                    onChange={(e) => handleUpdatePreviewBillField(item.id, "scope", e.target.value)}
                                  >
                                    <option value={TransactionScope.PROFESSIONAL}>💼 Escritório (PJ)</option>
                                    <option value={TransactionScope.PERSONAL}>🏠 Pessoal (PF)</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grupo de Prioridade</label>
                                <select
                                   className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                                   value={item.groupType}
                                   onChange={(e) => handleUpdatePreviewBillField(item.id, "groupType", e.target.value)}
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

                    {/* Tiny summary beneath table */}
                    <div className="bg-slate-100 p-2.5 px-4 text-[11px] text-slate-600 flex justify-between items-center border-t border-slate-200 font-sans">
                      <span>Total Parcial dos items editados:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatCurrency(parsedPreviewBills.reduce((acc, curr) => acc + curr.amount, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Error alerts */}
            {bulkImportError && (
              <div className="mx-5 mb-4 bg-red-50 text-rose-600 border border-rose-100 text-xs font-semibold p-3 rounded-lg text-center">
                ⚠️ {bulkImportError}
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsBulkPasteOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-extrabold text-[#64748b] bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportPreviewBills}
                disabled={parsedPreviewBills.length === 0}
                className={`w-full sm:w-auto px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  parsedPreviewBills.length === 0 && "opacity-50 cursor-not-allowed bg-indigo-400"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Importar {parsedPreviewBills.length} Lançamentos Gerados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSONALIZATION / SETTINGS MODAL */}
      {isSettingsOpen && (
        <div id="settings-personalization-modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-scale-up text-left">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col text-slate-800">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-4">
              <div className="flex items-center gap-2 font-sans">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold tracking-tight uppercase tracking-wider">
                  Painel de Personalização
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Tab selectors */}
            <div className="flex-grow overflow-y-auto p-5 space-y-5">
              {/* Tab navigation */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setSettingsTab("groups")}
                  className={`py-2.5 px-5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    settingsTab === "groups"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📁 Subgrupos de Prioridade (Despesas)
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("categories")}
                  className={`py-2.5 px-5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    settingsTab === "categories"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🏷️ Categorias de Lançamentos
                </button>
              </div>

              {/* TAB 1: Subgroups of priority */}
              {settingsTab === "groups" && (
                <div className="space-y-6">
                  {/* Explanatory notes */}
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3.5 rounded-r-lg text-xs text-indigo-900">
                    Aqui você pode gerenciar os subgrupos de priorização. Renomeie o título dos grupos de despesas, mude a cor do indicador visual, delete subgrupos que não usa mais ou crie novos conforme a realidade financeira do seu escritório.
                  </div>

                  {/* Add group form */}
                  <form onSubmit={handleAddGroup} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Nome do Novo Subgrupo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Subgrupo 4 • Custos Operacionais"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Cor do Indicador</label>
                      <select
                        value={newGroupColor}
                        onChange={(e) => setNewGroupColor(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-semibold"
                      >
                        <option value="bg-red-500">🔴 Vermelho</option>
                        <option value="bg-orange-500">🟠 Laranja</option>
                        <option value="bg-amber-500">🟡 Amarelo</option>
                        <option value="bg-emerald-500">🟢 Verde</option>
                        <option value="bg-blue-500">🔵 Azul</option>
                        <option value="bg-indigo-500">🟣 Indigo</option>
                        <option value="bg-[#8b5cf6]">🔮 Violeta</option>
                        <option value="bg-pink-500">🌸 Rosa</option>
                        <option value="bg-slate-500">⚫ Slate/Cinza</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer shadow-3xs"
                      >
                        + Criar
                      </button>
                    </div>
                  </form>

                  {/* List of existing groups */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subgrupos Ativos</h4>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                      {priorityGroups.map((g) => (
                        <div key={g.id} className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${g.color || "bg-slate-400"}`}></span>
                            <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">{g.id}</span>
                            <input
                              type="text"
                              value={g.name}
                              onChange={(e) => handleRenameGroup(g.id, e.target.value)}
                              className="bg-transparent hover:bg-slate-100 focus:bg-white border-b border-transparent focus:border-indigo-400 px-1 py-0.5 text-xs text-slate-800 font-semibold w-full md:w-[320px] rounded focus:outline-hidden"
                            />
                          </div>
                          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                            <select
                              value={g.color || "bg-slate-500"}
                              onChange={(e) => handleChangeGroupColor(g.id, e.target.value)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[11px] focus:outline-hidden text-slate-700 font-medium"
                            >
                              <option value="bg-red-500">Vermelho</option>
                              <option value="bg-orange-500">Laranja</option>
                              <option value="bg-amber-500">Amarelo</option>
                              <option value="bg-emerald-500">Verde</option>
                              <option value="bg-blue-500">Azul</option>
                              <option value="bg-indigo-500">Indigo</option>
                              <option value="bg-[#8b5cf6]">Violeta</option>
                              <option value="bg-pink-500">Rosa</option>
                              <option value="bg-slate-500">Slate/Cinza</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeletePriorityGroup(g.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Excluir subgrupo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Custom Categories */}
              {settingsTab === "categories" && (
                <div className="space-y-6">
                  {/* Explanatory notes */}
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3.5 rounded-r-lg text-xs text-indigo-900">
                    Configure categorias personalizadas de lançamentos contábeis. Escolha o escopo (Profissional/Escritório ou Pessoal) e o tipo (Receita ou Despesa) para gerenciar a lista de opções exibida nos formulários e nas importações.
                  </div>

                  {/* Scope and Type selector (sub-tabs) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCatScope(TransactionScope.PROFESSIONAL);
                        setCatType(TransactionType.EXPENSE);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        catScope === TransactionScope.PROFESSIONAL && catType === TransactionType.EXPENSE
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      💼 PJ: Despesas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCatScope(TransactionScope.PROFESSIONAL);
                        setCatType(TransactionType.REVENUE);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        catScope === TransactionScope.PROFESSIONAL && catType === TransactionType.REVENUE
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      💼 PJ: Receitas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCatScope(TransactionScope.PERSONAL);
                        setCatType(TransactionType.EXPENSE);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        catScope === TransactionScope.PERSONAL && catType === TransactionType.EXPENSE
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      🏠 PF: Despesas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCatScope(TransactionScope.PERSONAL);
                        setCatType(TransactionType.REVENUE);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        catScope === TransactionScope.PERSONAL && catType === TransactionType.REVENUE
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      🏠 PF: Receitas
                    </button>
                  </div>

                  {/* Add category form */}
                  <form onSubmit={handleAddCategorySubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3 items-end">
                    <div className="flex-grow space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Nova Categoria ({catScope === TransactionScope.PROFESSIONAL ? "Escritório/PJ" : "Pessoal/PF"} • {catType === TransactionType.EXPENSE ? "Saída/Despesa" : "Entrada/Receita"})
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carro, Cavalo, Gasolina, Uber..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-5 rounded-lg transition-colors cursor-pointer shadow-3xs h-[36px]"
                    >
                      Adicionar
                    </button>
                  </form>

                  {/* Category lists under currently selected Scope+Type */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categorias Cadastradas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/60">
                      {(ALL_CATEGORIES_MAP[`${catScope}_${catType}`] || []).map((catName) => {
                        const isDefault = isDefaultCategory(catScope, catType, catName);
                        return (
                          <div key={catName} className="p-2.5 bg-white border border-slate-200/50 rounded-lg flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                            <span className="font-semibold text-slate-700">{catName}</span>
                            {isDefault ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                                Padrão
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => deleteCustomCategory(catScope, catType, catName)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Excluir categoria customizada"
                              >
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

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all cursor-pointer shadow-3xs"
              >
                Concluir e Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
