/**
 * ViandaPro - Operaciones Firestore (Multi-Tenant)
 * Todas las operaciones requieren businessId para aislamiento por tenant
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';

// --- NEGOCIOS (Principal) ---
function normalizarSlug(s) {
  return String(s || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
}

export async function getNegocioBySlug(slug) {
  if (!slug) return null;
  const slugNorm = normalizarSlug(slug);
  if (!slugNorm) return null;
  const ref = doc(db, 'negocios', slugNorm);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateNegocio(slug, data) {
  const ref = doc(db, 'negocios', String(slug));
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return { slug, ...data };
}

// --- CONFIGURACIÓN (desde negocio) ---
export async function getConfiguracion(businessId) {
  if (!businessId) return { margenReservaHoras: 72, factorQ: 0, factorQSpice: 0, precioVentaUnico: 0 };
  const negocio = await getNegocioBySlug(businessId);
  const config = negocio?.config ?? {};
  return {
    margenReservaHoras: config.margenReservaHoras ?? 72,
    factorQ: config.factorQ ?? 0,
    factorQSpice: config.factorQSpice ?? 0,
    precioVentaUnico: config.precioVentaUnico ?? config.precioVentaFijo ?? 0,
    precioVentaFijo: config.precioVentaFijo ?? config.precioVentaUnico ?? 0,
    costoPonderadoObjetivo: config.costoPonderadoObjetivo ?? null,
    packagingPorUnidad: config.packagingPorUnidad ?? 0,
    gastosFijos: config.gastosFijos ?? { sueldos: 0, alquiler: 0, otros: 0 },
  };
}

export async function updateConfiguracion(businessId, data) {
  const ref = doc(db, 'negocios', String(businessId));
  const snap = await getDoc(ref);
  const current = snap.exists() ? snap.data() : {};
  const config = { ...(current.config ?? {}), ...data };
  await setDoc(ref, { config, updatedAt: serverTimestamp() }, { merge: true });
  return config;
}

// --- EMPRESAS Y HOTELES (por negocio) ---
export async function getEmpresas(businessId) {
  if (!businessId) return [];
  const ref = collection(db, 'empresas');
  const q = query(ref, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getHoteles(businessId, empresaId = null) {
  if (!businessId) return [];
  const ref = collection(db, 'hoteles');
  const constraints = [where('businessId', '==', businessId)];
  if (empresaId) constraints.push(where('empresaId', '==', empresaId));
  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- USUARIOS (doc id: businessId_dni para clientes) ---
function usuarioClienteId(businessId, dni) {
  return `${businessId}_${String(dni).replace(/[^a-zA-Z0-9]/g, '_')}`;
}

export async function getUsuarioByDni(businessId, dni) {
  if (!businessId || !dni) return null;
  const ref = doc(db, 'usuarios', usuarioClienteId(businessId, dni));
  const snap = await getDoc(ref);
  return snap.exists() ? { dni, ...snap.data() } : null;
}

export async function createOrUpdateUsuario(businessId, dni, data) {
  if (!businessId || !dni) throw new Error('businessId y dni son requeridos');
  const ref = doc(db, 'usuarios', usuarioClienteId(businessId, dni));
  await setDoc(ref, { ...data, businessId, dni, updatedAt: serverTimestamp() }, { merge: true });
  return { dni, ...data };
}

export async function getUsuarioByEmail(businessId, email) {
  if (!businessId || !email) return null;
  const ref = collection(db, 'usuarios');
  const q = query(
    ref,
    where('businessId', '==', businessId),
    where('email', '==', email)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/** Obtiene usuario staff por UID (doc id = uid para staff) */
export async function getUsuarioStaffByUid(uid) {
  if (!uid) return null;
  const ref = doc(db, 'usuarios', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!['admin', 'chef'].includes(data.rol)) return null;
  return { id: snap.id, ...data };
}


export async function getUsuariosStaff(businessId) {
  if (!businessId) return [];
  const ref = collection(db, 'usuarios');
  const q = query(
    ref,
    where('businessId', '==', businessId),
    where('rol', 'in', ['chef', 'admin'])
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUsuariosClientes(businessId) {
  if (!businessId) return [];
  const ref = collection(db, 'usuarios');
  const q = query(
    ref,
    where('businessId', '==', businessId),
    where('rol', '==', 'cliente')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ dni: d.data().dni ?? d.id, ...d.data() }));
}

export async function updateUsuarioCliente(businessId, dni, data) {
  const ref = doc(db, 'usuarios', usuarioClienteId(businessId, dni));
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  return { dni, ...data };
}

// --- PLATOS ---
function normalizarPlatoParaFirestore(data) {
  const ingredientes = (data.ingredientes || [])
    .filter((i) => i?.nombre?.trim() || i?.insumoId)
    .map((i) => ({
      insumoId: i.insumoId || null,
      nombre: String(i.nombre || '').trim(),
      cantidad: Number(i.cantidad) || 1,
      unidad: i.unidad || 'unidad',
    }));
  const categoria = Array.isArray(data.categoria)
    ? data.categoria.filter(Boolean)
    : data.categoria ? [String(data.categoria)] : [];
  if (categoria.length === 0) {
    throw new Error('Selecciona al menos una categoría');
  }
  return {
    nombre: data.nombre,
    categoria,
    ingredientes,
    procedimiento: data.procedimiento ?? data.pasos ?? '',
    kcal: Number(data.kcal) || 0,
    tiempoCoccion: Number(data.tiempoCoccion) || 0,
  };
}

export async function getPlatos(businessId) {
  if (!businessId) return [];
  const ref = collection(db, 'platos');
  const q = query(ref, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export const getRecetario = getPlatos;

export async function getPlatoById(businessId, id) {
  if (!businessId || !id) return null;
  const ref = doc(db, 'platos', id);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : null;
  if (!data || data.businessId !== businessId) return null;
  return { id: snap.id, ...data };
}

export async function createPlato(businessId, data) {
  if (!businessId) throw new Error('businessId es requerido');
  const payload = normalizarPlatoParaFirestore(data);
  const ref = collection(db, 'platos');
  const docRef = await addDoc(ref, {
    ...payload,
    businessId,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...payload };
}

export async function updatePlato(businessId, id, data) {
  if (!businessId) throw new Error('businessId es requerido');
  const payload = normalizarPlatoParaFirestore(data);
  const ref = doc(db, 'platos', id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().businessId !== businessId) {
    throw new Error('Plato no encontrado');
  }
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
  return { id, ...payload };
}

// --- MENÚ DIARIO (doc id: businessId_fecha) ---
function menuDiarioId(businessId, fecha) {
  return `${businessId}_${fecha}`;
}

export async function getMenuDiario(businessId, fechaId) {
  if (!businessId || !fechaId) return null;
  const ref = doc(db, 'menu_diario', menuDiarioId(businessId, fechaId));
  const snap = await getDoc(ref);
  return snap.exists() ? { fecha_id: fechaId, ...snap.data() } : null;
}

export async function getMenusRango(businessId, fechaInicio, fechaFin) {
  if (!businessId) return {};
  const result = {};
  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const fid = d.toISOString().split('T')[0];
    const menu = await getMenuDiario(businessId, fid);
    if (menu?.servicios) result[fid] = menu;
  }
  return result;
}

export async function updateMenuDiario(businessId, fechaId, servicios) {
  if (!businessId) throw new Error('businessId es requerido');
  const ref = doc(db, 'menu_diario', menuDiarioId(businessId, fechaId));
  await setDoc(ref, {
    businessId,
    servicios,
    fecha: fechaId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { fecha_id: fechaId, servicios };
}

// --- PEDIDOS ---
export async function createPedido(businessId, data) {
  if (!businessId) throw new Error('businessId es requerido');
  const { fecha, ignorar_restriccion } = data;
  if (!ignorar_restriccion) {
    const config = await getConfiguracion(businessId);
    const margenHoras = config.margenReservaHoras ?? 72;
    const ahora = new Date();
    const minFecha = new Date(ahora.getTime() + margenHoras * 60 * 60 * 1000);
    const minFechaStr = minFecha.toISOString().split('T')[0];
    if (fecha < minFechaStr) {
      throw new Error(`El pedido debe realizarse con al menos ${margenHoras}hs de anticipación`);
    }
  }
  const { ignorar_restriccion: _, ...pedidoData } = data;
  const ref = collection(db, 'pedidos');
  const docRef = await addDoc(ref, {
    ...pedidoData,
    businessId,
    timestamp: serverTimestamp(),
  });
  return { id: docRef.id, ...pedidoData };
}

export async function getPedidos(businessId, filtros = {}) {
  if (!businessId) return [];
  const ref = collection(db, 'pedidos');
  let list = [];
  try {
    const q = query(
      ref,
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const q = query(ref, where('businessId', '==', businessId));
    const snap = await getDocs(q);
    list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => {
      const ta = a.timestamp?.toMillis?.() ?? 0;
      const tb = b.timestamp?.toMillis?.() ?? 0;
      return tb - ta;
    });
  }

  if (filtros.mes) {
    list = list.filter((p) => {
      const m = new Date(p.fecha).getMonth() + 1;
      return m === parseInt(filtros.mes, 10);
    });
  }
  if (filtros.anio) {
    list = list.filter((p) => new Date(p.fecha).getFullYear() === parseInt(filtros.anio, 10));
  }
  if (filtros.empresa) list = list.filter((p) => p.empresa === filtros.empresa);
  if (filtros.servicio) list = list.filter((p) => p.servicio === filtros.servicio);
  if (filtros.fecha) list = list.filter((p) => p.fecha === filtros.fecha);
  if (filtros.fechaDesde) list = list.filter((p) => p.fecha >= filtros.fechaDesde);
  if (filtros.fechaHasta) list = list.filter((p) => p.fecha <= filtros.fechaHasta);

  return list;
}

// --- SUSCRIPCIONES EN TIEMPO REAL ---
export function subscribePedidosRealtime(businessId, onChange, onError) {
  const ref = collection(db, 'pedidos');
  const qRef = businessId ? query(ref, where('businessId', '==', businessId)) : ref;
  return onSnapshot(qRef, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange?.(list);
  }, onError);
}

export function computePedidosCounts(list = []) {
  const counts = { total: 0, desayuno: 0, almuerzo: 0, cena: 0 };
  list.forEach((p) => {
    counts.total += 1;
    const s = (p.servicio || '').toLowerCase();
    if (s === 'desayuno') counts.desayuno += 1;
    else if (s === 'almuerzo') counts.almuerzo += 1;
    else if (s === 'cena') counts.cena += 1;
  });
  return counts;
}

// --- INSUMOS ---
export function subscribeInsumos(businessId, onChange, onError) {
  if (!businessId) return () => {};
  const ref = collection(db, 'insumos');
  const qRef = query(ref, where('businessId', '==', businessId));
  return onSnapshot(qRef, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange?.(list);
  }, onError);
}

export async function createInsumo(businessId, data) {
  if (!businessId) throw new Error('businessId es requerido');
  const ref = collection(db, 'insumos');
  const payload = {
    businessId,
    nombre: (data.nombre || '').trim(),
    unidadMedida: data.unidadMedida || 'unidad',
    precioUnitario: Number(data.precioUnitario) || 0,
    merma: Number(data.merma) || 0,
    activo: data.activo ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

export async function updateInsumo(businessId, id, data) {
  if (!businessId || !id) throw new Error('businessId e id son requeridos');
  const ref = doc(db, 'insumos', id);
  await updateDoc(ref, {
    ...data,
    businessId,
    updatedAt: serverTimestamp(),
  });
  return { id, ...data };
}

// --- INVENTARIO MENSUAL (Verdad Financiera) ---
function inventarioMensualId(businessId, anno, mes) {
  return `${businessId}_${anno}_${mes}`;
}

export async function getInventarioMensual(businessId, anno, mes) {
  if (!businessId || !anno || !mes) return null;
  const ref = doc(db, 'inventario_mensual', inventarioMensualId(businessId, anno, mes));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function setInventarioMensual(businessId, anno, mes, data) {
  if (!businessId || !anno || !mes) throw new Error('businessId, anno y mes son requeridos');
  const ref = doc(db, 'inventario_mensual', inventarioMensualId(businessId, anno, mes));
  await setDoc(ref, {
    businessId,
    anno: Number(anno),
    mes: Number(mes),
    invInicial: Number(data.invInicial) || 0,
    compras: Number(data.compras) || 0,
    invFinal: Number(data.invFinal) || 0,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { anno, mes, ...data };
}

// --- SUPER ADMIN (solo Gonzalo) ---
const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'gonzalo@ejemplo.com').trim().toLowerCase();

export function isSuperAdmin(email) {
  const normalized = email?.trim().toLowerCase();
  return !!normalized && normalized === SUPER_ADMIN_EMAIL;
}

export function getSuperAdminEmail() {
  return SUPER_ADMIN_EMAIL;
}

export async function getAllNegocios() {
  const ref = collection(db, 'negocios');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, slug: d.id, ...d.data() }));
}

export async function createNegocio(slug, data) {
  const slugSanitized = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const adminEmail = (data.adminEmail || '').trim().toLowerCase();
  if (!adminEmail) throw new Error('El email del dueño (adminEmail) es obligatorio');
  const ref = doc(db, 'negocios', slugSanitized);
  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error(`El slug "${slugSanitized}" ya existe`);
  const payload = {
    nombre: data.nombre || slugSanitized,
    slug: slugSanitized,
    logoUrl: data.logoUrl || null,
    adminEmail,
    config: { margenReservaHoras: data.margenReservaHoras ?? 72 },
    adminId: data.adminId || null,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { slug: slugSanitized, ...payload };
}

/**
 * Crea negocio completo en 3 pasos atómicos:
 * 1. Colección negocios (doc id = slug)
 * 2. Firebase Auth
 * 3. Colección usuarios (doc id = UID)
 * Slug y businessId siempre en minúsculas y sin espacios.
 * Usa auth secundario para no cerrar la sesión del super admin.
 */
export async function createNegocioCompleto(slug, data, authHelpers) {
  const slugSanitized = normalizarSlug(slug);
  const { createAuthUser, signBackIn, signInExistingUser } = authHelpers;
  const signBackInSafe = typeof signBackIn === 'function' ? signBackIn : async () => {};
  const email = (data.email || '').trim().toLowerCase();
  const password = data.password;
  if (!email || !password || password.length < 6) {
    throw new Error('Email y contraseña (mín. 6 caracteres) son obligatorios');
  }

  const negocioRef = doc(db, 'negocios', slugSanitized);
  const snap = await getDoc(negocioRef);
  if (snap.exists()) throw new Error(`El slug "${slugSanitized}" ya existe`);

  // Paso A: crear documento de negocio (ID = slug minúsculas)
  const negocioPayload = {
    nombre: (data.nombreEmpresa || slugSanitized).trim(),
    slug: slugSanitized,
    logoUrl: data.logoUrl || null,
    adminEmail: email,
    activo: true,
    config: { margenReservaHoras: data.margenReservaHoras ?? 72 },
    createdAt: serverTimestamp(),
  };

  let negocioCreado = false;
  let result = null;
  let cred = null;
  try {
    await setDoc(negocioRef, negocioPayload);
    negocioCreado = true;

    // Paso B: Firebase Auth (usuario dueño) - usa cuenta secundaria
    try {
      cred = await createAuthUser(email, password);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use' && typeof signInExistingUser === 'function') {
        // Si ya existe, intenta loguear con la misma pass para reutilizar UID
        cred = await signInExistingUser(email, password);
      } else {
        throw err;
      }
    }

    // Paso C: Colección usuarios (doc id = UID, businessId = slug minúsculas)
    const uid = cred?.user?.uid || cred?.uid;
    if (!uid) throw new Error('No se pudo obtener el UID del usuario creado');
    const rol = ['admin', 'chef'].includes(data.rol) ? data.rol : 'admin';
    const usuariosRef = doc(db, 'usuarios', uid);
    await setDoc(usuariosRef, {
      uid,
      email,
      nombre: (data.nombreDueño || '').trim(),
      apellido: (data.apellidoDueño || '').trim(),
      dni: (data.dniDueño || '').trim(),
      businessId: slugSanitized,
      rol,
      createdAt: serverTimestamp(),
    });

    // Vincular UID al negocio recién creado
    await setDoc(negocioRef, { adminId: uid }, { merge: true });

    result = { slug: slugSanitized, ...negocioPayload, adminId: uid };
  } catch (err) {
    // Rollback mínimo si fallan pasos posteriores
    if (negocioCreado) {
      try { await deleteDoc(negocioRef); } catch (_) { /* noop */ }
    }
    throw err;
  }
  // Re-autenticar al Super Admin (best-effort, sin romper creación)
  try {
    await signBackInSafe();
  } catch {
    // Ignorar error de re-autenticación para no borrar lo creado
  }
  return result;
}

export async function getTotalPedidosGlobal() {
  const ref = collection(db, 'pedidos');
  const snap = await getDocs(ref);
  return snap.docs.length;
}

/** Pedidos de hoy en toda la red */
export async function getTotalPedidosHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  const ref = collection(db, 'pedidos');
  const q = query(ref, where('fecha', '==', hoy));
  const snap = await getDocs(q);
  return snap.docs.length;
}

/** Todos los usuarios staff (admin/chef) de todos los negocios */
export async function getAllUsuariosStaffGlobal() {
  const ref = collection(db, 'usuarios');
  const q = query(ref, where('rol', 'in', ['admin', 'chef']));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Migración one-time: asigna businessId "donata" a docs sin businessId */
export async function migrateToBusinessId(targetBusinessId = 'donata') {
  const results = { platos: 0, pedidos: 0, usuarios: 0, menu_diario: 0 };

  // Platos sin businessId
  const platosRef = collection(db, 'platos');
  const platosSnap = await getDocs(platosRef);
  for (const d of platosSnap.docs) {
    if (!d.data().businessId) {
      await updateDoc(doc(db, 'platos', d.id), { businessId: targetBusinessId });
      results.platos++;
    }
  }

  // Pedidos sin businessId
  const pedidosRef = collection(db, 'pedidos');
  const pedidosSnap = await getDocs(pedidosRef);
  for (const d of pedidosSnap.docs) {
    if (!d.data().businessId) {
      await updateDoc(doc(db, 'pedidos', d.id), { businessId: targetBusinessId });
      results.pedidos++;
    }
  }

  // Usuarios sin businessId: agregar campo (staff) o migrar doc id (clientes con dni)
  const usuariosRef = collection(db, 'usuarios');
  const usuariosSnap = await getDocs(usuariosRef);
  for (const d of usuariosSnap.docs) {
    const data = d.data();
    if (data.businessId) continue;

    const dni = data.dni ?? (data.rol === 'cliente' ? d.id : null);
    if (dni && data.rol === 'cliente') {
      const newId = `${targetBusinessId}_${String(dni).replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (d.id !== newId) {
        await setDoc(doc(db, 'usuarios', newId), { ...data, businessId: targetBusinessId, dni, updatedAt: serverTimestamp() });
        await deleteDoc(doc(db, 'usuarios', d.id));
        results.usuarios++;
      } else {
        await updateDoc(doc(db, 'usuarios', d.id), { businessId: targetBusinessId, updatedAt: serverTimestamp() });
        results.usuarios++;
      }
    } else {
      await updateDoc(doc(db, 'usuarios', d.id), { businessId: targetBusinessId, updatedAt: serverTimestamp() });
      results.usuarios++;
    }
  }

  // menu_diario: docs con id = fecha (sin businessId_) -> crear nuevo y borrar viejo
  const menuRef = collection(db, 'menu_diario');
  const menuSnap = await getDocs(menuRef);
  for (const d of menuSnap.docs) {
    const id = d.id;
    if (id.includes('_')) continue; // ya migrado
    const data = d.data();
    const newId = `${targetBusinessId}_${id}`;
    await setDoc(doc(db, 'menu_diario', newId), {
      ...data,
      businessId: targetBusinessId,
      fecha: id,
      updatedAt: serverTimestamp(),
    });
    await deleteDoc(doc(db, 'menu_diario', d.id));
    results.menu_diario++;
  }

  return results;
}
