import React, { useState } from 'react';
import SongCard from './SongCard';
import NewSongModal from './NewSongModal';
import { Plus } from 'lucide-react';

export default function SongsView({ 
  songs = [], 
  onAddSong, 
  onDeleteSong, 
  searchQuery = '', 
  isAdmin = false 
}) {
  const [selectedTag, setSelectedTag] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tags = ['Todas', 'Adoração', 'Celebração / Júbilo', 'Abertura', 'Comunhão'];

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      (song.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.default_key || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag === 'Todas' || song.tag === selectedTag;

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#a3e635] text-black shadow-sm'
                  : 'bg-[#131614] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Botão de Adicionar Música (Admin) */}
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#a3e635] hover:bg-[#b5f448] text-black px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Adicionar Música
          </button>
        )}
      </div>

      {/* Grelha de Músicas */}
      {filteredSongs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSongs.map((song) => (
            <SongCard 
              key={song.id} 
              song={song} 
              isAdmin={isAdmin}
              onDeleteSong={onDeleteSong}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#131614] border border-zinc-800/80 rounded-3xl">
          <p className="text-zinc-400 text-sm font-medium">Nenhuma música encontrada com este critério.</p>
          <button
            onClick={() => setSelectedTag('Todas')}
            className="mt-3 text-xs text-[#a3e635] font-semibold hover:underline cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Modal de Cadastro de Música */}
      {isAdmin && (
        <NewSongModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={onAddSong}
        />
      )}
    </div>
  );
}