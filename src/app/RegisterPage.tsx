import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, User, Mail, Lock, MapPin, Phone } from "lucide-react";
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

const Register = () => {
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    country: "",
    city: "",
    gender: "M",
    tel: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-100 p-4">
      {/* Logo + Description */}
      <div className="flex flex-col items-center md:items-start mb-6 md:mb-0 md:mr-10">
        <img src="/logo.png" alt="BrightAfrica Academy" className="w-32 h-32 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">BrightAfrica Academy</h1>
        <p className="text-gray-600 mt-2 text-center md:text-left max-w-xs">
          Rejoignez notre communauté d'apprentissage pour explorer les opportunités numériques
          et développer vos compétences dans toute l'Afrique.
        </p>
      </div>

      {/* Registration Form */}
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Créer un compte</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="relative">
            <User className="absolute top-3 left-3 text-gray-400" size={18} />
            <input
              type="text"
              name="username"
              placeholder="Nom d'utilisateur"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute top-3 left-3 text-gray-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute top-3 left-3 text-gray-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-2.5 right-3 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Country with flag */}
          <div className="relative">
            <MapPin className="absolute top-3 left-3 text-gray-400" size={18} />
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un pays</option>
              {africanCountries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <input
            type="text"
            name="city"
            placeholder="Ville"
            value={form.city}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Gender */}
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>

          {/* Phone */}
          <div className="relative">
            <Phone className="absolute top-3 left-3 text-gray-400" size={18} />
            <input
              type="tel"
              name="tel"
              placeholder="Téléphone"
              value={form.tel}
              onChange={handleChange}
              required
              className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
          >
            {loading ? "Enregistrement..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
