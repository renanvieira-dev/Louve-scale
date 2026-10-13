import React from 'react';
import { Music, Play, ExternalLink, Trash2 } from 'lucide-react';

export default function SongCard({ song, isAdmin = false, onDeleteSong }) {
  return (
    <div className="bg-[#131614] border border-zinc-800/80 hover:border-[#a3e635]/50 rounded-3xl p-5 flex flex-col justify-between transition-all group relative">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300">
            {song.tag || 'Adoração'}
          </span>
          
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] text-[11px] font-bold">
              Tom: {song.default_key}
            </span>

            {/* Botão de Excluir Música (Apenas Admin) */}
            {isAdmin && onDeleteSong && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja excluir a música "${song.title}"?`)) {
                    onDeleteSong(song.id);
                  }
                }}
                className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Excluir Música"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-white group-hover:text-[#a3e635] transition-colors leading-tight">
          {song.title}
        </h3>
        <p className="text-xs text-zinc-400 mt-1">{song.artist}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a3e635] hover:underline"
            >
              <Play className="w-3 h-3 fill-[#a3e635]" /> Ouvir
            </a>
          )}
          {song.chords_url && (
            <a
              href={song.chords_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-300 hover:text-white"
            >
              <Music className="w-3 h-3" /> Cifra
            </a>
          )}
        </div>

        {song.chords_url && (
          <a
            href={song.chords_url}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-zinc-300"
            title="Abrir link externo"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}