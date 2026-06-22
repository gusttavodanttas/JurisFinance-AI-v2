import React, { useState } from "react";
import { getFirestoreUser, createFirestoreUser, FirestoreUser } from "../lib/usersDb";
import { 
  Scale, 
  Eye, 
  EyeOff, 
  LogIn, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  BookOpen, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface LoginPageProps {
  onLogin: (name?: string, oab?: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration fields
  const [name, setName] = useState("");
  const [oab, setOab] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setSuccess("");

    if (!email) {
      setErr("Por favor, preencha o e-mail.");
      return;
    }
    if (!password) {
      setErr("Por favor, preencha a senha.");
      return;
    }

    setLoading(true);

    // Preconfigured developer account
    const defaultEmail = "gustavodantas.advogados@gmail.com";
    const defaultPw = "GD2026";
    const defaultName = "Dr. Gustavo Dantas";
    const defaultOab = "OAB/SP 123.456";

    try {
      if (authMode === "login") {
        // 1. Check if matches preconfigured developer account
        if (
          email.toLowerCase().trim() === defaultEmail.toLowerCase().trim() &&
          password === defaultPw
        ) {
          sessionStorage.setItem("gd_auth", "true");
          sessionStorage.setItem("gd_auth_email", defaultEmail);
          onLogin(defaultName, defaultOab);
          setSuccess("Bem-vindo de volta, Dr. Gustavo!");
          setLoading(false);
          return;
        }

        // 2. Otherwise search in cloud database
        const userInFirestore = await getFirestoreUser(email);
        if (userInFirestore) {
          if (userInFirestore.password === password) {
            sessionStorage.setItem("gd_auth", "true");
            sessionStorage.setItem("gd_auth_email", userInFirestore.email);
            onLogin(userInFirestore.name, userInFirestore.oab);
            setSuccess(`Bem-vindo de volta, ${userInFirestore.name}!`);
          } else {
            setErr("Senha inválida para este e-mail.");
          }
        } else {
          // 3. Fallback check local storage
          const savedUsers = localStorage.getItem("oab_registered_users");
          const registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
          const matchedLocalUser = registeredUsers.find(
            (u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim() && u.password === password
          );

          if (matchedLocalUser) {
            // Migrating matching user to Firestore automatically for better cloud experience
            await createFirestoreUser({
              name: matchedLocalUser.name,
              oab: matchedLocalUser.oab,
              email: matchedLocalUser.email,
              password: matchedLocalUser.password
            });

            sessionStorage.setItem("gd_auth", "true");
            sessionStorage.setItem("gd_auth_email", matchedLocalUser.email);
            onLogin(matchedLocalUser.name, matchedLocalUser.oab);
            setSuccess(`Sincronizado na Nuvem! Bem-vindo, ${matchedLocalUser.name}!`);
          } else {
            setErr("Este e-mail não foi cadastrado no Banco de Dados.");
          }
        }
      } else {
        // Registration flow
        if (!name) {
          setErr("Por favor, preencha o seu nome completo.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErr("As senhas não coincidem.");
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setErr("A senha deve conter pelo menos 4 caracteres.");
          setLoading(false);
          return;
        }

        if (email.toLowerCase().trim() === defaultEmail.toLowerCase().trim()) {
          setErr("Este e-mail é reservado para o administrador principal.");
          setLoading(false);
          return;
        }

        // Check if email already registered in cloud database
        const existingCloudUser = await getFirestoreUser(email);
        if (existingCloudUser) {
          setErr("Este endereço de e-mail já está cadastrado no Banco de Dados.");
          setLoading(false);
          return;
        }

        const newUser: FirestoreUser = {
          name: name.trim(),
          oab: oab.trim() || `OAB/SP ${Math.floor(100000 + Math.random() * 900000)}`,
          email: email.toLowerCase().trim(),
          password: password
        };

        // Save to cloud
        const savedToCloud = await createFirestoreUser(newUser);

        // Fallback local storage update
        const savedUsers = localStorage.getItem("oab_registered_users");
        const registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
        const updatedUsers = [...registeredUsers, {
          name: newUser.name,
          oab: newUser.oab,
          email: newUser.email,
          password: newUser.password
        }];
        localStorage.setItem("oab_registered_users", JSON.stringify(updatedUsers));

        if (savedToCloud) {
          setSuccess("Usuário cadastrado com sucesso na Nuvem! Conectando...");
        } else {
          setSuccess("Usuário cadastrado localmente! Conectando...");
        }

        setTimeout(() => {
          sessionStorage.setItem("gd_auth", "true");
          sessionStorage.setItem("gd_auth_email", newUser.email);
          onLogin(newUser.name, newUser.oab);
          setLoading(false);
        }, 1200);
        return;
      }
    } catch (e: any) {
      console.error(e);
      setErr("Erro de rede ao conectar com o servidor da Nuvem.");
    } finally {
      if (authMode === "login") {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans">
      
      {/* LEFT COLUMN: BRAND PRESENTATION & VALUE ACCENT (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#090d16] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative Grid and Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 relative z-10 animate-slide-up">
          <div className="bg-indigo-600/10 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-inner flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight font-display">JURISFINANCE AI</h1>
            <p className="text-[9px] text-indigo-400 font-bold tracking-widest font-mono uppercase">Controladoria Patrimonial</p>
          </div>
        </div>

        {/* Core Value Statement */}
        <div className="space-y-6 max-w-md my-auto relative z-10 text-left">
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
            SaaS de Governança Financeira
          </span>
          <h2 className="text-3xl font-bold font-display leading-tight">
            A blindagem fiscal e separação PJ/PF definitiva para o seu escritório de advocacia.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Gerencie faturamento do escritório, controle despesas pessoais misturadas no caixa da advocacia, simule metas de receitas futuras e faça a conciliação assistida com inteligência artificial contábil.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Separador de Alçada PJ/PF
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Previsão de Metas Orçadas
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Gráficos Reativos e PDF
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Auditoria de Caixa por IA
            </div>
          </div>
        </div>

        {/* Footer info / Testimonial Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 relative z-10 text-left">
          <p className="text-xs text-slate-300 italic leading-relaxed">
            "A separação patrimonial é indispensável para evitar riscos de desconsideração da personalidade jurídica no Simples Nacional. A ferramenta facilita esse processo de forma didática."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-extrabold text-[10px] flex items-center justify-center">
              CF
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">Conselho de Finanças & Auditoria Fiscal</p>
              <p className="text-[9px] text-slate-400 font-mono">JurisFinance AI Analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN / REGISTER CARD CONTAINER */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-slate-50">
        {/* Subtle decorative elements for mobile view background */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none lg:hidden" />
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
            <div className="bg-indigo-600/10 p-2 rounded-xl text-indigo-600 border border-indigo-500/10 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h1 className="text-md font-bold tracking-tight font-display text-slate-900">JURISFINANCE AI</h1>
          </div>

          {/* Intro Form Titles */}
          <div className="text-center lg:text-left space-y-1">
            <h2 className="text-2xl font-black text-slate-900 font-display">
              {authMode === "login" ? "Conectar à Controladoria" : "Criar Conta de Acesso"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {authMode === "login" 
                ? "Entre com suas credenciais para gerenciar suas contas." 
                : "Cadastre-se na nuvem para iniciar a governança do escritório."
              }
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 transform transition-all duration-300">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Errors & Success Displays */}
              {err && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2 animate-fade-in text-left">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-semibold rounded-xl flex items-start gap-2 animate-fade-in text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* REGISTER FIELD: Name */}
              {authMode === "register" && (
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500">Nome Completo do Titular</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-800 font-medium"
                      placeholder="Dr(a). Seu Nome"
                      value={name}
                      required
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* REGISTER FIELD: OAB */}
              {authMode === "register" && (
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500 font-sans">Número de Registro OAB (Opcional)</label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-800 font-medium"
                      placeholder="Ex: OAB/SP 123.456"
                      value={oab}
                      onChange={(e) => setOab(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-slate-500">Endereço de E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-800 font-medium"
                    placeholder="exemplo@escritorio.com.br"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-slate-500">Senha Secreta</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-800 font-mono"
                    placeholder="••••••••"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* REGISTER FIELD: Confirm Password */}
              {authMode === "register" && (
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500">Confirme a Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-800 font-mono"
                      placeholder="••••••••"
                      value={confirmPassword}
                      required
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-98 select-none"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {authMode === "login" ? "Entrar no Sistema" : "Cadastrar Escritório"}
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Help */}
            {authMode === "login" && (
              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-left space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  Conta de Demonstração (Admin)
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  E-mail: <strong className="text-slate-700 font-mono">gustavodantas.advogados@gmail.com</strong><br />
                  Senha: <strong className="text-slate-700 font-mono">GD2026</strong>
                </p>
              </div>
            )}
          </div>

          {/* Toggle Tab Footer */}
          <div className="text-center font-sans">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setErr("");
                setSuccess("");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer select-none"
            >
              {authMode === "login" 
                ? "Não tem conta? Cadastre seu escritório aqui" 
                : "Já possui acesso? Conecte-se aqui"
              }
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}
