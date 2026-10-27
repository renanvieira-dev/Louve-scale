import React, { useState, useEffect } from 'react';
import { Smartphone, Share, PlusSquare, X, Download } from 'lucide-react';

export default function InstallPwaModal() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado e rodando em modo aplicativo
    const isApp = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
    setIsStandalone(isApp);

    // Captura o evento nativo do Android / Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Se já estiver instalado como app, não exibe o botão
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    // 1. Se for Android ou PC com suporte ao prompt direto:
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }

    // 2. Se for iPhone/iPad (iOS) ou sem suporte ao evento automático:
    const isIOSDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIOSDevice) {
      setShowIOSModal(true);
    } else {
      // Caso seja navegador desktop sem suporte imediato
      alert('Para instalar, clique no ícone de instalação na barra de endereço ou no menu do navegador.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        title="Instalar LouveScale no seu dispositivo"
      >
        <Smartphone className="w-4 h-4 flex-shrink-0 animate-pulse" />
        <span className="hidden sm:inline">Baixar App</span>
        <span className="sm:hidden">App</span>
      </button>

      {/* Pop-up explicativo exclusivo para iOS (único sistema que exige o toque no Compartilhar) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-church-card border border-church-border rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative text-slate-200">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-church-blue text-white flex items-center justify-center font-black">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base leading-tight">Instalar no iPhone</h3>
                <p className="text-[11px] text-slate-400">Instalação na tela de início</p>
              </div>
            </div>

            <div className="space-y-3 bg-church-dark p-3.5 rounded-2xl border border-church-border text-xs leading-relaxed">
              <p className="font-semibold text-slate-300">A Apple exige 2 passos rápidos no Safari:</p>
              <div className="space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-church-blue flex items-center justify-center font-bold">1</span>
                  <span>Toque no botão <strong>Compartilhar</strong> (ícone quadrado com seta)</span>
                  <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-church-blue flex items-center justify-center font-bold">2</span>
                  <span>Role um pouco e toque em:</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-church-border text-white font-bold flex items-center gap-2 text-xs">
                  <PlusSquare className="w-4 h-4 text-church-blue" />
                  Adicionar à Tela de Início
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-church-blue hover:bg-church-blue-hover text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}