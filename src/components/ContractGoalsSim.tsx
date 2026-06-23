import React, { useState, useEffect } from "react";
import { 
  Target, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  ChevronRight, 
  Briefcase, 
  Edit3, 
  FileText,
  AlertCircle,
  Undo2,
  Check,
  TrendingDown
} from "lucide-react";
import { TransactionScope, TransactionType, Transaction } from "../types";
import { formatCurrency } from "../utils/currency";

export interface LegalProduct {
  id: string;
  name: string;
  price: number;
  closedCount: number; // Contracts finalized/closed this month
  simulatedCount: number; // Potential/simulated signings to test out combinations
}

interface ContractGoalsSimProps {
  currentCollectedRevenue: number; // Total real revenue already closed in selected month
  selectedMonth: string;
  onAddTransaction: (description: string, amount: number, category: string) => void;
}

export const ContractGoalsSim: React.FC<ContractGoalsSimProps> = ({
  currentCollectedRevenue,
  selectedMonth,
  onAddTransaction
}) => {
  // Goal Value
  const [revenueGoal, setRevenueGoal] = useState<number>(8000);
  
  // Custom states for editing goals
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalVal, setTempGoalVal] = useState("8000");

  // Initial juridical products requested by user: Product X (R$ 2.500,00), Product Y (R$ 1.500,00), Product W (R$ 1.000,50-ish / 1.000,00)
  const [products, setProducts] = useState<LegalProduct[]>(() => {
    // Attempt local storage load
    const saved = localStorage.getItem("legal_products_goals_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return [
      { id: "p1", name: "Produto Jurídico X (Assessoria Mensal)", price: 2500, closedCount: 1, simulatedCount: 1 },
      { id: "p2", name: "Produto Jurídico Y (Parecer Jurídico)", price: 1500, closedCount: 1, simulatedCount: 2 },
      { id: "p3", name: "Produto Jurídico W (Ação Inicial)", price: 1000, closedCount: 2, simulatedCount: 1 }
    ];
  });

  // Custom states for creating new legal products
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Saving products to localStorage on updates
  useEffect(() => {
    localStorage.setItem("legal_products_goals_v1", JSON.stringify(products));
  }, [products]);


  // Calculations
  const totalRealClosedRevenue = products.reduce((sum, p) => sum + (p.price * p.closedCount), 0);
  const totalSimulatedRevenue = products.reduce((sum, p) => sum + (p.price * p.simulatedCount), 0);
  const grandTotalRevenue = totalRealClosedRevenue + totalSimulatedRevenue;
  
  // Remaining gap to reach the goal
  const remainingGap = Math.max(0, revenueGoal - totalRealClosedRevenue);
  const simulatedRemainingGap = Math.max(0, revenueGoal - grandTotalRevenue);

  // Percentage calculated on Real finalizations vs Revenue Goal
  const percentRealGoal = revenueGoal > 0 ? (totalRealClosedRevenue / revenueGoal) * 100 : 0;
  // Percentage calculated on Grand Total (Real + Simulated) vs Revenue Goal
  const percentTotalGoal = revenueGoal > 0 ? (grandTotalRevenue / revenueGoal) * 100 : 0;

  // Add a brand new legal product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      setErrorMsg("O nome do produto jurídico é obrigatório.");
      return;
    }
    const priceVal = parseFloat(newProdPrice.replace(",", "."));
    if (isNaN(priceVal) || priceVal <= 0) {
      setErrorMsg("O valor Unitário do serviço contratado deve ser maior que R$ 0,00.");
      return;
    }

    const newProd: LegalProduct = {
      id: "prod-" + Math.random().toString(36).substring(2, 9),
      name: newProdName.trim(),
      price: priceVal,
      closedCount: 0,
      simulatedCount: 1
    };

    setProducts([...products, newProd]);
    setNewProdName("");
    setNewProdPrice("");
    setErrorMsg("");
  };

  // Remove legal product
  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Increment or decrement fields
  const updateProductCounters = (id: string, type: "closed" | "simulated", operation: "add" | "sub") => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        if (type === "closed") {
          const change = operation === "add" ? 1 : -1;
          return { ...p, closedCount: Math.max(0, p.closedCount + change) };
        } else {
          const change = operation === "add" ? 1 : -1;
          return { ...p, simulatedCount: Math.max(0, p.simulatedCount + change) };
        }
      }
      return p;
    }));
  };

  // Update product price or name directly
  const handleUpdateProductInline = (id: string, field: "name" | "price", value: any) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        if (field === "price") {
          const num = parseFloat(value) || 0;
          return { ...p, price: Math.max(0, num) };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Direct conversion of simulated contracts into official cash flow entries!
  const [successConverted, setSuccessConverted] = useState(false);
  const handleConvertSimulatedToLedger = (product: LegalProduct) => {
    if (product.simulatedCount <= 0) return;
    
    // Add transaction to the global ledger
    // description: e.g. "Fechamento de Contrato de Produto Jurídico X (Assessoria)"
    const baseDesc = `Fechamento de Contrato: ${product.name}`;
    const individualAmount = product.price;

    for (let i = 0; i < product.simulatedCount; i++) {
      onAddTransaction(
        `${baseDesc} (${i + 1}/${product.simulatedCount})`,
        individualAmount,
        "Honorários Contratuais"
      );
    }

    // Move count from simulatedCount to closedCount
    setProducts(prev => prev.map(p => {
      if (p.id === product.id) {
        return {
          ...p,
          closedCount: p.closedCount + p.simulatedCount,
          simulatedCount: 0
        };
      }
      return p;
    }));

    setSuccessConverted(true);
    setTimeout(() => setSuccessConverted(false), 4000);
  };

  const handleSaveGoal = () => {
    const val = parseFloat(tempGoalVal) || 0;
    if (val > 0) {
      setRevenueGoal(val);
      setIsEditingGoal(false);
    }
  };

  // Algorithm that calculates recommended exact options to hit the target
  const getGoalCombinations = () => {
    const activeProducts = products.filter(p => p.price > 0);
    if (activeProducts.length === 0 || remainingGap <= 0) return [];

    // Let's find simple mock combinations (like 1 to 4 quantity combinations of products to cover the gap)
    interface Combination {
      items: { product: LegalProduct; qty: number }[];
      totalPrice: number;
    }
    const compsList: Combination[] = [];

    // Try purely single-product paths:
    activeProducts.forEach(p => {
      const quantityToCloseStr = Math.ceil(remainingGap / p.price);
      if (quantityToCloseStr <= 15) {
        compsList.push({
          items: [{ product: p, qty: quantityToCloseStr }],
          totalPrice: p.price * quantityToCloseStr
        });
      }
    });

    // Try dual combos (Product A + Product B):
    if (activeProducts.length > 1) {
      for (let i = 0; i < activeProducts.length; i++) {
        for (let j = i + 1; j < activeProducts.length; j++) {
          const pA = activeProducts[i];
          const pB = activeProducts[j];

          // Simple loops to find first combo that surpasses remaining gap with low quantities
          for (let qA = 1; qA <= 4; qA++) {
            for (let qB = 1; qB <= 4; qB++) {
              const currentTotal = (pA.price * qA) + (pB.price * qB);
              if (currentTotal >= remainingGap && currentTotal <= remainingGap + pA.price) {
                compsList.push({
                  items: [
                    { product: pA, qty: qA },
                    { product: pB, qty: qB }
                  ],
                  totalPrice: currentTotal
                });
                break;
              }
            }
          }
        }
      }
    }

    return compsList.slice(0, 3); // Return best 3 combinations
  };

  const recommendedCombinations = getGoalCombinations();

  return (
    <div id="contract-goals-sim-root" className="space-y-6">
      
      {/* Dynamic Summary Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Revenue Target configuration and Visual Indicator progress */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/55 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-5 relative z-10 w-full">
            {/* Header / Meta setup */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest font-mono">Meta de Faturamento</h3>
                  <p className="text-xs text-slate-500">Planejamento de Assinaturas</p>
                </div>
              </div>

              {!isEditingGoal ? (
                <button
                  type="button"
                  onClick={() => {
                    setTempGoalVal(revenueGoal.toString());
                    setIsEditingGoal(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                  title="Editar Valor da Meta"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSaveGoal}
                    className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase transition"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="p-1 px-2 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase hover:bg-slate-200"
                  >
                    X
                  </button>
                </div>
              )}
            </div>

            {/* Goal value representation */}
            <div>
              {isEditingGoal ? (
                <div className="space-y-1 my-1">
                  <label htmlFor="input-revenue-goal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Meta Financeira Bruta (R$):</label>
                  <input
                    id="input-revenue-goal"
                    type="number"
                    value={tempGoalVal}
                    onChange={(e) => setTempGoalVal(e.target.value)}
                    className="w-full text-xl font-bold font-mono border border-slate-300 p-1.5 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-black font-display tracking-tight text-slate-900 leading-none">
                    {formatCurrency(revenueGoal)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono mt-1">Faturamento Objetivo Almejado</p>
                </div>
              )}
            </div>

            {/* Presets Row to click */}
            <div className="flex items-center gap-1.5 pt-1">
              {[5000, 8000, 12000, 15000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRevenueGoal(preset);
                    setTempGoalVal(preset.toString());
                  }}
                  className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-md border tracking-wider transition ${
                    revenueGoal === preset 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" 
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset / 1000}k
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100/80 pt-4 space-y-4">
              {/* Real finalizations progress bar block */}
              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1">
                  <span>Fechados Reais ({percentRealGoal.toFixed(0)}%)</span>
                  <span className="font-bold text-emerald-600 font-mono">{formatCurrency(totalRealClosedRevenue)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-505"
                    style={{ width: `${Math.min(100, percentRealGoal)}%` }}
                  />
                </div>
              </div>

              {/* Total simulated progress bar block */}
              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1">
                  <span>Incluindo Simulados (Total: {percentTotalGoal.toFixed(0)}%)</span>
                  <span className="font-bold text-indigo-500 font-mono">{formatCurrency(grandTotalRevenue)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                  {/* Real contribution */}
                  <div
                    className="bg-emerald-500 h-full absolute left-0 top-0 transition-all duration-505"
                    style={{ width: `${Math.min(100, percentRealGoal)}%` }}
                  />
                  {/* Simulated contribution overlay */}
                  <div
                    className="bg-indigo-400/85 h-full absolute top-0 transition-all duration-505"
                    style={{ 
                      left: `${Math.min(100, percentRealGoal)}%`, 
                      width: `${Math.min(100 - percentRealGoal, Math.max(0, percentTotalGoal - percentRealGoal))}%` 
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Reais</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-400"></span> Simulados</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100/80">
            {remainingGap <= 0 ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-2 items-start">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Parabéns!</p>
                  <p className="text-[11px] text-emerald-700">Sua meta foi alcançada ou superada exclusivamente com contratos finalizados!</p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/40 border border-amber-100/60 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Falta para Atentar a Meta:</p>
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">{formatCurrency(remainingGap)}</p>
                {simulatedRemainingGap > 0 ? (
                  <p className="text-[11px] text-slate-500 mt-1">E se fechar os simulados, ainda faltarão <span className="font-semibold text-indigo-600">{formatCurrency(simulatedRemainingGap)}</span>.</p>
                ) : (
                  <p className="text-[11px] text-[#2563eb] font-semibold mt-1">🎉 Com os simulados, sua meta é totalmente batida!</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Products Grid and Quick Actions */}
        <div className="lg:col-span-8 space-y-5 flex flex-col justify-between">
          
          {/* Service Pricing & Contract Pipeline Setup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-900">Configurador de Produtos e Contratos</h3>
                  <p className="text-xs text-slate-500">Defina o portfólio disponível de serviços jurídicos e acompanhe fechamentos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-[11px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full font-mono">
                <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                <span>Simulador Inteligente</span>
              </div>
            </div>

            {/* List of Products (X, Y, W and others) */}
            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {products.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Nenhum produto cadastrado</p>
                  <p className="text-[11px] text-slate-500 mt-1">Adicione produtos jurídicos utilizando a seção abaixo para iniciar!</p>
                </div>
              ) : (
                products.map((item) => {
                  const subtotalReal = item.price * item.closedCount;
                  const subtotalSim = item.price * item.simulatedCount;

                  return (
                    <div 
                      key={item.id} 
                      className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Name & Unit Price */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateProductInline(item.id, "name", e.target.value)}
                            className="bg-transparent hover:bg-white focus:bg-white font-bold text-slate-800 text-xs border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-hidden p-1 rounded transition w-full max-w-sm"
                            title="Clique para editar o nome"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Preço Sugerido (R$):</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdateProductInline(item.id, "price", e.target.value)}
                            className="bg-transparent hover:bg-white focus:bg-white text-slate-700 font-semibold font-mono text-[11px] border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-hidden px-1 rounded transition w-24 h-5"
                            title="Clique para editar o preço unitário"
                          />
                        </div>
                      </div>

                      {/* Controls Counter column */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 md:border-l md:border-slate-200 md:pl-4">
                        
                        {/* Finalizado Counter */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Efetivos (Fechados):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateProductCounters(item.id, "closed", "sub")}
                              className="w-5 h-5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-slate-800 w-5 text-center text-xs">{item.closedCount}</span>
                            <button
                              type="button"
                              onClick={() => updateProductCounters(item.id, "closed", "add")}
                              className="w-5 h-5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 cursor-pointer text-xs"
                            >
                              +
                            </button>
                            <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 p-1 py-0.5 rounded ml-1" title="Subtotal Real faturado com este item">
                              {formatCurrency(subtotalReal)}
                            </span>
                          </div>
                        </div>

                        {/* Potencial / Simulador Counter */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Prospecção (Simulada):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateProductCounters(item.id, "simulated", "sub")}
                              className="w-5 h-5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-indigo-600 w-5 text-center text-xs">{item.simulatedCount}</span>
                            <button
                              type="button"
                              onClick={() => updateProductCounters(item.id, "simulated", "add")}
                              className="w-5 h-5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 cursor-pointer text-xs"
                            >
                              +
                            </button>
                            <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 p-1 py-0.5 rounded ml-1" title="Subtotal projetado com este item">
                              {formatCurrency(subtotalSim)}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Quick action: Convert Simulated Count to real Revenues */}
                      <div className="flex items-center gap-1 shrink-0">
                        {item.simulatedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleConvertSimulatedToLedger(item)}
                            className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shrink-0"
                            title="Lançar contratos simulados como fechados no Livro Caixa!"
                          >
                            <Check className="w-3 h-3 text-indigo-600" />
                            <span>Efetivar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50/50 cursor-pointer transition ml-1"
                          title="Remover produto da lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Inline add product service formulation */}
            <form onSubmit={handleAddProduct} className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              <div className="md:col-span-5 space-y-1">
                <label htmlFor="new-prod-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Nome do Novo Produto/Serviço:</label>
                <input
                  id="new-prod-name"
                  type="text"
                  placeholder="Ex: Recursos de Apelação"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label htmlFor="new-prod-price" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Preço Unitário (R$):</label>
                <input
                  id="new-prod-price"
                  type="text"
                  placeholder="Ex: 2000"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-semibold text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer h-[33px]"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Cadastrar
                </button>
              </div>
            </form>

            {errorMsg && (
              <p className="text-[10px] text-rose-500 font-semibold italic text-center">⚠️ {errorMsg}</p>
            )}

            {successConverted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center text-xs font-semibold text-emerald-800 animate-pulse">
                🎉 Contratos simulados lançados com total sucesso como receitas oficiais no Livro Caixa!
              </div>
            )}
          </div>

          {/* LOWER OPTIMIZER TIP BOARD: "Como alcançar seu objetivo?" */}
          {remainingGap > 0 ? (
            <div className="bg-indigo-900 text-white rounded-2xl p-5 border border-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-1.5 relative z-10 flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#a78bfa] animate-pulse" />
                  <p className="text-xs uppercase font-extrabold text-[#c084fc] font-mono tracking-widest">Opções Recomendadas para Bater Meta</p>
                </div>
                <p className="text-xs text-indigo-200">
                  Para cobrir o gap remanescente de <span className="font-bold text-white font-mono">{formatCurrency(remainingGap)}</span>, você pode focar nas seguintes conversões de vendas sugeridas:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
                  {recommendedCombinations.length > 0 ? (
                    recommendedCombinations.map((combo, idx) => (
                      <div key={idx} className="bg-indigo-950/70 border border-indigo-800/60 p-2.5 rounded-lg text-left text-[11px] space-y-1 hover:border-indigo-600 transition">
                        <p className="font-bold text-indigo-300 uppercase text-[10px]">Sugestão {idx + 1}</p>
                        <div className="space-y-0.5 text-slate-100">
                          {combo.items.map((it, cIdx) => (
                            <p key={cIdx}>• <b>{it.qty}x</b> {it.product.name.split(" ")[0]} ({formatCurrency(it.product.price)})</p>
                          ))}
                        </div>
                        <p className="text-[10px] text-emerald-400 font-bold font-mono border-t border-indigo-900/80 pt-1 mt-1">Total: {formatCurrency(combo.totalPrice)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-indigo-300 italic">Preencha valores maiores de contratos ou diminua a meta para gerar sugestões de fechamento.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-900 flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden">
              <div className="space-y-1 flex-grow">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <p className="text-sm font-bold">Excelente Governança Comercial!</p>
                </div>
                <p className="text-xs text-emerald-300 leading-relaxed">
                  Sua equipe jurídica fechou um total de <span className="font-bold text-white font-mono">{formatCurrency(totalRealClosedRevenue)}</span> em contratos efetivos, o que atende 100% de sua meta estabelecida para este mês.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
