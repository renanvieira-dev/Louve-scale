import React from 'react';
import { ExternalLink, Play, Music, Hash } from 'lucide-react';

export default function SongCard({ song }) {
  return (
    <div className="bg-[#131614] border border-zinc-800/80 hover:border-[#a3e635]/60 rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 group">
      <div>
        {/* Cabeçalho do Cartão: Tom e Tag */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-xl bg-[#a3e635] text-black font-extrabold text-xs tracking-tight shadow-sm">
            Tom: {song.default_key}
          </span>
          <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
            {song.bpm} BPM
          </span>
        </div>

        {/* Título e Artista */}
        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#a3e635] transition-colors leading-snug">
          {song.title}
        </h3>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">
          {song.artist}
        </p>

        {/* Categoria/Etiqueta */}
        {song.tag && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-900/60 px-2.5 py-0.5 rounded-md border border-zinc-800">
              <Hash className="w-3 h-3 text-[#a3e635]" />
              {song.tag}
            </span>
          </div>
        )}
      </div>

      {/* Ações: Links para Cifra e Áudio */}
      <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {song.chords_url && (
            <a
              href={song.chords_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 transition-colors"
            >
              <Music className="w-3.5 h-3.5 text-[#a3e635]" />
              Cifra
            </a>
          )}
          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-[#a3e635] fill-[#a3e635]" />
              Áudio
            </a>
          )}
        </div>

        <button 
          type="button"
          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-[#a3e635] text-zinc-400 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
          title="Ver detalhes"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}