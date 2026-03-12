/**
 * ViandaPro - Layout con Sidebar persistente para Staff
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';

export default function StaffLayout() {
  const navigate = useNavigate();
  const { businessSlug, nombre, logoUrl } = useBusiness();
  const { user, signOut } = useAuth();

  const CHEF_NAV = [
    { to: `/staff/${businessSlug}/chef/nuevo-plato`, label: 'Nuevo Plato', icon: '➕' },
    { to: `/staff/${businessSlug}/chef/recetario`, label: 'Recetario / Platos', icon: '📋' },
    { to: `/staff/${businessSlug}/chef/insumos`, label: 'Insumos', icon: '🧺' },
  ];

  const ADMIN_NAV = [
    { to: `/staff/${businessSlug}/admin/kpis`, label: 'Dashboard / KPIs', icon: '📊' },
    { to: `/staff/${businessSlug}/admin/calendario`, label: 'Calendario', icon: '📅' },
    { to: `/staff/${businessSlug}/admin/costos`, label: 'Análisis de Costos', icon: '💰' },
    { to: `/staff/${businessSlug}/admin/ingenieria-menu`, label: 'Ingeniería de Menú', icon: '📈' },
    { to: `/staff/${businessSlug}/admin/roles`, label: 'Mi Equipo', icon: '👥' },
    { to: `/staff/${businessSlug}/admin/configuracion`, label: 'Configuración', icon: '⚙️' },
  ];

  const navItems = user?.rol === 'chef' ? CHEF_NAV : ADMIN_NAV;

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={nombre} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-gray-800 truncate">{nombre || 'ViandaPro'}</h1>
              <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === navItems[0]?.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">{user?.nombre || user?.email}</div>
          <button
            type="button"
            onClick={handleSignOut}
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
