import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, type, twilioSid, twilioToken, twilioFrom, webhookUrl, webhookToken, message } = req.body;

    const logs: string[] = [];
    logs.push("Iniciando processamento no servidor backend JurisFinance AI...");
    logs.push(`Data/Hora local: ${new Date().toLocaleString("pt-BR")}`);
    logs.push(`Destinatário: ${phone || "Não informado"}`);
    logs.push(`Gateway ativo: ${type === "twilio" ? "Twilio WhatsApp API" : "Webhook Customizado/Z-API"}`);

    if (type === "webhook") {
      if (!webhookUrl) {
        logs.push("❌ Erro: URL do webhook de destino está vazia ou inválida.");
        res.status(400).json({ success: false, logs });
        return;
      }
      logs.push(`Efetuando chamada de rede via POST HTTPS para: ${webhookUrl}`);
      
      const payload = {
        to: phone,
        message: message,
        timestamp: new Date().toISOString()
      };
      
      logs.push("Formatando cabeçalhos HTTP (Application/JSON)...");
      
      try {
        const start = Date.now();
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(webhookToken ? { "Authorization": webhookToken.startsWith("Bearer") ? webhookToken : `Bearer ${webhookToken}` } : {})
          },
          body: JSON.stringify(payload)
        });
        
        const responseText = await response.text();
        const latency = Date.now() - start;
        logs.push(`Resposta recebida em ${latency}ms`);
        logs.push(`Status Code retornado: ${response.status} ${response.statusText}`);
        logs.push(`Retorno bruto: ${responseText.substring(0, 300) || "(vazio)"}`);
        
        if (response.ok) {
          logs.push("✅ Webhook respondido com sucesso (Códigos 2xx)!");
          res.json({ success: true, logs });
        } else {
          logs.push(`❌ O servidor remoto de Webhook retornou status de falha.`);
          res.json({ success: false, logs });
        }
      } catch (err: any) {
        logs.push(`❌ Falha de Conectividade HTTP: ${err.message}`);
        res.json({ success: false, logs });
      }
    } else {
      // Twilio Flow
      if (!twilioSid || !twilioToken) {
        logs.push("❌ Erro: Credenciais do Twilio (Account SID e/ou Auth Token) vazias.");
        res.status(400).json({ success: false, logs });
        return;
      }
      
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const cleanFrom = twilioFrom || "whatsapp:+14155238886";
      const cleanTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
      
      logs.push(`Autenticação Básica montada para o SID: ${twilioSid.substring(0, 6)}...`);
      logs.push(`De: ${cleanFrom} | Para: ${cleanTo}`);
      
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      
      const params = new URLSearchParams();
      params.append("From", cleanFrom);
      params.append("To", cleanTo);
      params.append("Body", message);
      
      try {
        const start = Date.now();
        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: params.toString()
        });
        
        const responseText = await response.text();
        const latency = Date.now() - start;
        logs.push(`Parceiro Twilio respondeu em ${latency}ms`);
        logs.push(`Status Code retornado: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          logs.push("✅ Mensagem enfileirada no gateway Twilio com SUCESSO!");
          res.json({ success: true, logs });
        } else {
          logs.push(`❌ Twilio rejeitou a requisição. Retorno do erro: ${responseText.substring(0, 300)}`);
          res.json({ success: false, logs });
        }
      } catch (err: any) {
        logs.push(`❌ Erro ao disparar chamada de rede com API Twilio: ${err.message}`);
        res.json({ success: false, logs });
      }
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      logs: ["❌ Erro interno do servidor:", error.message || String(error)]
    });
  }
}
