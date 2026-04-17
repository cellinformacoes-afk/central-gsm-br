export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Perfil do Usuário</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Gerencie as informações da sua conta.</p>
      </div>

      <div className="bg-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
         <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold">
               U
            </div>
            <div>
               <h2 className="text-xl font-bold">Usuário Demo</h2>
               <p className="text-gray-500 dark:text-gray-400">cliente@exemplo.com</p>
               <span className="inline-block mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-xs font-bold">Conta Ativa</span>
            </div>
         </div>

         <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                  <input type="text" defaultValue="Usuário Demo" readOnly className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" defaultValue="cliente@exemplo.com" readOnly className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed" />
               </div>
            </div>

         </div>
      </div>
    </div>
  )
}
