/**
 * ViandaPro - Panel Maestro (Super Admin)
 * Layout profesional con Sidebar, CRUD de negocios, Dashboard y Usuarios Globales
 */

import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  Building2,
  Plus,
  BarChart3,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  Pencil,
  ChevronRight,
  Users,
  LayoutDashboard,
  Store,
} from 'lucide-react';
import { auth, getSecondaryAuth } from '../firebase/config';
import {
  getAllNegocios,
  createNegocioCompleto,
  getAllUsuariosStaffGlobal,
  updateNegocio,
  isSuperAdmin,
  getSuperAdminEmail,
  subscribePedidosRealtime,
  computePedidosCounts,
} from '../firebase/operations';
import KpiGroup from '../components/Dashboard/KpiGroup';

const getBaseUrl = () => (typeof window !== 'undefined' ? window.location.origin : '');

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const userEmail = authUser?.email;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Verificando sesión...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Panel Maestro - Login</h1>
          <SuperAdminLogin />
        </div>
      </div>
    );
  }

  if (!isSuperAdmin(userEmail)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tenés permisos para acceder al Panel Maestro.</p>
          <button type="button" onClick={() => auth.signOut()} className="btn-secondary">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">Panel Maestro</h1>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          <NavLink
            to="/gonza-master"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
          </NavLink>
          <NavLink
            to="/gonza-master/empresas"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Store className="w-5 h-5" />
            Empresas
            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
          </NavLink>
          <NavLink
            to="/gonza-master/usuarios"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Users className="w-5 h-5" />
            Usuarios
            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
          </NavLink>
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => { auth.signOut(); navigate('/'); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Routes>
            <Route index element={<DashboardSection />} />
            <Route path="empresas" element={<EmpresasSection />} />
            <Route path="usuarios" element={<UsuariosGlobalesSection />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function DashboardSection() {
  const [totalEmpresas, setTotalEmpresas] = useState(0);
  const [empresasActivas, setEmpresasActivas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [kpiCounts, setKpiCounts] = useState({ total: 0, desayuno: 0, almuerzo: 0, cena: 0 });
  const [kpiLoading, setKpiLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const negocios = await getAllNegocios();
      setTotalEmpresas(negocios.length);
      setEmpresasActivas(negocios.filter((n) => (n.activo ?? n.habilitado ?? true) !== false).length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const unsub = subscribePedidosRealtime(
      null,
      (list) => {
        setKpiCounts(computePedidosCounts(list));
        setKpiLoading(false);
      },
      () => setKpiLoading(false)
    );
    return () => unsub?.();
  }, []);

  if (loading) {
    return <div className="animate-pulse text-gray-500">Cargando KPIs...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Master</h1>

      <div className="mb-6">
        <KpiGroup counts={kpiCounts} loading={kpiLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Store className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Empresas activas</p>
              <p className="text-3xl font-bold text-gray-800">{empresasActivas} / {totalEmpresas}</p>
            </div>
          </div>
          <button type="button" onClick={cargar} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" title="Actualizar">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total pedidos (global)</p>
              <p className="text-3xl font-bold text-gray-800">{kpiCounts.total}</p>
            </div>
          </div>
          <button type="button" onClick={cargar} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" title="Actualizar">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmpresasSection() {
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copiado, setCopiado] = useState(null);

  const [form, setForm] = useState({
    nombreEmpresa: '',
    slug: '',
    nombreDueño: '',
    apellidoDueño: '',
    dniDueño: '',
    emailDueño: '',
    passwordDueño: '',
    rol: 'admin',
    passwordSuperAdmin: '',
  });
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [linkCreado, setLinkCreado] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const n = await getAllNegocios();
      setNegocios(n);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleCrearNegocio = async (e) => {
    e.preventDefault();
    const slugVal = String(form.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    if (!slugVal) { setMensaje({ tipo: 'error', texto: 'El slug es obligatorio' }); return; }
    if (!form.emailDueño?.trim()) { setMensaje({ tipo: 'error', texto: 'El email del dueño es obligatorio' }); return; }
    if (!form.passwordDueño || form.passwordDueño.length < 6) { setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' }); return; }
    if (!form.passwordSuperAdmin) { setMensaje({ tipo: 'error', texto: 'Tu contraseña de Super Admin es necesaria' }); return; }
    setCreando(true);
    setMensaje({ tipo: '', texto: '' });
    setLinkCreado(null);
    const superAdminEmail = getSuperAdminEmail();
    const secondaryAuth = getSecondaryAuth();
    try {
      await createNegocioCompleto(slugVal, {
        nombreEmpresa: form.nombreEmpresa.trim(),
        slug: slugVal,
        nombreDueño: form.nombreDueño.trim(),
        apellidoDueño: form.apellidoDueño.trim(),
        dniDueño: form.dniDueño.trim(),
        email: form.emailDueño.trim().toLowerCase(),
        password: form.passwordDueño,
        rol: form.rol,
      }, {
        // Usar auth secundario para no cerrar la sesión del super admin
        createAuthUser: (email, password) => createUserWithEmailAndPassword(secondaryAuth, email, password),
        // Si el email ya existe, intentar loguear con esa password
        signInExistingUser: (email, password) => signInWithEmailAndPassword(secondaryAuth, email, password),
        // Ya mantenemos sesión actual; si se provee contraseña, reautenticar best-effort
        signBackIn: form.passwordSuperAdmin
          ? () => signInWithEmailAndPassword(auth, superAdminEmail, form.passwordSuperAdmin)
          : async () => {},
      });
      setLinkCreado(slugVal);
      setMensaje({ tipo: 'success', texto: '¡Cliente creado correctamente!' });
      setForm({ nombreEmpresa: '', slug: '', nombreDueño: '', apellidoDueño: '', dniDueño: '', emailDueño: '', passwordDueño: '', rol: 'admin', passwordSuperAdmin: '' });
      cargar();
    } catch (err) {
      const code = err?.code || '';
      let texto = err?.message || 'Error al crear';
      if (code === 'auth/email-already-in-use') {
        texto = 'El email ya existe en Auth. Usá otra contraseña o bórralo en Firebase Auth.';
      } else if (code === 'auth/invalid-credential') {
        texto = 'Contraseña incorrecta para el email existente en Auth.';
      } else if (texto?.toLowerCase().includes('indexof')) {
        texto = 'Error interno al validar datos. Revisa que email, password y slug tengan valores.';
      }
      setMensaje({ tipo: 'error', texto });
    } finally {
      setCreando(false);
    }
  };

  const handleToggleActivo = async (n) => {
    const activoActual = (n.activo ?? n.habilitado ?? true) !== false;
    try {
      await updateNegocio(n.slug, { activo: !activoActual });
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = {
        nombre: editing.nombre,
        logoUrl: (editing.logoUrl || '').trim() || null,
        adminEmail: editing.adminEmail?.trim().toLowerCase(),
      };
      if (editing.margenReservaHoras != null) {
        payload.config = { margenReservaHoras: Number(editing.margenReservaHoras) };
      }
      await updateNegocio(editing.slug, payload);
      setEditing(null);
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const copiarLinkStaff = (slug) => {
    navigator.clipboard.writeText(`${getBaseUrl()}/staff/${slug}/login`);
    setCopiado(`staff-${slug}`);
    setTimeout(() => setCopiado(null), 2000);
  };

  const copiarLinkPedido = (slug) => {
    navigator.clipboard.writeText(`${getBaseUrl()}/${slug}/pedido`);
    setCopiado(`pedido-${slug}`);
    setTimeout(() => setCopiado(null), 2000);
  };

  if (loading) {
    return <div className="animate-pulse text-gray-500">Cargando empresas...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setLinkCreado(null); setMensaje({}); setEditing(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCrearNegocio} className="card mb-6 p-6 space-y-5">
          <h3 className="font-semibold text-gray-800 text-lg">Nuevo Cliente</h3>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">Empresa</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.nombreEmpresa} onChange={(e) => setForm((f) => ({ ...f, nombreEmpresa: e.target.value }))} placeholder="Ej: Donata Catering" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (ID de URL) *</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="donata" className="input-field" required />
                <p className="text-xs text-gray-500 mt-1">Solo letras, números y guiones</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">Dueño</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.nombreDueño} onChange={(e) => setForm((f) => ({ ...f, nombreDueño: e.target.value }))} placeholder="Juan" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                <input type="text" value={form.apellidoDueño} onChange={(e) => setForm((f) => ({ ...f, apellidoDueño: e.target.value }))} placeholder="Pérez" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                <input type="text" value={form.dniDueño} onChange={(e) => setForm((f) => ({ ...f, dniDueño: e.target.value }))} placeholder="12345678" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.emailDueño} onChange={(e) => setForm((f) => ({ ...f, emailDueño: e.target.value }))} placeholder="dueño@empresa.com" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={form.passwordDueño} onChange={(e) => setForm((f) => ({ ...f, passwordDueño: e.target.value }))} placeholder="Mín. 6 caracteres" className="input-field" minLength={6} required />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">Permisos</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol del primer usuario *</label>
              <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))} className="input-field">
                <option value="admin">Admin</option>
                <option value="chef">Chef</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu contraseña Super Admin *</label>
            <input type="password" value={form.passwordSuperAdmin} onChange={(e) => setForm((f) => ({ ...f, passwordSuperAdmin: e.target.value }))} placeholder="Para confirmar la creación" className="input-field" required />
          </div>

          {mensaje.texto && <p className={`text-sm p-3 rounded-lg ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{mensaje.texto}</p>}
          {linkCreado && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <p className="font-semibold text-emerald-800">¡Negocio y Usuario Admin creados con éxito!</p>
              <p className="text-sm text-emerald-700">Link de acceso:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm truncate">{getBaseUrl()}/staff/{linkCreado}/login</code>
                <button type="button" onClick={() => copiarLinkStaff(linkCreado)} className="btn-primary flex items-center gap-2">
                  {copiado === `staff-${linkCreado}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copiar Link
                </button>
              </div>
            </div>
          )}
          <button type="submit" disabled={creando} className="btn-primary">{creando ? 'Creando...' : 'Crear'}</button>
        </form>
      )}

      {editing && (
        <form onSubmit={handleGuardarEdicion} className="card mb-4 p-4 bg-gray-50 border-2 border-emerald-200">
          <h4 className="font-medium text-gray-800 mb-3">Editar: {editing.slug}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input type="text" value={editing.nombre} onChange={(e) => setEditing((x) => ({ ...x, nombre: e.target.value }))} className="input-field py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
              <input type="url" value={editing.logoUrl || ''} onChange={(e) => setEditing((x) => ({ ...x, logoUrl: e.target.value }))} className="input-field py-1.5 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Margen reserva (hs)</label>
              <input type="number" value={editing.margenReservaHoras ?? 72} onChange={(e) => setEditing((x) => ({ ...x, margenReservaHoras: e.target.value }))} className="input-field py-1.5 text-sm" min={24} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email dueño</label>
              <input type="email" value={editing.adminEmail || ''} onChange={(e) => setEditing((x) => ({ ...x, adminEmail: e.target.value }))} className="input-field py-1.5 text-sm w-full" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary text-sm">Guardar</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancelar</button>
            </div>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-medium text-gray-700">Nombre</th>
              <th className="text-left py-3 font-medium text-gray-700">Slug</th>
              <th className="text-left py-3 font-medium text-gray-700">Email dueño</th>
              <th className="text-left py-3 font-medium text-gray-700">Estado</th>
              <th className="text-left py-3 font-medium text-gray-700">Links</th>
              <th className="text-left py-3 font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {negocios.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">No hay empresas. Creá una con &quot;Nueva Empresa&quot;.</td></tr>
            ) : (
              negocios.map((n) => (
                <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">{n.nombre || n.slug}</td>
                  <td className="py-3 font-mono text-gray-600">{n.slug}</td>
                  <td className="py-3">{n.adminEmail || '-'}</td>
                  <td className="py-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(n.activo ?? n.habilitado ?? true) !== false} onChange={() => handleToggleActivo(n)} className="rounded border-gray-300 text-emerald-600" />
                      <span className="text-xs">{(n.activo ?? n.habilitado ?? true) !== false ? 'Activo' : 'Suspendido'}</span>
                    </label>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[180px]">{getBaseUrl()}/staff/{n.slug}/login</code>
                        <button type="button" onClick={() => copiarLinkStaff(n.slug)} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium">
                          {copiado === `staff-${n.slug}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Copiar Link
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[180px]">{getBaseUrl()}/{n.slug}/pedido</code>
                        <button type="button" onClick={() => copiarLinkPedido(n.slug)} className="flex items-center gap-1 px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs">
                          {copiado === `pedido-${n.slug}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Copiar
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <button type="button" onClick={() => setEditing({ slug: n.slug, nombre: n.nombre || n.slug, adminEmail: n.adminEmail || '', logoUrl: n.logoUrl || '', margenReservaHoras: n.config?.margenReservaHoras ?? 72 })} className="p-1.5 rounded hover:bg-gray-200" title="Editar">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsuariosGlobalesSection() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllUsuariosStaffGlobal().then((u) => {
      setUsuarios(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="animate-pulse text-gray-500">Cargando usuarios...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Usuarios Globales</h1>
      <p className="text-sm text-gray-500 mb-4">Staff (Admin y Chef) de todos los clientes.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-medium text-gray-700">Nombre</th>
              <th className="text-left py-3 font-medium text-gray-700">Email</th>
              <th className="text-left py-3 font-medium text-gray-700">Rol</th>
              <th className="text-left py-3 font-medium text-gray-700">Empresa (businessId)</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-gray-500">No hay usuarios staff.</td></tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">{u.nombre || '-'}</td>
                  <td className="py-3">{u.email || '-'}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 capitalize">{u.rol}</span></td>
                  <td className="py-3 font-mono text-gray-600">{u.businessId || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!isSuperAdmin(cred.user.email)) {
        await auth.signOut();
        setError('No tenés acceso al Panel Maestro');
      }
    } catch (err) {
      setError(err?.message || err?.code || 'Error al ingresar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Ingresando...' : 'Ingresar'}</button>
    </form>
  );
}
