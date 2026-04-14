"use client";
import { useEffect, useState } from 'react';

export default function OpenGmsPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const intents = {
    settings: "intent:#Intent;action=android.settings.SETTINGS;end",
    playProtect: "intent:#Intent;action=com.google.android.gms.security.settings.PlayProtectSettingsActivity;package=com.google.android.gms;end",
    setPin: "intent:#Intent;action=com.android.settings.password.ChooseLockGeneric;package=com.android.settings;end",
    galaxyStore: "intent:#Intent;action=android.intent.action.VIEW;data=samsungapps://MainPage;end",
    googleSearch: "intent:#Intent;action=com.google.android.googlequicksearchbox.GOOGLE_SEARCH;end",
    developerOptions: "intent:#Intent;action=android.settings.APPLICATION_DEVELOPMENT_SETTINGS;end",
    browser: "intent:#Intent;action=android.intent.action.VIEW;data=https://www.google.com;end"
  };

  const handleAction = (key: keyof typeof intents) => {
    setSelectedAction(key);
    window.location.href = intents[key];
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-1.5 h-8 bg-[#00D2AD] rounded-full shadow-[0_0_10px_#00D2AD] mb-4"></div>
      <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-2">
        Central <span className="text-[#00D2AD]">Bypass Panel</span>
      </h1>
      <p className="text-gray-400 text-xs mb-8 uppercase tracking-widest font-bold">Android 12, 13, 14 & 15 Tools</p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <button 
          onClick={() => handleAction('developerOptions')}
          className="bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-lg hover:-translate-y-1"
        >
          🔌 Ativar Depuração USB (ADB)
        </button>

        <button 
          onClick={() => handleAction('setPin')}
          className="bg-yellow-500 hover:bg-yellow-600 text-[#0f172a] py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-lg hover:-translate-y-1"
        >
          🔑 Definir Novo PIN (Bypass)
        </button>

        <button 
          onClick={() => handleAction('settings')}
          className="bg-[#1e293b] border-2 border-[#00D2AD]/30 hover:border-[#00D2AD] py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all"
        >
          ⚙️ Abrir Configurações
        </button>

        <button 
          onClick={() => handleAction('playProtect')}
          className="bg-[#1e293b] border-2 border-red-500/30 hover:border-red-500 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all"
        >
          🛡️ Desativar Play Protect
        </button>

        <button 
          onClick={() => handleAction('galaxyStore')}
          className="bg-[#1e293b] border-2 border-purple-500/30 hover:border-purple-500 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all"
        >
          🏪 Abrir Galaxy Store
        </button>

        <button 
          onClick={() => handleAction('googleSearch')}
          className="bg-[#1e293b] border-2 border-blue-500/30 hover:border-blue-500 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all"
        >
          🔍 Abrir Google Search
        </button>
      </div>

      <div className="mt-12 p-6 bg-[#112328] border border-[#00D2AD]/20 rounded-3xl text-left">
          <h3 className="text-sm font-black text-[#00D2AD] uppercase underline mb-2">Instruções para Técnicos:</h3>
          <ul className="text-[10px] text-gray-400 space-y-2 uppercase font-bold leading-tight">
            <li>1. Use o botão <span className="text-white">🔑 Definir PIN</span> para criar uma nova senha.</li>
            <li>2. Se o celular aceitar o PIN, termine o setup e use a senha nova para pular a conta Google.</li>
            <li>3. Use a <span className="text-white">🏪 Galaxy Store</span> para baixar o "Alliance Shield" se precisar de ADB.</li>
          </ul>
      </div>

      <p className="mt-8 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">Central GSM Premium Tools</p>
    </div>
  );
}
