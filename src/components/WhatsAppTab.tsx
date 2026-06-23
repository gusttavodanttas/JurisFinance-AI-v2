import React, { useState, useEffect } from "react";
import { PriorityBill } from "../types";
import { formatCurrency } from "../utils/currency";
import { 
  MessageSquare,
  Settings,
  Wifi,
  Send,
  Check,
  Copy,
  Share2,
  ExternalLink,
  BookOpen,
  Terminal,
  Activity
} from "lucide-react";

interface WhatsAppTabProps {
  bills: PriorityBill[];
}

export default function WhatsAppTab({ bills }: WhatsAppTabProps) {
  // WhatsApp Integration Tool states
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(true); // default open on dedicated tab for great visibility
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
  const [twilioSid, setTwilioSid] = useState(() => sessionStorage.getItem("ws_twilio_sid") || "");
  const [twilioToken, setTwilioToken] = useState(() => sessionStorage.getItem("ws_twilio_token") || "");
  const [twilioFrom, setTwilioFrom] = useState(() => localStorage.getItem("ws_twilio_from") || "whatsapp:+14155238886");
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem("ws_webhook_url") || "https://api.exemplo.com/whatsapp-webhook");
  const [webhookToken, setWebhookToken] = useState(() => sessionStorage.getItem("ws_webhook_token") || "");
  
  // Test alerts states
  const [isTesting, setIsTesting] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveStatusMsg, setSaveStatusMsg] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ws_phone", phoneNumber);
    localStorage.setItem("ws_type", integrationType);
    sessionStorage.setItem("ws_twilio_sid", twilioSid);
    sessionStorage.setItem("ws_twilio_token", twilioToken);
    localStorage.setItem("ws_twilio_from", twilioFrom);
    localStorage.setItem("ws_webhook_url", webhookUrl);
    sessionStorage.setItem("ws_webhook_token", webhookToken);
    
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
      activePagar.forEach((b) => {
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
            `\n\n_Dica: Para liquidá-las, use o botão 'Liberar & Pagar' no painel principal de priorização de contas._`;
        }
      } else if (cmd === "2" || cmd.includes("saldo") || cmd.includes("caixa") || cmd.includes("previsto")) {
        const activePagar = bills.filter(b => b.status === "PAGAR" && !b.paid).reduce((acc, curr) => acc + curr.amount, 0);
        botResponse = `🏦 *JurisFinance AI Bot:* *Fluxo de Caixa Previsto*\n\n• Desbalanceamento Patrimonial Ativo: Mistura PF/PJ Monitorada\n• Saída Imediata (PAGAR): *${formatCurrency(activePagar)}*\n• Saldo Líquido Operacional do mês atualizado com base nas suas últimas concilações.`;
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

  return (
    <div id="whatsapp-tab-view" className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-l-4 border-emerald-600 pl-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Módulo de WhatsApp & Alertas Ativos</h2>
          <p className="text-xs text-slate-500">Envie relatórios para o seu bolso ou configure um robô de respostas automáticas no celular</p>
        </div>
      </div>

      {/* WHATSAPP INTEGRATION & ALERTS PANEL CENTER */}
      <div id="whatsapp-integration-section" className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-2xs space-y-0 font-sans">
        {/* Banner header */}
        <div className="bg-[#128c7e] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-lg border border-white/25">
              <MessageSquare className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display leading-tight">INTEGRAÇÃO DE COMUNICAÇÃO</h3>
              <p className="text-[10px] text-emerald-100 font-medium">Configure as APIs de outbound ou rode a simulação do robô interativo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setConfigOpen(!configOpen); if (!configOpen) { setChatOpen(false); setGuideOpen(false); } }}
              className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider text-white border transition-all cursor-pointer ${
                configOpen ? "bg-[#075e54] border-emerald-950 shadow-inner" : "bg-white/10 hover:bg-white/20 border-white/15"
              }`}
            >
              <Settings className="w-3.5 h-3.5 inline mr-1" />
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
              className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider border transition-all cursor-pointer ${
                guideOpen ? "bg-amber-500 border-amber-600 text-white shadow-inner" : "bg-amber-400/20 hover:bg-amber-400/30 border-amber-300/50 text-amber-200"
              }`}
            >
              📖 {guideOpen ? "Fechar Guia" : "Como Fazer?"}
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
                    <h4 className="text-sm font-bold tracking-tight text-slate-800">Parâmetros de Conexão WhatsApp & Outbound Gateway</h4>
                    <p className="text-[10px] text-slate-500">Insira as credenciais do seu serviço Twilio ou Webhook para disparar alertas reais de vencimento</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                  Conexão Simulada Pronta
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
                            ? "bg-emerald-55 text-emerald-700 border-emerald-500 shadow-3xs"
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
                    <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-2xs">
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
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 font-sans">Token ou Bearer Token de Autorização (Opcional)</label>
                        <input
                          type="text"
                          value={webhookToken}
                          onChange={(e) => setWebhookToken(e.target.value)}
                          placeholder="Token de segurança"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                      <div className="border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <p className="text-[10px] font-bold text-slate-700 font-mono text-rose-600">TWILIO CREDENTIALS GATEWAY</p>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 font-sans">Twilio Account SID</label>
                        <input
                          type="text"
                          value={twilioSid}
                          onChange={(e) => setTwilioSid(e.target.value)}
                          placeholder="AC..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 font-sans">Twilio Auth Token</label>
                          <input
                            type="password"
                            value={twilioToken}
                            onChange={(e) => setTwilioToken(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 font-sans">Número de Envio Twilio</label>
                          <input
                            type="text"
                            value={twilioFrom}
                            onChange={(e) => setTwilioFrom(e.target.value)}
                            placeholder="whatsapp:+14155238886"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                          />
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400">Sandbox para testes livres: `whatsapp:+14155238886`.</p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#128c7e] hover:bg-[#075e54] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer select-none"
                    >
                      Salvar Dispositivo
                    </button>
                    {saveStatusMsg && (
                      <span className="text-[10px] text-emerald-600 font-bold self-center animate-pulse">{saveStatusMsg}</span>
                    )}
                  </div>
                </div>
              </form>

              {/* OUTBOUND ALERTS TRIGGER TESTING COMPONENT */}
              <div id="alerts-trigger-testing-zone" className="border-t border-slate-200 pt-5 mt-4">
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-[#128c7e]" />
                      Painel de Controle e Disparo Manual de Teste
                    </h5>
                    <p className="text-[10.5px] text-slate-500 leading-normal max-w-xl">
                      Clica no botão ao lado para montar a lista de despesas em atraso autorizadas para pagamento no fluxo do JurisFinance AI e despachar no telefone cadastrado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestApiAlert}
                    disabled={isTesting}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-[11px] font-bold rounded-lg transition-all border border-slate-950 cursor-pointer select-none"
                  >
                    {isTesting ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Disparando...
                      </>
                    ) : (
                      <>
                        Disparar Alerta Reativo de Teste
                      </>
                    )}
                  </button>
                </div>

                {/* LIVE API TERMINAL LOGS */}
                {apiLogs.length > 0 && (
                  <div className="mt-4 bg-slate-950 rounded-lg p-3 text-[10px] text-slate-200 font-mono shadow-inner border border-slate-800 space-y-1 max-h-40 overflow-y-auto">
                    <div className="border-b border-slate-800 pb-1 mb-1.5 text-[8.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-[#25d366]" />
                        Console Local de Registro de Integração
                      </span>
                      <span className={apiStatus === "success" ? "text-emerald-400 font-extrabold" : apiStatus === "error" ? "text-rose-500 font-extrabold" : "text-amber-500 font-extrabold animate-pulse"}>
                        {apiStatus === "success" ? "SUCESSO" : apiStatus === "error" ? "ERRO" : "TRANSMITINDO..."}
                      </span>
                    </div>
                    {apiLogs.map((log, lIdx) => (
                      <div key={lIdx} className="leading-tight text-emerald-400/90 hover:text-emerald-300">
                        <span className="text-slate-600 mr-2 select-none">[{lIdx + 1}]</span>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GUIDELINES TUTORIAL MANUAL TAB */}
        {guideOpen && (
          <div id="technical-integration-guide" className="p-6 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-sans leading-relaxed">
            <div className="max-w-4xl mx-auto space-y-5">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-200 pb-2">
                <BookOpen className="w-4 h-4 text-[#128c7e]" />
                Guia Técnico: Como Enviar Alertas & Consultar Despesas via WhatsApp Real
              </h4>
              
              <div className="space-y-3.5">
                <p>
                  Para transformar este sistema financeiro em um robô ativo no WhatsApp do seu celular no dia a dia, você precisará conectar o aplicativo web a uma <b>API Gateway de WhatsApp</b>. Veja abaixo os detalhes práticos de como implementar:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-extrabold text-slate-800 uppercase tracking-wide text-[10.5px]">Opção A: Outbound Alerts (Empurro)</h5>
                    <p className="text-[11px] leading-normal text-slate-500">
                      Dispare relatórios, contas a pagar e avisos automáticos de conciliação de caixa diretamente para o seu celular.
                    </p>
                    <ul className="list-disc pl-4 text-[10.5px] space-y-1 text-slate-500">
                      <li>Use a seção "Configurar API" acima para ligar seu Twilio ou API de Webhook local.</li>
                      <li>Clique em <i>"Disparar Alerta Reativo de Teste"</i> ou <i>"Disparar WhatsApp Web"</i>.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-extrabold text-slate-800 uppercase tracking-wide text-[10.5px]">Opção B: Chatbot Inbound (Consulta)</h5>
                    <p className="text-[11px] leading-normal text-slate-500">
                      Para digitar "Listar despesas" no WhatsApp e receber a listagem instantânea extraída de forma verídica do banco de dados do sistema.
                    </p>
                    <ul className="list-disc pl-4 text-[10.5px] space-y-1 text-slate-500">
                      <li>Configure um endpoint de Webhook público (ex: `/api/whatsapp-webhook`) no seu painel da API de WhatsApp.</li>
                      <li>Incentive o Express a receber o payload do WhatsApp contendo o texto da mensagem via `req.body.message`.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="font-bold text-[10px] uppercase text-slate-400 font-mono">Exemplo básico de Endpoint de Webhook para escuta ativa (Express):</span>
                  <pre className="bg-slate-900 text-emerald-300 font-mono text-[10px] p-3.5 rounded-lg overflow-x-auto leading-normal">{`// Endereço do webhook configurado na API do WhatsApp
app.post('/api/whatsapp-webhook', async (req, res) => {
  const { sender, message } = req.body; // Mensagem digitada pelo usuário no celular

  let responseText = "Comando não reconhecido. Envie '1' para contas pendentes.";
  
  if (message === "1") {
    // Busca do seu banco de dados (Drizzle ORM ou LocalStorage)
    const activePills = await db.select().from(priorityBills).where(eq(priorityBills.status, 'PAGAR'));
    responseText = "*Suas Contas a Pagar Priorizadas:*\\n" + activePills.map(b => \`- \${b.description}: R\$ \${b.amount}\`).join('\\n');
  }

  // Devolve para a API de WhatsApp enviar ao celular
  await sendBackToWhatsAppDevice(sender, responseText);
  return res.json({ success: true });
});`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIMULATED CHATBOT VIEW */}
        {chatOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Shortcuts Panel Guide Column */}
            <div className="lg:col-span-4 p-5 bg-slate-50 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Simulador de Consulta Ativa</h4>
                  <p className="text-[11px] leading-normal text-slate-500">
                    O simulador emula o comportamento prático do robô em funcionamento com base no seu fluxo atual de contas a pagar.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono">Comandos Disponíveis para Teste:</p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendChatMessage("1")}
                      className="text-left w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-[10.5px] text-slate-700 font-semibold transition cursor-pointer flex items-center justify-between"
                    >
                      <span>1️⃣ Listar contas prioritárias a pagar</span>
                      <Send className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendChatMessage("2")}
                      className="text-left w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-[10.5px] text-slate-700 font-semibold transition cursor-pointer flex items-center justify-between"
                    >
                      <span>2️⃣ Visualizar saldo previsto de caixa</span>
                      <Send className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendChatMessage("3")}
                      className="text-left w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-[10.5px] text-slate-700 font-semibold transition cursor-pointer flex items-center justify-between"
                    >
                      <span>3️⃣ Listar despesas em espera</span>
                      <Send className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendChatMessage("4")}
                      className="text-left w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-[10.5px] text-slate-700 font-semibold transition cursor-pointer flex items-center justify-between"
                    >
                      <span>4️⃣ Como conectar celular real</span>
                      <Send className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1 text-[10.5px] font-bold p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Disparar WhatsApp Web
                  </button>
                  <button
                    onClick={handleCopyText}
                    className="flex-shrink-0 p-1.5 px-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-300 transition cursor-pointer text-[10.5px]"
                    title="Copiar relatório formatado em texto para colar no WhatsApp manualmente"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 bg-slate-100 p-2 rounded border border-slate-200 italic leading-snug">
                🤖 O bot acima é reativo! Lançar novas despesas ou marcar como "Liberar" no painel principal ou no livro caixa altera as mensagens dele em tempo real.
              </div>
            </div>

            {/* Simulated Chat Interface Column */}
            <div className="lg:col-span-8 flex flex-col h-full bg-[#f0f2f5] relative min-h-[440px]">
              {/* Chat Header */}
              <div className="bg-[#075e54] text-white px-3.5 py-3 flex items-center justify-between shrink-0 relative z-10 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-emerald-400 p-0.5 flex flex-col items-center justify-center font-bold text-xs text-[#25d366]">
                    🤖
                  </div>
                  <div>
                    <p className="text-xs font-bold font-sans text-white leading-tight">Chatbot JurisFinance AI</p>
                    <p className="text-[8px] text-[#25d366] font-bold uppercase leading-none font-sans animate-pulse">Online • Assistente de Caixa</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <span className="text-[9px] font-mono tracking-wider font-bold bg-[#128c7e] p-1 px-1.5 rounded select-none">SIMULADOR ATIVO</span>
                </div>
              </div>

              {/* Message scroll container */}
              <div className="flex-grow overflow-y-auto p-4 space-y-2 relative z-10 text-xs flex flex-col bg-[#efeae2] bg-opacity-95 h-96">
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
                    <span className="text-[8px] text-slate-400 self-end leading-none font-sans mt-0.5">{msg.time}</span>
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
                  className="p-1.5 bg-[#00a884] hover:bg-emerald-700 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center"
                  title="Enviar"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
