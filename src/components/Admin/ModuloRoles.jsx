/**
 * ViandaPro - Módulo Roles
 * Crear usuarios en Firebase Auth y Firestore
 */

import { useState, useEffect } from 'react';
import { getUsuariosStaff, getUsuariosClientes, updateUsuarioCliente } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Mail, Lock, Shield } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { getEmpresas } from '../../firebase/operations';

const ROLES_EQUIPO = [
  { value: 'chef', label: 'Chef' },
  { value: 'admin', label: 'Admin' },
];

export default function ModuloRoles() {
  const { businessId } = useBusiness();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('chef');
  const [empresa, setEmpresa] = useState('');
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [empresas, setEmpresas] = useState([]);
  const [usuariosStaff, setUsuariosStaff] = useState([]);
  const [usuariosClientes, setUsuariosClientes] = useState([]);

  useEffect(() => {
    if (!businessId) return;
    getEmpresas(businessId).then(setEmpresas);
    getUsuariosStaff(businessId).then(setUsuariosStaff);
    getUsuariosClientes(businessId).then(setUsuariosClientes);
  }, [businessId]);

  const toggleIgnorarRestriccion = async (dni) => {
    const cliente = usuariosClientes.find((c) => c.dni === dni);
    const nuevoValor = !cliente?.ignorar_restriccion;
    await updateUsuarioCliente(businessId, dni, { ignorar_restriccion: nuevoValor });
    setUsuariosClientes((prev) =>
      prev.map((c) => (c.dni === dni ? { ...c, ignorar_restriccion: nuevoValor } : c))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordActual) {
      setMensaje({ tipo: 'error', texto: 'Tu contraseña es necesaria para crear el usuario' });
      return;
    }
    setCreando(true);
    setMensaje({ tipo: '', texto: '' });
    const adminEmail = user?.email;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Doc con UID como ID, businessId del negocio actual (aislamiento multi-tenant)
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        uid: cred.user.uid,
        email,
        nombre,
        rol,
        empresa: empresa || null,
        businessId,
        createdAt: serverTimestamp(),
      });

      await auth.signOut();
      await signInWithEmailAndPassword(auth, adminEmail, passwordActual);
      setMensaje({ tipo: 'success', texto: 'Usuario creado correctamente' });
      setEmail('');
      setPassword('');
      setPasswordActual('');
      setNombre('');
      setRol('chef');
      setEmpresa('');
      getUsuariosStaff(businessId).then(setUsuariosStaff);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.code === 'auth/email-already-in-use' ? 'El email ya está registrado' : err.code === 'auth/invalid-credential' ? 'Tu contraseña es incorrecta' : err.message,
      });
    } finally {
      setCreando(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Equipo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crear Chef/Admin */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">Agregar miembro</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Creá usuarios internos (Chefs, Admins) vinculados a este negocio.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-field"
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="input-field pl-10"
                >
                  {ROLES_EQUIPO.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu contraseña (para confirmar) *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Tu contraseña actual"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Necesaria para crear el usuario en Firebase Auth</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa (opcional)</label>
              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            {mensaje.texto && (
              <p
                className={`text-sm p-3 rounded-lg ${
                  mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}
              >
                {mensaje.texto}
              </p>
            )}
            <button type="submit" disabled={creando} className="btn-primary w-full">
              {creando ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>

        {/* Lista Staff */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Usuarios Staff</h2>
          {usuariosStaff.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay usuarios staff. Cree uno con el formulario.</p>
          ) : (
            <div className="space-y-2">
              {usuariosStaff.map((u) => (
                <div key={u.id || u.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 capitalize">
                    {u.rol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Excepciones por usuario - Clientes */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Excepciones de reserva (Clientes)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Los clientes con &quot;Ignorar restricción&quot; activo pueden pedir para cualquier fecha, incluido hoy.
        </p>
        {usuariosClientes.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay clientes registrados.</p>
        ) : (
          <div className="space-y-2">
            {usuariosClientes.map((c) => (
              <div key={c.dni} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-sm text-gray-500">DNI: {c.dni}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!c.ignorar_restriccion}
                    onChange={() => toggleIgnorarRestriccion(c.dni)}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  <span className="text-sm">Ignorar restricción</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
