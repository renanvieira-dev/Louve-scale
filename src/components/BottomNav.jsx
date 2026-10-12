import React from 'react';
import { Home, CalendarDays, Music2, Users, Plus } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenAddModal }) {
  const navItems = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'schedules', label: 'Escalas', icon: CalendarDays },
    { id: 'action', isAction: true }, // Botão central de adicionar
    { id: 'songs', label: 'Repertório', icon: Music2 },
    { id: 'team', label: 'Equipe', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-zinc-850 border-zinc-900 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item, index) => {
          if (item.isAction) {
            return (
              <button
                key={`action-${index}`}
                onClick={onOpenAddModal}
                className="w-12 h-12 -mt-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center font-bold shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
                title="Criar novo"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-12 py-1 transition-all ${
                isActive ? 'text-yellow-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}