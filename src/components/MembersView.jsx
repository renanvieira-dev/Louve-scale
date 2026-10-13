import React, { useState } from 'react';
import { Users, Shield, User, Check, Plus, Trash2 } from 'lucide-react';
import { authService } from '../services/authService';

const AVAILABLE_INSTRUMENTS = [
  'Ministro(a) de Louvor',
  'Backing Vocal',
  'Violão',
  'Guitarra',
  'Baixo',
  'Teclado / Piano',
  'Bateria',
  'Mídia / Projeção',
  'Técnico de Som'
];

export default function MembersView({ 
  profiles = [], 
  currentUserId, 
  isAdmin = false, 
  onProfileUpdated 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Alternar permissão de Administrador
  const handleToggleAdmin = async (member) => {
    if (member.id === currentUserId) {
      alert('Não é possível alterar o seu próprio nível de acesso.');
      return;
    }

    const nextRole = member.role === 'admin' ? 'member' : 'admin';
    const msg = nextRole === 'admin'
      ? `Promover ${member.full_name} a Administrador?`
      : `Remover privilégios de Administrador de ${member.full_name}?`;

    if (!window.confirm(msg)) return;

    setUpdatingId(member.id);
    try {
      await authService.updateUserRole(member.id, nextRole);
      onProfileUpdated(member.id, { role: nextRole });
    } catch (err) {
      alert('Erro ao atualizar permissão no banco.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Alternar um instrumento na lista do voluntário
  const handleToggleInstrument = async (member, instrument) => {
    if (!isAdmin) return;

    const currentRoles = Array.isArray(member.roles) && member.roles.length > 0
      ? member.roles
      : [member.instrument_role || 'Vocal / Ministro(a)'];

    let updatedRoles = [];
    if (currentRoles.includes(instrument)) {
      if (currentRoles.length === 1) {
        alert('O voluntário deve possuir pelo menos uma função atribuída.');
        return;
      }
      updatedRoles = currentRoles.filter((r) => r !== instrument);
    } else {
      updatedRoles = [...currentRoles, instrument];
    }

    setUpdatingId(member.id);
    try {
      await authService.updateUserRolesList(member.id, updatedRoles);
      onProfileUpdated(member.id, { roles: updatedRoles });
    } catch (err) {
      alert('Erro ao atualizar instrumentos do membro.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMembers = profiles.filter((m) =>
    (m.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Equipa de Voluntários <Users className="w-5 h-5 text-[#a3e635]" />
          </h2>
          <p className="text-xs text-zinc-400">
            {isAdmin 
              ? 'Faça a gestão dos papéis, funções musicais e acessos administrativos de cada voluntário.' 
              : 'Lista de membros e ministros ativos na equipa de louvor.'}
          </p>
        </div>

        {/* Campo de pesquisa */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Pesquisar voluntário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131614] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
          />
        </div>
      </div>

      {/* Lista de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member) => {
          const isTargetAdmin = member.role === 'admin';
          const isMe = member.id === currentUserId;
          const memberRoles = Array.isArray(member.roles) && member.roles.length > 0
            ? member.roles
            : [member.instrument_role || 'Vocal / Ministro(a)'];

          return (
            <div
              key={member.id}
              className="bg-[#131614] border border-zinc-800/80 hover:border-zinc-700 rounded-3xl p-5 flex flex-col justify-between transition-all"
            >
              <div>
                {/* Linha de Identificação & Permissão */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isTargetAdmin 
                        ? 'bg-[#a3e635]/15 border border-[#a3e635]/40 text-[#a3e635]' 
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                    }`}>
                      {isTargetAdmin ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-white leading-tight">{member.full_name}</h3>
                        {isMe && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-semibold">
                            Você
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 block">{member.email}</span>
                    </div>
                  </div>

                  {/* Botão de Alternar Admin (visível para quem é admin) */}
                  {isAdmin && (
                    <button
                      type="button"
                      disabled={updatingId === member.id || isMe}
                      onClick={() => handleToggleAdmin(member)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isTargetAdmin
                          ? 'bg-[#a3e635] text-black hover:bg-red-500 hover:text-white'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-[#a3e635] hover:text-[#a3e635]'
                      }`}
                      title={isMe ? 'Não pode alterar a sua própria permissão' : 'Alternar cargo'}
                    >
                      {isTargetAdmin ? (
                        <>
                          <Shield className="w-3.5 h-3.5 fill-black" />
                          Admin
                        </>
                      ) : (
                        'Tornar Admin'
                      )}
                    </button>
                  )}
                </div>

                {/* Secção de Funções / Instrumentos */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  <span className="text-[11px] font-bold text-zinc-400 block mb-2">
                    Funções e Instrumentos:
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_INSTRUMENTS.map((inst) => {
                      const isSelected = memberRoles.includes(inst);

                      return (
                        <button
                          key={inst}
                          type="button"
                          disabled={!isAdmin || updatingId === member.id}
                          onClick={() => handleToggleInstrument(member, inst)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-[#a3e635]/15 border border-[#a3e635] text-[#a3e635]'
                              : 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-500 hover:border-zinc-700'
                          } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          {inst}
                          {isSelected && <Check className="w-3 h-3 text-[#a3e635]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Data de Nascimento / Aniversário se existir */}
              {member.birth_date && (
                <div className="mt-3 pt-2 text-[10px] text-zinc-500">
                  Data de Nascimento: {member.birth_date.split('-').reverse().join('/')}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}