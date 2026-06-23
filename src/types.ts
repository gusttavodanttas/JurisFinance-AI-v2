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
  status?: "PREVISTO" | "REALIZADO";
  reconciled?: boolean;
  clientName?: string;
  recurring?: boolean;       // auto-generate next occurrence on confirm
  recurringGroupId?: string; // groups installments/recurrences together
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string; // YYYY-MM-DD
}

export interface CourtCost {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  processNumber?: string;
  clientName?: string;
  reimbursed: boolean;
  reimbursedDate?: string;
  notes?: string;
}

export interface PriorityBill {
  id: string;
  description: string;
  amount: number;
  scope: TransactionScope;
  status: "PAGAR" | "ESPERAR";
  groupType: string;
  paid?: boolean;
  notes?: string;
  month?: string; // YYYY-MM selected month
  category?: string; // AI categorized or manual category
  dueDay?: number; // Day of month for due date (1–31)
  paymentMethod?: string; // e.g. Pix, Boleto, Débito Automático
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
  "Carro",
  "Cavalo",
  "Outras Despesas Pessoais",
];

const getCustomCategories = (key: string, defaults: string[]): string[] => {
  try {
    const gdEmail = sessionStorage.getItem("gd_auth_email") || "default";
    const saved = localStorage.getItem(`custom_categories_${gdEmail}_${key}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return Array.from(new Set([...defaults, ...parsed]));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return defaults;
};

export const ALL_CATEGORIES_MAP: Record<string, string[]> = {
  get [`${TransactionScope.PROFESSIONAL}_${TransactionType.REVENUE}`]() {
    return getCustomCategories(`${TransactionScope.PROFESSIONAL}_${TransactionType.REVENUE}`, PROFESSIONAL_REVENUE_CATEGORIES);
  },
  get [`${TransactionScope.PROFESSIONAL}_${TransactionType.EXPENSE}`]() {
    return getCustomCategories(`${TransactionScope.PROFESSIONAL}_${TransactionType.EXPENSE}`, PROFESSIONAL_EXPENSE_CATEGORIES);
  },
  get [`${TransactionScope.PERSONAL}_${TransactionType.REVENUE}`]() {
    return getCustomCategories(`${TransactionScope.PERSONAL}_${TransactionType.REVENUE}`, PERSONAL_REVENUE_CATEGORIES);
  },
  get [`${TransactionScope.PERSONAL}_${TransactionType.EXPENSE}`]() {
    return getCustomCategories(`${TransactionScope.PERSONAL}_${TransactionType.EXPENSE}`, PERSONAL_EXPENSE_CATEGORIES);
  }
};

export const addCustomCategory = (scope: TransactionScope, type: TransactionType, categoryName: string) => {
  try {
    const gdEmail = sessionStorage.getItem("gd_auth_email") || "default";
    const key = `${scope}_${type}`;
    const saved = localStorage.getItem(`custom_categories_${gdEmail}_${key}`);
    const currentCustom = saved ? JSON.parse(saved) : [];
    if (!currentCustom.includes(categoryName)) {
      currentCustom.push(categoryName);
      localStorage.setItem(`custom_categories_${gdEmail}_${key}`, JSON.stringify(currentCustom));
      window.dispatchEvent(new Event("categories_updated"));
    }
  } catch (e) {
    console.error(e);
  }
};

export const deleteCustomCategory = (scope: TransactionScope, type: TransactionType, categoryName: string) => {
  try {
    const gdEmail = sessionStorage.getItem("gd_auth_email") || "default";
    const key = `${scope}_${type}`;
    const saved = localStorage.getItem(`custom_categories_${gdEmail}_${key}`);
    if (saved) {
      let currentCustom = JSON.parse(saved);
      if (Array.isArray(currentCustom)) {
        currentCustom = currentCustom.filter(c => c !== categoryName);
        localStorage.setItem(`custom_categories_${gdEmail}_${key}`, JSON.stringify(currentCustom));
        window.dispatchEvent(new Event("categories_updated"));
      }
    }
  } catch (e) {
    console.error(e);
  }
};
