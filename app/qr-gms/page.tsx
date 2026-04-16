"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function QRGmsPage() {
  const [activeTab, setActiveTab] = useState<'simple' | 'frp' | 'wifi'>('simple');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrContent, setQrContent] = useState('');
  
  // FRP State
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');

  useEffect(() => {
    generateQR();
  }, [activeTab, wifiSsid, wifiPass]);

  const generateQR = () => {
    let content = "";
    if (activeTab === 'simple') {
      const origin = window.location.origin;
      content = `${origin}/open-gms`;
    } else if (activeTab === 'frp') {
      const frpJson = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.afwsamples.testdpc/com.afwsamples.testdpc.DeviceAdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://d.zerofrp.net/tdpc.apk",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "gIIv9S4038N1fJ6X09K_m1R-tV-YyvLp9X6D-V6y-Xk",
        "android.app.extra.PROVISIONING_WIFI_SSID": wifiSsid || "NOME_DO_WIFI",
        "android.app.extra.PROVISIONING_WIFI_PASSWORD": wifiPass || "SENHA_DO_WIFI",
        "android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE": "WPA",
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
          "com.google.android.apps.work.clouddpc.EXTRA_ENROLLMENT_TOKEN": "FRP_BYPASS_MODE"
        }
      };
      content = JSON.stringify(frpJson);
    } else if (activeTab === 'wifi') {
      const ssid = wifiSsid || "NOME_DO_WIFI";
      const pass = wifiPass || "SENHA_DO_WIFI";
      content = `WIFI:S:${ssid};T:WPA;P:${pass};H:false;;`;
    }
    
    setQrContent(content);
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(content)}`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-[#1e293b] rounded-[40px] border border-[#334155] shadow-2xl overflow-hidden p-8 text-center relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2AD]/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-6">
          Central <span className="text-[#00D2AD]">QR Tool</span>
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#0f172a] p-1.5 rounded-2xl mb-8 border border-[#334155]/50">
          <button 
            onClick={() => setActiveTab('simple')}
            className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'simple' ? 'bg-[#00D2AD] text-[#0f172a]' : 'text-gray-500 hover:text-white'}`}
          >
            Modo Simples (GMS)
          </button>
          <button 
            onClick={() => setActiveTab('frp')}
            className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'frp' ? 'bg-[#00D2AD] text-[#0f172a]' : 'text-gray-500 hover:text-white'}`}
          >
            Técnico (FRP)
          </button>
          <button 
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'wifi' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            WiFi (Portal)
          </button>
        </div>

        {(activeTab === 'frp' || activeTab === 'wifi') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left animate-in slide-in-from-top-4 duration-300">
            <div>
              <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 ml-2">SSID Wi-Fi (Nome)</label>
              <input 
                type="text" 
                placeholder="Ex: MinhaRede"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#00D2AD] transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 ml-2">Senha do Wi-Fi</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#00D2AD] transition-all"
              />
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl shadow-inner inline-block mb-8 border-4 border-[#00D2AD]/20 relative group min-w-[280px] min-h-[280px]">
          <div className="absolute inset-0 bg-[#00D2AD]/5 group-hover:bg-transparent transition-all duration-500 rounded-2xl"></div>
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="QR Code Tool" 
              className="w-64 h-64 relative z-10 mx-auto"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-[#00D2AD] animate-pulse">
              Gerando...
            </div>
          )}
        </div>

        <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#334155]/50 mb-8 max-h-[100px] overflow-y-auto custom-scrollbar">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 text-left">Conteúdo do QR:</p>
          <code className="text-[10px] text-[#00D2AD] break-all font-mono leading-tight block text-left">
            {qrContent}
          </code>
        </div>

        <p className="text-gray-400 text-[10px] leading-relaxed mb-8 px-4">
          {activeTab === 'simple' 
            ? "Modo Painel: Use no Chrome para abrir o PIN, Galaxy Store e Configurações (Ideal para Android 15)." 
            : activeTab === 'frp' 
            ? "Use na tela de Bem-Vindo (Android 11/12). Toque 6 vezes na tela para abrir o scanner e provisionar."
            : "Android 15: Conecte o aparelho neste WiFi. O navegador abrirá sozinho ao detectar o Portal."}
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => {
              if (activeTab === 'simple') {
                const intentUri = "intent:#Intent;action=com.google.android.gms.security.settings.PlayProtectSettingsActivity;package=com.google.android.gms;end";
                window.location.href = intentUri;
              } else {
                 window.print();
              }
            }}
            className="w-full bg-[#00D2AD] hover:bg-[#00BDA0] text-[#0f172a] py-4 rounded-2xl font-black uppercase tracking-widest transition-all hover:-translate-y-1 shadow-lg shadow-[#00D2AD]/20"
          >
            {activeTab === 'simple' ? 'Testar Abrir GMS Agora' : activeTab === 'frp' ? 'Imprimir QR Code de Bypass' : 'Imprimir QR de Conexão'}
          </button>
        </div>
          
        <div className="mt-8 pt-8 border-t border-[#334155]/50 overflow-hidden">
          <h3 className="text-[#00D2AD] font-black uppercase text-xs tracking-[0.2em] mb-4">Manual Android 15 (Sem PC)</h3>
          <div className="text-left space-y-4">
             <div className="flex gap-3">
               <div className="w-5 h-5 rounded-full bg-[#00D2AD] text-[#0f172a] flex items-center justify-center font-bold text-[10px] shrink-0">1</div>
               <p className="text-[11px] text-gray-300">Ative o Talkback segurando <b>Vol+ e Vol-</b> por 3 segundos.</p>
             </div>
             <div className="flex gap-3">
               <div className="w-5 h-5 rounded-full bg-[#00D2AD] text-[#0f172a] flex items-center justify-center font-bold text-[10px] shrink-0">2</div>
               <p className="text-[11px] text-gray-300">Desenhe um <b>"L" invertido</b> e diga: <i>"Abrir Assistente Google"</i>.</p>
             </div>
             <div className="flex gap-3">
               <div className="w-5 h-5 rounded-full bg-[#00D2AD] text-[#0f172a] flex items-center justify-center font-bold text-[10px] shrink-0">3</div>
               <p className="text-[11px] text-gray-300">Diga em seguida: <i>"Abrir YouTube"</i>.</p>
             </div>
             <div className="flex gap-3">
               <div className="w-5 h-5 rounded-full bg-[#00D2AD] text-[#0f172a] flex items-center justify-center font-bold text-[10px] shrink-0">4</div>
               <p className="text-[11px] text-gray-300">No YouTube, vá em <b>Configurações &gt; Sobre &gt; Termos da Google</b> para abrir o Chrome.</p>
             </div>
          </div>
        </div>

        <div className="mt-8">
          <Link 
            href="/"
            className="block w-full bg-transparent border-2 border-[#334155] text-gray-400 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest hover:text-white hover:border-white transition-all"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-gray-500 text-xs text-center max-w-sm uppercase font-bold tracking-widest">
        Central GSM: Excelência em Desbloqueios
      </p>
    </div>
  );
}
