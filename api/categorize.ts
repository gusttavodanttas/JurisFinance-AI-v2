import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Category definition strings to send to Gemini
const categoriesRef = `
AS CATEGORIAS DISPONÍVEIS SÃO LIMITADAS A ESTAS ABAIXO. VOCÊ DEVE MAPEAR CADA TRANSAÇÃO EXATAMENTE PARA UMA DESSAS CATEGORIAS:

1. ESCOPO: PROFESSIONAL, TIPO: REVENUE (Receitas do Escritório):
   - "Honorários Contratuais" (Ex: recebimento de clientes, assessoria mensal)
   - "Honorários de Sucumbência" (Ex: honorários ganhos em Sentença/Acórdão judicial)
   - "Consultoria e Pareceres" (Ex: consultas avulsas, parecer técnico)
   - "Acordo Extrajudicial/Judicial" (Ex: valores recebidos em acordos)
   - "Reembolso de Custas" (Ex: reembolso que o cliente faz de custas que o escritório adiantou)
   - "Outras Receitas Profissionais" (Qualquer outra receita do negócio)

2. ESCOPO: PROFESSIONAL, TIPO: EXPENSE (Despesas do Escritório):
   - "Aluguel e Condomínio do Escritório" (Ex: aluguel de sala comercial, condomínio, IPTU comercial)
   - "Custas Processuais e Diligências" (Ex: custas pagas ao Tribunal, correspondentes, diligências de processos)
   - "Equipe, Associados e Pró-labore" (Ex: salários de estagiários, secretárias, pagamentos de advogados parceiros, retiradas formais)
   - "Sistemas Judiciais e Softwares (LegalTech)" (Ex: assinatura do Astrea, Jusbrasil, Projuris, assinatura eletrônica)
   - "Anuidade OAB e Serviços" (Ex: anuidade OAB, emissão de certificado digital, taxas da associação)
   - "Marketing e Divulgação" (Ex: anúncios Google Ads, redes sociais, cartão de visitas, site profissional)
   - "Material de Escritório, Internet e Luz" (Ex: contas de luz, internet comercial, papel, canetas, café)
   - "Viagens e Hospedagens de Trabalho" (Ex: Uber para o tribunal, hotel em audiência em outra cidade)
   - "Impostos (Simples Nacional/Carnê-Leão)" (Ex: impostos federais, municipais do escritório ou carnê do titular)
   - "Outras Despesas Profissionais" (Demais taxas ou compras estritamente profissionais)

3. ESCOPO: PERSONAL, TIPO: REVENUE (Receitas Pessoais):
   - "Retirada de Pró-labore/Lucros" (Ex: transferências recebidas do escritório na conta pessoal do sócio)
   - "Rendimentos e Investimentos" (Ex: dividendos de ações, juros de poupança, aluguéis pessoais)
   - "Outras Receitas Pessoais" (Qualquer outra renda estritamente pessoal)

4. ESCOPO: PERSONAL, TIPO: EXPENSE (Despesas Pessoais):
   - "Alimentação e Supermercados" (Ex: compras de supermercado pessoal, restaurantes aos fins de semana, Ifood de casa)
   - "Moradia (Luz, Água, Aluguel Pessoal)" (Ex: aluguel da residência, luz de casa, condomínio residencial, gás)
   - "Transporte e Veículo Particular" (Ex: combustível do carro pessoal, IPVA particular, seguro auto de casa)
   - "Saúde e Plano de Saúde" (Ex: farmácia particular, plano de saúde pessoal, consultas médicas de rotina)
   - "Lazer, Viagens e Hobbies" (Ex: cinema, viagens de férias, jantares de lazer, jogos)
   - "Educação e Livros" (Ex: faculdade dos filhos, cursos pós-graduação pessoal, livros gerais)
   - "Vestuário e Gastos Pessoais" (Ex: roupas de lazer, salão de beleza, barbearia, presentes)
   - "Outras Despesas Pessoais" (Qualquer gasto doméstico sem relação com o escritório)
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rawText, customDate } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Texto bruto de entrada é obrigatório." });
    }

    // Capture the contextual date to fallback on (such as today)
    const fallbackDate = customDate || new Date().toISOString().split("T")[0];

    const systemInstruction = `Você é um Analista Financeiro Sênior e Inteligência de Organização que trabalha para um escritório de Advocacia no Brasil.
Seu trabalho é pegar linhas brutas de extratos bancários, recibos ou anotações por escrito de movimentações financeiras pessoais e profissionais e:
1. Identificar se a transação é uma RECEITA (REVENUE) ou DESPESA (EXPENSE).
2. Classificar o escopo da transação de forma inteligente e precisa:
   - "PROFESSIONAL": Se refere ao escritório de advocacia, processos judiciais, taxas ou despesas de funcionamento do negócio judicial.
   - "PERSONAL": Se refere à vida pessoal, familiar, de consumo doméstico ou gastos de casa do advogado fundador ou de seus sócios.
3. Classificar na categoria exata apropriada a partir das categorias oficiais fornecidas.
4. Identificar o valor numérico exato ("amount", positivo, sem sinal negativo).
5. Extrair ou estimar a data ("date") no formato YYYY-MM-DD. Se a data estiver ausente ou incompleta (como 12/Jun), combine com o ano corrente (2026, com base no horário de execução padrão) de forma inteligente. Se nada for indicado, use "${fallbackDate}".
6. Limpar e resumir o campo "description" de forma bonita e profissional (Ex: de "PAGTO ALUGUEL SALA 402 LTDA-ME" para "Aluguel Sala 402").
7. Fornecer de forma objetiva um nível de confiança da sua decisão (0 a 105) e uma justificativa ("reason") em português explicando a lógica empregada (Ex: "Identificado como despesa de escritório devido ao pagamento de software jurídico").
8. Identificar o Grupo de Prioridade ("groupType") apropriado para as despesas (EXPENSE) do escritório ou pessoais:
   - "G1" (Essencial/Sobrevivência): Custas processuais/diligências urgentes, Aluguel e escritório, equipe/pró-labore, luz/internet, e todas as receitas (REVENUE).
   - "G2" (Importante/Sistemas): Softwares Jurídicos/assinaturas digitais, anuidade OAB.
   - "G3" (Contornável/Impostos): Impostos, marketing, divulgação, material de papelaria geral.
   - "WAIT" (Postergável/Aguardar): Compras que podem esperar, lazer, jantares opcionais, etc.

Instruções críticas de escrutínio para Advogados:
- É comum advogados "misturarem" cartões e fazerem pagamentos pessoais com a conta do escritório. Caso encontre coisas como "Ifood", "Supermercado Zaffari", "Escola de música", "Petshop", classifique rigorosamente como PERSONAL e EXPENSE, mesmo se vier de um extrato da conta do escritório! Isso será usado para medir a mistura patrimonial do escritório.
- Processos Judiciais: Movimentações contendo termos como "Custas Judiciais", "Diligência Oficial", "OAB", "Protocolo de Recurso", "Sucumbência" ou números de Processo são estritamente PROFESSIONAL.
- Se houver mais de uma transação no texto bruto (por exemplo, múltiplas linhas de extrato copiadas), extraia e retorne TODAS elas individualmente no array de retorno.`;

    const prompt = `Analise e organize o seguinte bloco de movimentações financeiras:
"""
${rawText}
"""

${categoriesRef}

Você DEVE retornar a resposta no formato JSON estruturado com o seguinte formato de Schema:
Exemplo de array contendo as transações encontradas processadas. Se apenas houver 1 transação, retorne um array de tamanho 1.`;

    // Modern SDK structured JSON schema call
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Low temperature for predictable category mappings
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Lista de transações financeiras analisadas e categorizadas separando o pessoal do profissional.",
          items: {
            type: Type.OBJECT,
            properties: {
              date: {
                type: Type.STRING,
                description: "Data estimada da transação no formato YYYY-MM-DD",
              },
              description: {
                type: Type.STRING,
                description: "Descrição simplificada e limpa para exibição fácil no livro caixa",
              },
              type: {
                type: Type.STRING,
                description: "Classificação: REVENUE para receita/ganhos ou EXPENSE para despesa/gastos",
              },
              scope: {
                type: Type.STRING,
                description: "Escopo: PROFESSIONAL para despesas/receitas do escritório ou PERSONAL para gastos/receitas de cunho particular/doméstico do advogado",
              },
              category: {
                type: Type.STRING,
                description: "A categoria correspondente a essa transação. Deve corresponder EXATAMENTE a uma das permitidas listadas.",
              },
              amount: {
                type: Type.NUMBER,
                description: "Valor financeiro decimal absoluto (positivo)",
              },
              confidence: {
                type: Type.INTEGER,
                description: "Percentual de certeza da categorização (0 a 100)",
              },
              reason: {
                type: Type.STRING,
                description: "Raciocínio resumido da separação que justifica o escopo escolhido",
              },
              groupType: {
                type: Type.STRING,
                description: "Grupo de Prioridade sugerido (G1: Essencial, G2: Importante/Sistemas, G3: Contornável/Impostos, WAIT: Esperar/Reter/Postergável)",
              },
            },
            required: ["date", "description", "type", "scope", "category", "amount", "confidence", "reason", "groupType"],
          },
        },
      },
    });

    const parsedResponse = JSON.parse(response.text?.trim() || "[]");
    return res.status(200).json(parsedResponse);
  } catch (error: any) {
    console.error("Erro na API de categorização:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao processar as transações financeiras com inteligência artificial.",
      details: error.message || String(error),
    });
  }
}
