import React, { useState } from 'react';
import { X, Shield, ShieldCheck, User, Users, Check, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

export default function TeamManagementModal({ 
  isOpen, 
  onClose, 
  profiles = [], 
  currentUserId,
  onRoleUpdated 
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleToggleRole = async (targetUser) => {
    // Evita que o admin logado tire seu próprio acesso por engano
    if (targetUser.id === currentUserId) {
      alert('Você não pode alterar seu próprio nível de acesso.');
      return;
    }

    const nextRole = targetUser.role === 'admin' ? 'member' : 'admin';
    const confirmMsg = nextRole === 'admin' 
      ? `Deseja conceder permissão de Administrador para ${targetUser.full_name}? Ele poderá criar/excluir escalas e músicas.`
      : `Deseja remover o cargo de Administrador de ${targetUser.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(targetUser.id);
    try {
      await authService.updateUserRole(targetUser.id, nextRole);
      onRoleUpdated(targetUser.id, nextRole);
    } catch (err) {
      alert('Erro ao atualizar permissão. Verifique suas permissões no Supabase.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = profiles.filter(p => 
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs shadow-md shadow-[#a3e635]/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gerenciar Acessos da Equipe</h3>
              <p className="text-[11px] text-zinc-400">Defina quem pode gerenciar escalas, músicas e membros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Busca rápida */}
        <div className="p-4 border-b border-zinc-800/60">
          <input
            type="text"
            placeholder="Buscar membro por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
          />
        </div>

        {/* Lista de Membros */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filtered.map((member) => {
            const isTargetAdmin = member.role === 'admin';
            const isMe = member.id === currentUserId;

            return (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-[#0b0d0c] border border-zinc-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isTargetAdmin ? 'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}>
                    {isTargetAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate">{member.full_name}</p>
                      {isMe && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-md font-semibold">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {Array.isArray(member.roles) ? member.roles.join(', ') : (member.instrument_role || 'Voluntário')}
                    </p>
                  </div>
                </div>

                {/* Botão de Alternar Permissão */}
                <div>
                  <button
                    type="button"
                    disabled={updatingId === member.id || isMe}
                    onClick={() => handleToggleRole(member)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isTargetAdmin
                        ? 'bg-[#a3e635] text-black hover:bg-red-500 hover:text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-[#a3e635] hover:text-[#a3e635]'
                    }`}
                  >
                    {isTargetAdmin ? (
                      <>
                        <Shield className="w-3.5 h-3.5 fill-black" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" />
                        Tornar Admin
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-[#0e1110] flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#a3e635]" />
            Admins podem criar escalas, adicionar/excluir músicas e gerenciar outros membros.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg font-bold"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}