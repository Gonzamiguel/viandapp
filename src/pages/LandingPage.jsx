/**
 * ViandaPro - Landing Page Oficial
 * SaaS de gestión de viandas para empresas de logística y catering
 * Estilo: Enterprise Software (Stripe/Notion)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  ChefHat,
  BarChart3,
  MessageCircle,
  Menu,
  X,
} from 'lucide-react';

const COLOR_EMERALD = '#059669';

// Datos mock para la demo del Dashboard
const MOCK_POR_SERVICIO = [
  { servicio: 'Desayuno', cantidad: 142 },
  { servicio: 'Almuerzo', cantidad: 328 },
  { servicio: 'Cena', cantidad: 189 },
];

const MOCK_TOP_PLATOS = [
  { nombre: 'Ensalada Mixta', cantidad: 89 },
  { nombre: 'Milanesa con puré', cantidad: 76 },
  { nombre: 'Pollo al horno', cantidad: 64 },
  { nombre: 'Risotto', cantidad: 52 },
  { nombre: 'Sopa de verduras', cantidad: 41 },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <span className="text-emerald-600">Vianda</span>
            <span className="text-gray-800">Pro</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#beneficios" className="text-gray-600 hover:text-emerald-600 transition text-sm font-medium">
              Beneficios
            </a>
            <a href="#precios" className="text-gray-600 hover:text-emerald-600 transition text-sm font-medium">
              Precios
            </a>
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              Login Staff
            </Link>
            <Link
              to="/login"
              className="btn-primary text-sm py-2 px-4"
            >
              Solicitar Demo
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-gray-100"
          >
            <div className="flex flex-col gap-3">
              <a href="#beneficios" onClick={() => setMobileOpen(false)} className="text-gray-600 py-2">
                Beneficios
              </a>
              <a href="#precios" onClick={() => setMobileOpen(false)} className="text-gray-600 py-2">
                Precios
              </a>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-emerald-600 py-2 font-medium">
                Login Staff
              </Link>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary text-center py-2.5">
                Solicitar Demo
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

function Hero() {
  return (
    <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight"
        >
          Profesionalizá tu gestión de viandas y{' '}
          <span className="text-emerald-600">ahorrá 10h semanales</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto"
        >
          La plataforma integral para empresas de catering que buscan eliminar el desperdicio y optimizar su logística.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10"
        >
          <a
            href="#demo"
            className="inline-flex items-center gap-2 btn-primary text-lg py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
          >
            Solicitar Demo Gratis
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Beneficios() {
  const items = [
    {
      icon: CheckCircle2,
      title: 'Cero Errores',
      desc: 'Selección de menú 72hs antes, garantizando stock y evitando desperdicios.',
      color: 'emerald',
    },
    {
      icon: ChefHat,
      title: 'Chef Contento',
      desc: 'Recetario digital con exportación de fichas técnicas en PDF.',
      color: 'emerald',
    },
    {
      icon: BarChart3,
      title: 'Admin Inteligente',
      desc: 'Dashboard con KPIs en tiempo real y exportación a Excel para compras.',
      color: 'emerald',
    },
  ];

  return (
    <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12"
        >
          Todo lo que necesitás en una sola plataforma
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-5">
                <item.icon className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PruebaSocial() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4"
        >
          Así se ve tu Dashboard
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-gray-600 text-center mb-12 max-w-2xl mx-auto"
        >
          KPIs en tiempo real, rankings de platos más y menos pedidos, y demanda por servicio.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Dashboard de Analítica</h3>
            <p className="text-sm text-gray-500 mt-0.5">Datos de ejemplo</p>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-4">Demanda por servicio</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_POR_SERVICIO} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="servicio" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(v) => [v, 'Viandas']} />
                    <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} fill={COLOR_EMERALD} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-4">Top 5 platos más pedidos</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_TOP_PLATOS} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={100}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(v) => [v, 'Pedidos']} />
                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} fill={COLOR_EMERALD}>
                      {MOCK_TOP_PLATOS.map((_, i) => (
                        <Cell key={i} fill={COLOR_EMERALD} fillOpacity={1 - i * 0.12} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FormularioLead() {
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    volumen: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnviado(true);
    setForm({ nombre: '', empresa: '', email: '', volumen: '' });
  };

  return (
    <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4"
        >
          Solicitá tu demo gratis
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-gray-600 text-center mb-10"
        >
          Dejanos tus datos y nos pondremos en contacto para mostrarte la plataforma.
        </motion.p>

        {enviado ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Genial!</h3>
            <p className="text-gray-600">Nos pondremos en contacto para tu demo.</p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="input-field"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa</label>
              <input
                type="text"
                required
                value={form.empresa}
                onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
                className="input-field"
                placeholder="Nombre de tu empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-field"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Volumen de viandas diarias</label>
              <select
                required
                value={form.volumen}
                onChange={(e) => setForm((f) => ({ ...f, volumen: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="0-50">0 - 50</option>
                <option value="50-200">50 - 200</option>
                <option value="200+">200+</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium">
              Enviar solicitud
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}

function Precios() {
  return (
    <section id="precios" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4"
        >
          Planes a medida
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-gray-600 mb-12"
        >
          Contactanos para un presupuesto adaptado a tu volumen de viandas.
        </motion.p>
        <motion.a
          href="#demo"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block btn-primary py-3 px-8 rounded-xl"
        >
          Solicitar cotización
        </motion.a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-semibold text-gray-800">
          <span className="text-emerald-600">Vianda</span>Pro
        </span>
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} ViandaPro. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  const whatsappUrl = 'https://wa.me/5491112345678?text=Hola%2C%20me%20interesa%20conocer%20ViandaPro';
  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.4 }}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3 px-4 rounded-full shadow-lg hover:shadow-xl transition-all"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline">Hablemos</span>
    </motion.a>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Beneficios />
        <PruebaSocial />
        <FormularioLead />
        <Precios />
        <Footer />
      </main>
      <WhatsAppButton />
    </div>
  );
}
