export enum TransactionScope {
  PROFESSIONAL = "PROFESSIONAL",
  PERSONAL = "PERSONAL",
}

export enum TransactionType {
  REVENUE = "REVENUE", // Receita
  EXPENSE = "EXPENSE", // Despesa
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: TransactionType;
  scope: TransactionScope;
  category: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  isAiCategorized?: boolean;
}

export interface PriorityBill {
  id: string;
  description: string;
  amount: number;
  scope: TransactionScope;
  status: "PAGAR" | "ESPERAR";
  groupType: "G1" | "G2" | "G3" | "WAIT";
  paid?: boolean;
  notes?: string;
  month?: string; // YYYY-MM selected month
  category?: string; // AI categorized or manual category
}

export interface AISeparationPreview {
  date: string;
  description: string;
  type: TransactionType;
  scope: TransactionScope;
  category: string;
  amount: number;
  confidence: number; // 0-100
  reason: string;
}

export interface CashFlowReport {
  month: string; // "YYYY-MM"
  profRevenue: number;
  profExpense: number;
  profNet: number;
  persRevenue: number;
  persExpense: number;
  persNet: number;
  mixingIndex: number; // Percentage of Personal transactions inside professional accounts/sources
}

export const PROFESSIONAL_REVENUE_CATEGORIES = [
  "Honorários Contratuais",
  "Honorários de Sucumbência",
  "Consultoria e Pareceres",
  "Acordo Extrajudicial/Judicial",
  "Reembolso de Custas",
  "Outras Receitas Profissionais",
];

export const PROFESSIONAL_EXPENSE_CATEGORIES = [
  "Aluguel e Condomínio do Escritório",
  "Custas Processuais e Diligências",
  "Equipe, Associados e Pró-labore",
  "Sistemas Judiciais e Softwares (LegalTech)",
  "Anuidade OAB e Serviços",
  "Marketing e Divulgação",
  "Material de Escritório, Internet e Luz",
  "Viagens e Hospedagens de Trabalho",
  "Impostos (Simples Nacional/Carnê-Leão)",
  "Outras Despesas Profissionais",
];

export const PERSONAL_REVENUE_CATEGORIES = [
  "Retirada de Pró-labore/Lucros",
  "Rendimentos e Investimentos",
  "Outras Receitas Pessoais",
];

export const PERSONAL_EXPENSE_CATEGORIES = [
  "Alimentação e Supermercados",
  "Moradia (Luz, Água, Aluguel Pessoal)",
  "Transporte e Veículo Particular",
  "Saúde e Plano de Saúde",
  "Lazer, Viagens e Hobbies",
  "Educação e Livros",
  "Vestuário e Gastos Pessoais",
  "Outras Despesas Pessoais",
];

export const ALL_CATEGORIES_MAP: Record<string, string[]> = {
  [`${TransactionScope.PROFESSIONAL}_${TransactionType.REVENUE}`]: PROFESSIONAL_REVENUE_CATEGORIES,
  [`${TransactionScope.PROFESSIONAL}_${TransactionType.EXPENSE}`]: PROFESSIONAL_EXPENSE_CATEGORIES,
  [`${TransactionScope.PERSONAL}_${TransactionType.REVENUE}`]: PERSONAL_REVENUE_CATEGORIES,
  [`${TransactionScope.PERSONAL}_${TransactionType.EXPENSE}`]: PERSONAL_EXPENSE_CATEGORIES,
};
