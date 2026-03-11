import { UtensilsCrossed, Coffee, ChefHat, Moon } from 'lucide-react';

const CARDS = [
  {
    key: 'total',
    label: 'Total Viandas',
    Icon: UtensilsCrossed,
    accent: 'bg-emerald-50 text-emerald-700',
    ring: 'ring-emerald-100',
  },
  {
    key: 'desayuno',
    label: 'Total Desayunos',
    Icon: Coffee,
    accent: 'bg-amber-50 text-amber-700',
    ring: 'ring-amber-100',
  },
  {
    key: 'almuerzo',
    label: 'Total Almuerzos',
    Icon: ChefHat,
    accent: 'bg-blue-50 text-blue-700',
    ring: 'ring-blue-100',
  },
  {
    key: 'cena',
    label: 'Total Cenas',
    Icon: Moon,
    accent: 'bg-indigo-50 text-indigo-700',
    ring: 'ring-indigo-100',
  },
];

export default function KpiGroup({ counts = {}, loading = false }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, Icon, accent, ring }) => (
        <div
          key={key}
          className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-3"
        >
          <div className={`p-3 rounded-xl ${accent} ring-4 ${ring}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 leading-tight">
              {loading ? '—' : (counts[key] ?? 0)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
