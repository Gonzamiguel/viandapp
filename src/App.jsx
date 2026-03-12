/**
 * ViandaPro - Aplicación principal (Multi-Tenant)
 * Rutas dinámicas con businessSlug como parámetro raíz
 */

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { GlobalProvider } from './context/GlobalContext';
import LandingPage from './pages/LandingPage';
import Onboarding from './components/Login/Onboarding';
import ClientePage from './pages/ClientePage';
import StaffLayout from './components/Layout/StaffLayout';
import NuevoPlato from './components/Chef/NuevoPlato';
import Recetario from './components/Chef/Recetario';
import ModuloKPIs from './components/Admin/ModuloKPIs';
import ModuloCalendario from './components/Admin/ModuloCalendario';
import ModuloRoles from './components/Admin/ModuloRoles';
import ModuloConfiguracion from './components/Admin/ModuloConfiguracion';
import ModuloInsumos from './components/Admin/ModuloInsumos';
import ModuloCostos from './components/Admin/ModuloCostos';
import ModuloIngenieriaMenu from './components/Admin/ModuloIngenieriaMenu';
import SuperAdminPage from './pages/SuperAdminPage';
import SetupPage from './pages/SetupPage';

function ProtectedRoute({ children, allowedRoles, requireBusinessMatch = false }) {
  const { user, loading, userBusinessId } = useAuth();
  const { businessSlug } = useBusiness();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to={businessSlug ? `/staff/${businessSlug}/login` : '/'} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to={businessSlug ? `/staff/${businessSlug}/login` : '/'} replace />;
  }
  if (requireBusinessMatch && businessSlug && userBusinessId) {
    const slugNorm = String(businessSlug).trim().toLowerCase();
    const userNorm = String(userBusinessId).trim().toLowerCase();
    if (userNorm !== slugNorm) {
      return <Navigate to={`/staff/${userBusinessId}/login`} replace />;
    }
  }
  return children;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-gray-600 mb-6">Negocio no encontrado</p>
        <a href="/" className="btn-primary">Volver al inicio</a>
      </div>
    </div>
  );
}

function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold text-amber-800 mb-4">Servicio Suspendido</h1>
        <p className="text-amber-700 mb-6">Contacte a soporte para más información.</p>
        <a href="/" className="btn-primary">Volver al inicio</a>
      </div>
    </div>
  );
}

function BusinessGuard({ children }) {
  const { loading, error, negocio, activo } = useBusiness();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    );
  }
  if (!activo || error === 'suspended') {
    return <SuspendedPage />;
  }
  if (error || !negocio) {
    return <NotFoundPage />;
  }
  return children;
}

function StaffSlugRedirect() {
  const { businessSlug } = useParams();
  return <Navigate to={`/staff/${businessSlug}/login`} replace />;
}

function SetupRoute() {
  const { businessSlug } = useParams();
  return (
    <BusinessProvider>
      <BusinessGuard>
        <SetupPage />
      </BusinessGuard>
    </BusinessProvider>
  );
}

function StaffLoginRoute() {
  return (
    <BusinessProvider>
      <BusinessGuard>
        <Onboarding />
      </BusinessGuard>
    </BusinessProvider>
  );
}

function ClienteRoute() {
  return (
    <BusinessProvider>
      <BusinessGuard>
        <ClientePage />
      </BusinessGuard>
    </BusinessProvider>
  );
}

function StaffAppRoute({ allowedRoles }) {
  return (
    <BusinessProvider>
      <BusinessGuard>
        <ProtectedRoute allowedRoles={allowedRoles} requireBusinessMatch>
          <StaffLayout />
        </ProtectedRoute>
      </BusinessGuard>
    </BusinessProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* Super Admin: ruta estática, maneja su propia auth (sin ProtectedRoute) */}
      <Route path="/gonza-master/*" element={<SuperAdminPage />} />
      <Route path="/staff/:businessSlug" element={<StaffSlugRedirect />} />
      <Route path="/staff/:businessSlug/login" element={<StaffLoginRoute />} />
      <Route path="/:businessSlug/setup" element={<SetupRoute />} />
      <Route path="/:businessSlug/pedido" element={<ClienteRoute />} />
      <Route path="/staff/:businessSlug/admin" element={<StaffAppRoute allowedRoles={['admin']} />}>
        <Route index element={<Navigate to="kpis" replace />} />
        <Route path="kpis" element={<ModuloKPIs />} />
        <Route path="calendario" element={<ModuloCalendario />} />
        <Route path="costos" element={<ModuloCostos />} />
        <Route path="ingenieria-menu" element={<ModuloIngenieriaMenu />} />
        <Route path="roles" element={<ModuloRoles />} />
        <Route path="configuracion" element={<ModuloConfiguracion />} />
      </Route>
      <Route path="/staff/:businessSlug/chef" element={<StaffAppRoute allowedRoles={['chef']} />}>
        <Route index element={<Navigate to="nuevo-plato" replace />} />
        <Route path="nuevo-plato" element={<NuevoPlato />} />
        <Route path="recetario" element={<Recetario />} />
        <Route path="insumos" element={<ModuloInsumos />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <GlobalProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </GlobalProvider>
  );
}
