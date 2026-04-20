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
  // --- REALME ---
  {
    id: 'realme-frp', brand: 'REALME', model: 'FRP (Contas Google)', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Conecte no Wi-Fi e acesse o menu de ajuda.' }, { title: 'Passo 2', description: 'UnlockTool via EDL/BROM.' }]
  },
  {
    id: 'realme-mdm', brand: 'REALME', model: 'MDM / PayJoy', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Auth ID necessário para Reset MDM.' }]
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
