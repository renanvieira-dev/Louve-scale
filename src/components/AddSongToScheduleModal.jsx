import React, { useState } from 'react';
import { X, Music2, Search, Plus, Check, RotateCcw } from 'lucide-react';

export default function AddSongToScheduleModal({ isOpen, onClose, songsPool = [], onConfirm }) {
  const [activeTab, setActiveTab] = useState('pool'); // 'pool' ou 'new'
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSongId, setSelectedSongId] = useState('');
  const [customKey, setCustomKey] = useState('');

  // Formulário para cadastrar música nova diretamente
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newDefaultKey, setNewDefaultKey] = useState('G');
  const [newTag, setNewTag] = useState('Adoração');
  const [newChordsUrl, setNewChordsUrl] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');

  if (!isOpen) return null;

  const selectedSong = songsPool.find((s) => s.id === selectedSongId);

  // Ao selecionar uma música do repertório, puxa automaticamente o tom original dela
  const handleSelectSong = (song) => {
    setSelectedSongId(song.id);
    setCustomKey(song.default_key || 'C');
  };

  const handleConfirm = (e) => {
    e.preventDefault();

    if (activeTab === 'pool') {
      if (!selectedSongId) {
        alert('Selecione uma música do repertório.');
        return;
      }
      onConfirm({
        type: 'pool',
        songId: selectedSongId,
        songKey: (customKey || selectedSong?.default_key || 'C').trim().toUpperCase()
      });
    } else {
      if (!newTitle.trim()) {
        alert('Informe o título da música.');
        return;
      }
      onConfirm({
        type: 'new',
        songKey: (customKey || newDefaultKey || 'C').trim().toUpperCase(),
        newSong: {
          title: newTitle.trim(),
          artist: newArtist.trim() || 'Ministério de Louvor',
          default_key: (newDefaultKey || 'C').trim().toUpperCase(),
          tag: newTag,
          chords_url: newChordsUrl.trim(),
          youtube_url: newYoutubeUrl.trim()
        }
      });
    }

    // Resetar campos
    setSelectedSongId('');
    setCustomKey('');
    setNewTitle('');
    setNewArtist('');
    setSearchFilter('');
    onClose();
  };

  const filteredPool = songsPool.filter((s) =>
    (s.title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.artist || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs">
              <Music2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Adicionar Música à Escala</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas: Escolher do Repertório vs Criar Nova */}
        <div className="p-4 pb-0">
          <div className="flex bg-[#0b0d0c] p-1.5 rounded-2xl border border-zinc-800 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('pool')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pool'
                  ? 'bg-[#a3e635] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Escolher do Repertório ({songsPool.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('new');
                if (!customKey) setCustomKey(newDefaultKey);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-[#a3e635] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              + Nova Música na Hora
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'pool' ? (
            <>
              {/* Barra de Busca rápida */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por título ou artista..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              {/* Lista de músicas existentes */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredPool.length > 0 ? (
                  filteredPool.map((song) => {
                    const isSelected = selectedSongId === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#182315] border-[#a3e635] shadow-sm shadow-[#a3e635]/20'
                            : 'bg-[#0b0d0c] border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{song.title}</p>
                          <span className="text-[11px] text-zinc-400">{song.artist}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                            Tom Original: <strong className="text-[#a3e635]">{song.default_key}</strong>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#a3e635]" />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-4 italic">
                    Nenhuma música encontrada no repertório.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Formulário de Criação Rápida */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Título da Música *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Bondade de Deus"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Artista / Ministério</label>
                  <input
                    type="text"
                    placeholder="Ex: Isaías Saad"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Tom Original Padrão</label>
                  <input
                    type="text"
                    placeholder="Ex: G, D, Bm"
                    value={newDefaultKey}
                    onChange={(e) => {
                      setNewDefaultKey(e.target.value);
                      setCustomKey(e.target.value);
                    }}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Categoria</label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  >
                    <option value="Adoração">Adoração</option>
                    <option value="Celebração / Júbilo">Celebração / Júbilo</option>
                    <option value="Abertura">Abertura</option>
                    <option value="Comunhão">Comunhão</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Link da Cifra (Cifra Club ou PDF)</label>
                <input
                  type="url"
                  placeholder="https://www.cifraclub.com.br/..."
                  value={newChordsUrl}
                  onChange={(e) => setNewChordsUrl(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Link do YouTube</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>
          )}

          {/* Área de Definição do Tom para Esta Escala */}
          <div className="pt-4 border-t border-zinc-800/80 bg-[#0b0d0c]/70 p-4 rounded-2xl border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#a3e635]"></span>
                  Tom a ser tocado nesta escala:
                </label>
                <span className="text-[11px] text-zinc-400">
                  {selectedSong ? (
                    <>Tom original cadastrado: <strong className="text-[#a3e635]">{selectedSong.default_key}</strong></>
                  ) : (
                    'Puxa o tom original automaticamente ou digite o tom desejado.'
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: G, D, Em"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-24 bg-zinc-900 border border-zinc-700 focus:border-[#a3e635] rounded-xl px-3 py-2 text-center text-sm font-black text-[#a3e635] uppercase focus:outline-none"
                />

                {/* Botão de Restaurar o Tom Original se foi alterado */}
                {selectedSong && customKey !== selectedSong.default_key && (
                  <button
                    type="button"
                    onClick={() => setCustomKey(selectedSong.default_key)}
                    className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Restaurar tom original"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 border-t border-zinc-800/80 flex items-center justify-end gap-2 bg-[#0e1110]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#a3e635] hover:bg-[#b5f448] text-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#a3e635]/20"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Adicionar à Escala
          </button>
        </div>

      </div>
    </div>
  );
}