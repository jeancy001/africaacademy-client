import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, User, Mail, Lock, MapPin, Phone, Turtle } from "lucide-react";
import { africanCountries } from "../constants/Countries";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  country: string;
  city: string;
  gender: string;
  tel: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface ResetForm {
  email: string;
  code?: string;
  newPassword?: string;
}

const AuthPage = () => {
  const { register, login, requestCode, verifyOtp, resendOtp, resetPassword, error } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] =useState(false)

  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot" | "reset" | "verify">("login");

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    country: "",
    city: "",
    gender: "M",
    tel: "",
  });

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [resetForm, setResetForm] = useState<ResetForm>({
    email: "",
    code: "",
    newPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ---------------- Input Handlers ----------------
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };
  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetForm({ ...resetForm, [e.target.name]: e.target.value });
  };
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  // ---------------- Submit Handlers ----------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    setMessage(null);
    try {
      await register(registerForm);
      setMessage("Compte créé ! Vérifiez votre email pour le code OTP.");
      setActiveTab("verify");
      setLoading(false)
    } catch(error) {
        console.log(error)
        setLoading(false)
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    const otpCode = otp.join("");
    if (otpCode.length !== 4) return setMessage("Veuillez entrer le code OTP complet");
    try {
      await verifyOtp(registerForm.email, otpCode);
      setMessage("Compte vérifié avec succès !");
      navigate("/"); // redirect to home page
      setLoading(false)
    } catch {
      setMessage("Code OTP incorrect");
      setLoading(false)
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true)
    try {
      await login(loginForm.email, loginForm.password);
      if(!activeTab)return setActiveTab("verify");
      
      navigate("/"); // redirect after login
      setLoading(false)
    } catch (error){
        console.log(error)
        setLoading(false)
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true)
    await requestCode(resetForm.email);
    setMessage("Code envoyé à votre email");
    setActiveTab("reset");
    setLoading(false)
  };

  const handleResendCode = async () => {
    setMessage(null);
    setLoading(true)
    await resendOtp(registerForm.email || resetForm.email);
    setMessage("Code renvoyé !");
    setLoading(false)
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage(null);
    setLoading(true)
    if (!resetForm.code || !resetForm.newPassword) return;
    await resetPassword(resetForm.email, resetForm.code, resetForm.newPassword);
    setMessage("Mot de passe réinitialisé avec succès");
    setActiveTab("login");
    setLoading(false)
  };

  // ---------------- JSX ----------------
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-100 p-4">
      {/* Logo + Description */}
      <div className="flex flex-col items-center md:items-start mb-6 md:mb-0 md:mr-10">
        <img src="/logo.png" alt="BrightAfrica Academy" className="w-32 h-32 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">BrightAfrica Academy</h1>
        <p className="text-gray-600 mt-2 text-center md:text-left max-w-xs">
          Rejoignez notre communauté d'apprentissage et développez vos compétences numériques à travers l'Afrique.
        </p>
      </div>

      {/* Auth Form */}
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        {/* Tabs */}
        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={() => setActiveTab("login")}
            className={`py-2 px-4 font-semibold rounded-lg ${activeTab === "login" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`py-2 px-4 font-semibold rounded-lg ${activeTab === "register" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            S'inscrire
          </button>
          <button
            onClick={() => setActiveTab("forgot")}
            className={`py-2 px-4 font-semibold rounded-lg ${activeTab === "forgot" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Mot de passe oublié
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-center mb-4">{message}</p>}

        {/* ---------------- Login ---------------- */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-3 left-3 text-gray-400" size={18} />
              <input type="email" name="email" placeholder="Email" value={loginForm.email} onChange={handleLoginChange} required className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <Lock className="absolute top-3 left-3 text-gray-400" size={18} />
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Mot de passe" value={loginForm.password} onChange={handleLoginChange} required className="w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-2.5 right-3 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300">{loading ? "Connexion..." : "Se connecter"}</button>
            <p className="text-center text-gray-600 mt-2">Pas de compte ? <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveTab("register")}>Inscrivez-vous</span></p>
          </form>
        )}

        {/* ---------------- Register ---------------- */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="relative"><User className="absolute top-3 left-3 text-gray-400" size={18} /><input type="text" name="username" placeholder="Nom d'utilisateur" value={registerForm.username} onChange={handleRegisterChange} required className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="relative"><Mail className="absolute top-3 left-3 text-gray-400" size={18} /><input type="email" name="email" placeholder="Email" value={registerForm.email} onChange={handleRegisterChange} required className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="relative"><Lock className="absolute top-3 left-3 text-gray-400" size={18} /><input type={showPassword ? "text" : "password"} name="password" placeholder="Mot de passe" value={registerForm.password} onChange={handleRegisterChange} required className="w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-2.5 right-3 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            <div className="relative"><MapPin className="absolute top-3 left-3 text-gray-400" size={18} /><select name="country" value={registerForm.country} onChange={handleRegisterChange} required className="w-full pl-10 pr-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Sélectionnez un pays</option>{africanCountries.map(c => (<option key={c.code} value={c.name}>{c.flag} {c.name}</option>))}</select></div>
            <input type="text" name="city" placeholder="Ville" value={registerForm.city} onChange={handleRegisterChange} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select name="gender" value={registerForm.gender} onChange={handleRegisterChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="M">Masculin</option><option value="F">Féminin</option></select>
            <div className="relative"><Phone className="absolute top-3 left-3 text-gray-400" size={18} /><input type="tel" name="tel" placeholder="Téléphone" value={registerForm.tel} onChange={handleRegisterChange} required className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300">{loading ? "Enregistrement..." : "S'inscrire"}</button>
            <p className="text-center text-gray-600 mt-2">Déjà un compte ? <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveTab("login")}>Connectez-vous</span></p>
          </form>
        )}

        {/* ---------------- OTP Verification ---------------- */}
        {activeTab === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-center text-gray-700 mb-2">Entrez le code OTP envoyé à votre email</p>
            <div className="flex justify-between space-x-2">
              {otp.map((digit, index) => (
                <input key={index} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} ref={(el) => (otpRefs.current[index] = el)} className="w-16 h-16 text-center text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ))}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 mt-4">Vérifier</button>
            <button type="button" onClick={handleResendCode} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-300 mt-2">Renvoyer le code</button>
          </form>
        )}

        {/* ---------------- Forgot Password ---------------- */}
        {activeTab === "forgot" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="relative"><Mail className="absolute top-3 left-3 text-gray-400" size={18} /><input type="email" name="email" placeholder="Email" value={resetForm.email} onChange={handleResetChange} required className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300">{loading ? "Envoi du code..." : "Envoyer le code de réinitialisation"}</button>
            <p className="text-center text-gray-600 mt-2">Retour à <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveTab("login")}>Connexion</span></p>
          </form>
        )}

        {/* ---------------- Reset Password ---------------- */}
        {activeTab === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="relative"><Mail className="absolute top-3 left-3 text-gray-400" size={18} /><input type="email" name="email" placeholder="Email" value={resetForm.email} onChange={handleResetChange} required className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="relative"><Lock className="absolute top-3 left-3 text-gray-400" size={18} /><input type="text" name="code" placeholder="Code OTP" value={resetForm.code} onChange={handleResetChange} required className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="relative"><Lock className="absolute top-3 left-3 text-gray-400" size={18} /><input type={showPassword ? "text" : "password"} name="newPassword" placeholder="Nouveau mot de passe" value={resetForm.newPassword} onChange={handleResetChange} required className="w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-2.5 right-3 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300">{loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}</button>
            <button type="button" onClick={handleResendCode} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-300">Renvoyer le code</button>
            <p className="text-center text-gray-600 mt-2">Retour à <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveTab("login")}>Connexion</span></p>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthPage;
