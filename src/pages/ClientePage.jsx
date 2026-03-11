/**
 * ViandaPro - Vista Cliente (sin login)
 * Los clientes se identifican por DNI/Nombre al confirmar el pedido
 */

import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import SelectorRango from '../components/Cliente/SelectorRango';
import FasesComida from '../components/Cliente/FasesComida';

function FormDatosCliente({ onConfirm }) {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [hotel, setHotel] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dni.trim() || !nombre.trim() || !empresa.trim() || !hotel.trim()) return;
    onConfirm({ dni: dni.trim(), nombre: nombre.trim(), empresa: empresa.trim(), hotel: hotel.trim() });
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del solicitante</h2>
      <p className="text-sm text-gray-500 mb-4">
        Ingresá tus datos para poder registrar el pedido. No necesitás crear una cuenta.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="input-field"
            placeholder="12345678"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input-field"
            placeholder="Tu nombre"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
          <input
            type="text"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="input-field"
            placeholder="Nombre de la empresa"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hotel / Sede</label>
          <input
            type="text"
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            className="input-field"
            placeholder="Hotel o sede donde te alojás"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Continuar a selección de fechas
        </button>
      </form>
    </div>
  );
}

export default function ClientePage() {
  const { businessSlug, nombre, logoUrl } = useBusiness();
  const [guestData, setGuestData] = useState(null);
  const [rango, setRango] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          {logoUrl ? (
            <img src={logoUrl} alt={nombre} className="h-8 object-contain" />
          ) : (
            <h1 className="text-lg font-semibold text-gray-800">{nombre || 'ViandaPro'}</h1>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {!guestData ? 'Ingresá tus datos' : rango ? 'Selecciona tus platos' : 'Elige el rango de fechas'}
        </h2>

        {!guestData ? (
          <FormDatosCliente onConfirm={setGuestData} />
        ) : !rango ? (
          <SelectorRango onConfirm={setRango} guestData={guestData} />
        ) : (
          <FasesComida
            fechaInicio={rango.fechaInicio}
            fechaFin={rango.fechaFin}
            guestData={guestData}
            onBack={() => setRango(null)}
          />
        )}
      </main>
    </div>
  );
}
