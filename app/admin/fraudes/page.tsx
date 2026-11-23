"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminFraudesPage() {
  const router = useRouter();

  // Estados de busca
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  // Estados de saldo customizado
  const [amountToRemove, setAmountToRemove] = useState('');

  // Estados de Blacklist
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estados de Ações
  const [actionLoading, setActionLoading] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('Contestação indevida de Pix (MED) / Fraude');

  useEffect(() => {
    checkAdmin();
    fetchBlacklist();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
    }
  }

  async function fetchBlacklist() {
    setLoadingData(true);
    try {
      const resBl = await fetch('/api/admin/anti-fraude?list_banned=true');
      const dataBl = await resBl.json();
      if (dataBl.success) {
        setBlacklist(dataBl.blacklist || []);
      }
    } catch (err) {
      console.error('Erro ao carregar blacklist:', err);
    }
    setLoadingData(false);
  }

  // Buscar cliente por e-mail ou CPF
  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError('');
    setUserData(null);
    setAmountToRemove('');

    try {
      const res = await fetch(`/api/admin/anti-fraude?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || 'Erro na consulta');
      } else if (!data.found && (!data.blacklistEntries || data.blacklistEntries.length === 0)) {
        setSearchError('Nenhum cliente encontrado com este E-mail ou CPF.');
      } else {
        setUserData(data);
      }
    } catch (err: any) {
      setSearchError('Falha ao comunicar com o servidor: ' + err.message);
    }
    setSearching(false);
  }

  // Banir Usuário (Zerar Saldo + Bloquear CPF + Bloquear E-mail)
  async function handleBanUser() {
    if (!userData?.user && (!userData?.blacklistEntries || userData.blacklistEntries.length === 0)) {
      alert('Nenhum usuário selecionado.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/anti-fraude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban',
          userId: userData.user?.id,
          email: userData.user?.email || searchQuery,
          cpf: userData.user?.cpf || searchQuery,
          reason: banReason
        })
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setBanModalOpen(false);
        handleSearch();
        fetchBlacklist();
      } else {
        alert('Erro ao banir: ' + result.error);
      }
    } catch (err: any) {
      alert('Erro técnico: ' + err.message);
    }
    setActionLoading(false);
  }

  // Desbloquear Usuário
  async function handleUnbanUser() {
    if (!confirm('Deseja realmente DESBLOQUEAR este cliente? Ele poderá se cadastrar e logar novamente.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/anti-fraude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unban',
          userId: userData?.user?.id,
          email: userData?.user?.email || (searchQuery.includes('@') ? searchQuery : ''),
          cpf: userData?.user?.cpf || (!searchQuery.includes('@') ? searchQuery : '')
        })
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        handleSearch();
        fetchBlacklist();
      } else {
        alert('Erro: ' + result.error);
      }
    } catch (err: any) {
      alert('Erro técnico: ' + err.message);
    }
    setActionLoading(false);
  }

  // Remover valor personalizado do saldo (ex: tirar 9 e deixar 1, ou zerar)
  async function handleDeductBalance(removeAll: boolean = false) {
    if (!userData?.user?.id) return;
    const currentBalance = userData.user.balance || 0;

    let valueToDeduct = removeAll ? currentBalance : parseFloat(amountToRemove);

    if (isNaN(valueToDeduct) || valueToDeduct <= 0) {
      alert('Por favor, informe um valor válido maior que R$ 0,00 para remover.');
      return;
    }

    if (valueToDeduct > currentBalance) {
      if (!confirm(`O valor informado (R$ ${valueToDeduct.toFixed(2)}) é maior que o saldo atual (R$ ${currentBalance.toFixed(2)}). Deseja zerar todo o saldo existente?`)) {
        return;
      }
      valueToDeduct = currentBalance;
    }

    const remaining = Math.max(0, currentBalance - valueToDeduct);
    const msg = removeAll
      ? `Deseja ZERAR TODO o saldo de R$ ${currentBalance.toFixed(2)} deste cliente?`
      : `Deseja remover R$ ${valueToDeduct.toFixed(2)} do saldo? O cliente ficará com R$ ${remaining.toFixed(2)}.`;

    if (!confirm(msg)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/anti-fraude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_balance',
          userId: userData.user.id,
          amount: valueToDeduct,
          reason: 'Ajuste / Remoção por contestação de Pix'
        })
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setAmountToRemove('');
        handleSearch();
      } else {
        alert('Erro: ' + result.error);
      }
    } catch (err: any) {
      alert('Erro técnico: ' + err.message);
    }
    setActionLoading(false);
  }

  // Remover item individual da tabela Blacklist
  async function handleRemoveBlacklistItem(id: string, cpfOrEmail: string) {
    if (!confirm(`Deseja remover "${cpfOrEmail}" da lista de bloqueio?`)) return;

    try {
      const res = await fetch('/api/admin/anti-fraude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_blacklist_item',
          id
        })
      });

      const result = await res.json();
      if (result.success) {
        fetchBlacklist();
        if (userData) handleSearch();
      } else {
        alert('Erro: ' + result.error);
      }
    } catch (err: any) {
      alert('Erro técnico: ' + err.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AdminNav />

      {/* Título Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <span>🛡️</span> CONTROLE DE <span className="text-red-500">SALDO & BLOQUEIOS</span>
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            Pesquise por CPF ou E-mail para ver saldo, remover valores contestados e banir contas.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs font-black text-red-400 uppercase tracking-widest">
            {blacklist.length} Banidos Atualmente
          </span>
        </div>
      </div>

      {/* SEÇÃO 1: BUSCADOR POR EMAIL OU CPF */}
      <div className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

        <h2 className="text-xs font-black text-[#00D2AD] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span>🔍</span> Digite o E-mail ou CPF do Cliente
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: cliente@email.com ou 123.456.789-00"
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-base focus:border-[#00D2AD] outline-none transition-all placeholder:text-gray-600 font-bold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setUserData(null); setSearchError(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold bg-white/5 px-2 py-1 rounded"
              >
                Limpar
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              searching || !searchQuery.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-[#00D2AD] text-[#0f172a] hover:bg-[#00BDA0] shadow-[0_10px_20px_rgba(0,210,173,0.25)] hover:-translate-y-0.5'
            }`}
          >
            {searching ? 'Buscando...' : 'Buscar Cliente'}
            {!searching && <span>➔</span>}
          </button>
        </form>

        {/* Mensagem de Erro / Não encontrado */}
        {searchError && (
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 text-sm font-bold flex items-center gap-3">
            <span>⚠️</span> {searchError}
          </div>
        )}

        {/* RESULTADO DA BUSCA: CARD COMPLETO DO CLIENTE */}
        {userData && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Lado Esquerdo: Identificação do Cliente (Nome, E-mail, CPF, Status) */}
              <div className="lg:col-span-6 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                    <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Nome Cadastrado</span>
                      <h3 className="text-xl font-black text-white">
                        {userData.user?.username || 'Cliente Sem Nome'}
                      </h3>
                    </div>

                    {/* Badge de Status */}
                    <div>
                      {userData.isBanned ? (
                        <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                          <span>🚫</span> CONTA BLOQUEADA
                        </span>
                      ) : (
                        <span className="bg-[#00D2AD]/20 text-[#00D2AD] border border-[#00D2AD]/30 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                          <span>✅</span> CONTA ATIVA
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações de Contato / Documento (E-mail e CPF bem destacados) */}
                  <div className="space-y-3 mt-4">
                    <div className="bg-[#1e293b]/70 p-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-black text-[#00D2AD] uppercase tracking-widest block mb-1">
                        📧 E-MAIL DO CLIENTE
                      </span>
                      <span className="text-base font-mono font-black text-white select-all break-all">
                        {userData.user?.email || (searchQuery.includes('@') ? searchQuery : 'Não informado')}
                      </span>
                    </div>

                    <div className="bg-[#1e293b]/70 p-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-black text-[#00D2AD] uppercase tracking-widest block mb-1">
                        🆔 CPF DO CLIENTE
                      </span>
                      <span className="text-base font-mono font-black text-white select-all">
                        {userData.user?.cpf
                          ? userData.user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                          : (!searchQuery.includes('@') ? searchQuery : 'Não cadastrado')}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de motivo se já estiver banido */}
                  {userData.blacklistEntries && userData.blacklistEntries.length > 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                      <span className="font-black uppercase block mb-1">Motivo do bloqueio:</span>
                      {userData.blacklistEntries.map((b: any, idx: number) => (
                        <div key={idx} className="font-medium">• {b.reason || 'Sem motivo registrado'}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Desbloquear (se estiver banido) ou Botão de Banir */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  {userData.isBanned ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleUnbanUser}
                      className="w-full py-3.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <span>🔓</span> DESBLOQUEAR ESTE CLIENTE (LIBERAR CONTA)
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setBanModalOpen(true)}
                      className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      <span>🚫</span> BANIR E BLOQUEAR CONTA (CPF + E-MAIL)
                    </button>
                  )}
                </div>
              </div>

              {/* Lado Direito: Saldo no Site + Escolher quanto remover */}
              <div className="lg:col-span-6 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    Saldo Disponível no Site
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white italic tracking-tight">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(userData.user?.balance || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor que o cliente tem em conta para gastar no site.
                  </p>

                  {/* REMOVER VALOR ESPECÍFICO */}
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <label className="text-[11px] font-black text-[#00D2AD] uppercase tracking-widest block mb-2">
                      💸 Escolha quanto deseja remover deste saldo:
                    </label>

                    <div className="relative mb-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">
                        R$
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amountToRemove}
                        onChange={(e) => setAmountToRemove(e.target.value)}
                        placeholder="Ex: 9.00 (para tirar 9 e deixar 1)"
                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white font-black text-base focus:border-[#00D2AD] outline-none"
                      />
                    </div>

                    {/* Botões de Ação de Saldo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Botão para remover o valor digitado */}
                      <button
                        type="button"
                        disabled={actionLoading || !amountToRemove || parseFloat(amountToRemove) <= 0}
                        onClick={() => handleDeductBalance(false)}
                        className={`py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          !amountToRemove || parseFloat(amountToRemove) <= 0
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20'
                        }`}
                      >
                        <span>➖</span> Remover R$ {amountToRemove || '0,00'}
                      </button>

                      {/* Botão para zerar todo o saldo de uma vez */}
                      <button
                        type="button"
                        disabled={actionLoading || (userData.user?.balance || 0) <= 0}
                        onClick={() => handleDeductBalance(true)}
                        className={`py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          (userData.user?.balance || 0) <= 0
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30'
                        }`}
                      >
                        <span>💥</span> Zerar Tudo (R$ 0,00)
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-500 mt-2">
                      💡 Exemplo: Se o cliente tem R$ 10,00 e você colocar 9,00, o sistema remove R$ 9,00 e ele fica com R$ 1,00.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: TABELA DE QUEM ESTÁ BANIDO (LISTA NEGRA ATIVA) */}
      <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
              <span>🚫</span> Clientes Banidos Atualmente ({blacklist.length})
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Estes CPFs e E-mails estão bloqueados e não conseguem logar nem criar novas contas.
            </p>
          </div>
          <button
            onClick={fetchBlacklist}
            className="text-xs font-bold text-[#00D2AD] hover:underline"
          >
            ↻ Atualizar
          </button>
        </div>

        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#0f172a] z-10 border-b border-white/5">
              <tr>
                <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento / E-mail</th>
                <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivo do Banimento</th>
                <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loadingData ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Carregando lista...</td></tr>
              ) : blacklist.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nenhum cliente banido no momento.</td></tr>
              ) : (
                blacklist.map((item) => {
                  const isEmail = item.cpf.includes('@');
                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-mono font-bold text-white select-all">
                          {isEmail ? item.cpf : item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                          isEmail ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {isEmail ? 'E-MAIL' : 'CPF'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-400 font-medium">
                          {item.reason || 'Bloqueio administrativo'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleRemoveBlacklistItem(item.id, item.cpf)}
                          className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all"
                        >
                          Desbloquear
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE BANIMENTO */}
      {banModalOpen && userData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl mb-4 text-red-500">
              🚫
            </div>

            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
              Confirmar Banimento & Bloqueio Total
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              O CPF e o E-mail serão bloqueados permanentemente contra novos logins e cadastros.
            </p>

            <div className="my-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Cliente:</span>
                <span className="text-white font-bold">{userData.user?.username || 'Sem nome'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">E-mail:</span>
                <span className="text-white font-mono">{userData.user?.email || searchQuery}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPF:</span>
                <span className="text-white font-mono">{userData.user?.cpf || '---'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-red-500/20">
                <span className="text-red-300 font-bold">Saldo que será ZERADO:</span>
                <span className="text-red-400 font-black text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(userData.user?.balance || 0)}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Motivo do Bloqueio:
              </label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-red-500 outline-none"
                placeholder="Ex: Contestação indevida de Pix (MED Santander)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setBanModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleBanUser}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/30 transition-all"
              >
                {actionLoading ? 'Processando...' : 'Confirmar Banimento'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
