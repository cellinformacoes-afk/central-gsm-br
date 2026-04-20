export type Categoria = 'FRP' | 'MDM';

export interface MethodStep {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface DeviceMethod {
  id: string;
  brand: string;
  model: string;
  category: Categoria;
  videoUrl?: string;
  steps: MethodStep[];
  files?: { name: string; url: string; size: string }[];
}

export const mockMethods: DeviceMethod[] = [
  // --- REALME SPD ---
  {
    id: 'realme-note-50-frp', brand: 'REALME SPD', model: 'REALME NOTE 50', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Abrir UnlockTool e selecionar módulo SPD.' }, { title: 'Passo 2', description: 'Erase FRP via Test Point ou Download Mode.' }]
  },
  {
    id: 'realme-note-50-mdm', brand: 'REALME SPD', model: 'REALME NOTE 50', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Reset MDM via Auth ID (Servidor).' }]
  },
  {
    id: 'realme-note-60-frp', brand: 'REALME SPD', model: 'REALME NOTE 60', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Remoção de Conta Google via SPD Loader.' }]
  },
  {
    id: 'realme-note-60-mdm', brand: 'REALME SPD', model: 'REALME NOTE 60', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Bypass MDM via SPD Special Tool.' }]
  },
  {
    id: 'realme-note-60x-frp', brand: 'REALME SPD', model: 'REALME NOTE 60X', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Reset via UART/SPD.' }]
  },
  {
    id: 'realme-note-60x-mdm', brand: 'REALME SPD', model: 'REALME NOTE 60X', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Unlock MDM PayJoy.' }]
  },
  {
    id: 'realme-c61-frp', brand: 'REALME SPD', model: 'REALME C61', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Reset FRP Unisoc Module.' }]
  },
  {
    id: 'realme-c61-mdm', brand: 'REALME SPD', model: 'REALME C61', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Remove (New Security).' }]
  },
  {
    id: 'realme-c63-frp', brand: 'REALME SPD', model: 'REALME C63', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Removal via Auth.' }]
  },
  {
    id: 'realme-c63-mdm', brand: 'REALME SPD', model: 'REALME C63', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Bypass PayJoy C63.' }]
  },
  {
    id: 'realme-note-70-frp', brand: 'REALME SPD', model: 'REALME NOTE 70', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Special 2026.' }]
  },
  {
    id: 'realme-note-70-mdm', brand: 'REALME SPD', model: 'REALME NOTE 70', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Patch Note 70.' }]
  },
  {
    id: 'realme-c71-frp', brand: 'REALME SPD', model: 'REALME C71', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Removal.' }]
  },
  {
    id: 'realme-c71-mdm', brand: 'REALME SPD', model: 'REALME C71', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Bypass.' }]
  },
  {
    id: 'realme-c73-frp', brand: 'REALME SPD', model: 'REALME C73', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Generation 2026.' }]
  },
  {
    id: 'realme-c73-mdm', brand: 'REALME SPD', model: 'REALME C73', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM New Gen.' }]
  },

  // --- REALME MTK ---
  {
    id: 'realme-c65-frp', brand: 'REALME MTK', model: 'REALME C65', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Modo BROM (Segurar Volume + e -).' }, { title: 'Passo 2', description: 'Erase FRP via MTK Universal.' }]
  },
  {
    id: 'realme-c65-mdm', brand: 'REALME MTK', model: 'REALME C65', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Reset MDM via Brom Mode MTK.' }]
  },
  {
    id: 'realme-c75-frp', brand: 'REALME MTK', model: 'REALME C75', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Removal via MTK Auth.' }]
  },
  {
    id: 'realme-c75-mdm', brand: 'REALME MTK', model: 'REALME C75', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Bypass C75.' }]
  },
  {
    id: 'realme-c75x-frp', brand: 'REALME MTK', model: 'REALME C75X', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Erase FRP (New Security).' }]
  },
  {
    id: 'realme-c75x-mdm', brand: 'REALME MTK', model: 'REALME C75X', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Unlock PayJoy C75X.' }]
  },
  {
    id: 'realme-14t-frp', brand: 'REALME MTK', model: 'REALME 14T', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Advanced FRP MTK 2026.' }]
  },
  {
    id: 'realme-14t-mdm', brand: 'REALME MTK', model: 'REALME 14T', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Complete Bypass.' }]
  },

  // --- MOTOROLA ---
  {
    id: 'motorola-frp', brand: 'MOTOROLA', model: 'FRP (Contas Google)', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Ative o Wi-Fi e mude o idioma.' }, { title: 'Passo 2', description: 'Desabilite Google Play Services.' }]
  },
  {
    id: 'motorola-mdm', brand: 'MOTOROLA', model: 'MDM / PayJoy', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Flashear persist via Fastboot.' }]
  },

  // --- INFINIX MTK ---
  {
    id: 'infinix-frp', brand: 'INFINIX MTK', model: 'FRP (Contas Google)', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Modo BROM (Vol + e -).' }, { title: 'Passo 2', description: 'Erase FRP via MTK Tool.' }]
  },
  {
    id: 'infinix-mdm', brand: 'INFINIX MTK', model: 'MDM / PayJoy', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Reset MDM em modo BROM.' }]
  },

  // --- TECNO MTK ---
  {
    id: 'tecno-frp', brand: 'TECNO MTK', model: 'FRP (Contas Google)', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Modo BROM para conexão.' }, { title: 'Passo 2', description: 'Remoção via UnlockTool.' }]
  },
  {
    id: 'tecno-mdm', brand: 'TECNO MTK', model: 'MDM / PayJoy', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Reset MDM via Tool DL.' }]
  },

  // --- INTEL MTK ---
  {
    id: 'intel-frp', brand: 'INTEL MTK', model: 'FRP (Contas Google)', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'BROM Mode > Reset FRP.' }]
  },
  {
    id: 'intel-mdm', brand: 'INTEL MTK', model: 'MDM / PayJoy', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Reset MDM Intel Special Tool.' }]
  },

  // --- POCO ---
  {
    id: 'poco-frp', brand: 'POCO', model: 'FRP (Contas Google)', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Fastboot/Sideload ou BROM.' }]
  },
  {
    id: 'poco-mdm', brand: 'POCO', model: 'MDM / PayJoy', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Unlock Bootloader + Mi Bypass.' }]
  },

  // --- XIAOMI ---
  {
    id: 'xiaomi-frp', brand: 'XIAOMI', model: 'FRP (Contas Google)', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Sideload Mi Assistant.' }]
  },
  {
    id: 'xiaomi-mdm', brand: 'XIAOMI', model: 'MDM / PayJoy', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Patch Firmware Bypass.' }]
  }
];
