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
    id: 'moto-g04s-frp', brand: 'MOTOROLA', model: 'Moto G04s', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Ative o Wi-Fi e mude o idioma.' }, { title: 'Passo 2', description: 'Desabilite Google Play Services.' }]
  },
  {
    id: 'moto-g04s-mdm', brand: 'MOTOROLA', model: 'Moto G04s', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Flashear persist via Fastboot.' }]
  },
  {
    id: 'moto-g14-frp', brand: 'MOTOROLA', model: 'Moto G14', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Remoção FRP via RSA ou Manual.' }]
  },
  {
    id: 'moto-g14-mdm', brand: 'MOTOROLA', model: 'Moto G14', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Bypass MDM G14.' }]
  },
  {
    id: 'moto-e40-frp', brand: 'MOTOROLA', model: 'Moto E40', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Modo BROM Reset FRP.' }]
  },
  {
    id: 'moto-e40-mdm', brand: 'MOTOROLA', model: 'Moto E40', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Unlock MDM E40.' }]
  },
  {
    id: 'moto-e32-frp', brand: 'MOTOROLA', model: 'Moto E32', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP via Tool.' }]
  },
  {
    id: 'moto-e32-mdm', brand: 'MOTOROLA', model: 'Moto E32', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Bypass E32.' }]
  },
  {
    id: 'moto-e13-frp', brand: 'MOTOROLA', model: 'Moto E13', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Manual FRP Bypass.' }]
  },
  {
    id: 'moto-e13-mdm', brand: 'MOTOROLA', model: 'Moto E13', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'PayJoy Unlock E13.' }]
  },
  {
    id: 'moto-g35-frp', brand: 'MOTOROLA', model: 'Moto G35', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'New Gen FRP Reset.' }]
  },
  {
    id: 'moto-g35-mdm', brand: 'MOTOROLA', model: 'Moto G35', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Security Patch Bypass.' }]
  },
  {
    id: 'moto-g20-frp', brand: 'MOTOROLA', model: 'Moto G20', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Remoção FRP via SPD Tool (G20 é Unisoc).' }]
  },
  {
    id: 'moto-g20-mdm', brand: 'MOTOROLA', model: 'Moto G20', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Bypass MDM G20.' }]
  },

  // --- INFINIX MTK ---
  {
    id: 'infinix-smart-8-pro-frp', brand: 'INFINIX MTK', model: 'Smart 8 Pro', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Modo BROM (Vol + e -).' }, { title: 'Passo 2', description: 'Erase FRP via MTK Tool.' }]
  },
  {
    id: 'infinix-smart-8-pro-mdm', brand: 'INFINIX MTK', model: 'Smart 8 Pro', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Reset MDM em modo BROM.' }]
  },
  {
    id: 'infinix-smart-9-frp', brand: 'INFINIX MTK', model: 'Smart 9', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Reset 2026.' }]
  },
  {
    id: 'infinix-smart-9-mdm', brand: 'INFINIX MTK', model: 'Smart 9', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Bypass Smart 9.' }]
  },
  {
    id: 'infinix-hot-40-pro-frp', brand: 'INFINIX MTK', model: 'Hot 40 Pro', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Removal BROM.' }]
  },
  {
    id: 'infinix-hot-40-pro-mdm', brand: 'INFINIX MTK', model: 'Hot 40 Pro', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Unlock PayJoy Hot 40 Pro.' }]
  },
  {
    id: 'infinix-hot-40i-frp', brand: 'INFINIX MTK', model: 'Hot 40i', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Reset FRP Special.' }]
  },
  {
    id: 'infinix-hot-40i-mdm', brand: 'INFINIX MTK', model: 'Hot 40i', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Fix Hot 40i.' }]
  },
  {
    id: 'infinix-hot-50-pro-frp', brand: 'INFINIX MTK', model: 'Hot 50 Pro', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'New Security FRP.' }]
  },
  {
    id: 'infinix-hot-50-pro-mdm', brand: 'INFINIX MTK', model: 'Hot 50 Pro', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Complete Bypass.' }]
  },
  {
    id: 'infinix-hot-50-pro-plus-frp', brand: 'INFINIX MTK', model: 'Hot 50 Pro+', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Removal Pro+.' }]
  },
  {
    id: 'infinix-hot-50-pro-plus-mdm', brand: 'INFINIX MTK', model: 'Hot 50 Pro+', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Bypass Pro+.' }]
  },
  {
    id: 'infinix-hot-50i-frp', brand: 'INFINIX MTK', model: 'Hot 50i', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP Reset 50i.' }]
  },
  {
    id: 'infinix-hot-50i-mdm', brand: 'INFINIX MTK', model: 'Hot 50i', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Fix 50i.' }]
  },
  {
    id: 'infinix-note-40x-5g-frp', brand: 'INFINIX MTK', model: 'Note 40X 5G', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'FRP 5G Security.' }]
  },
  {
    id: 'infinix-note-40x-5g-mdm', brand: 'INFINIX MTK', model: 'Note 40X 5G', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Unlock 5G.' }]
  },
  {
    id: 'infinix-note-40-5g-frp', brand: 'INFINIX MTK', model: 'Note 40 5G', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Note 40 FRP.' }]
  },
  {
    id: 'infinix-note-40-5g-mdm', brand: 'INFINIX MTK', model: 'Note 40 5G', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Note 40 MDM.' }]
  },
  {
    id: 'infinix-note-40-4g-frp', brand: 'INFINIX MTK', model: 'Note 40 4G', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Note 40 4G FRP.' }]
  },
  {
    id: 'infinix-note-40-4g-mdm', brand: 'INFINIX MTK', model: 'Note 40 4G', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Note 40 4G MDM.' }]
  },
  {
    id: 'infinix-note-50s-frp', brand: 'INFINIX MTK', model: 'Note 50S', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Note 50S FRP.' }]
  },
  {
    id: 'infinix-note-50s-mdm', brand: 'INFINIX MTK', model: 'Note 50S', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Note 50S MDM.' }]
  },

  // --- TECNO MTK ---
  {
    id: 'tecno-spark-40-5g-frp', brand: 'TECNO MTK', model: 'Tecno Spark 40 5G', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Modo BROM para conexão.' }, { title: 'Passo 2', description: 'Remoção via UnlockTool.' }]
  },
  {
    id: 'tecno-spark-40-5g-mdm', brand: 'TECNO MTK', model: 'Tecno Spark 40 5G', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Reset MDM via Tool DL.' }]
  },
  {
    id: 'tecno-camon-30-5g-frp', brand: 'TECNO MTK', model: 'Tecno Camon 30 5G', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Camon 30 FRP Reset.' }]
  },
  {
    id: 'tecno-camon-30-5g-mdm', brand: 'TECNO MTK', model: 'Tecno Camon 30 5G', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Bypass Camon 30.' }]
  },
  {
    id: 'tecno-spark-go-5g-frp', brand: 'TECNO MTK', model: 'Tecno Spark Go 5G', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Spark Go FRP.' }]
  },
  {
    id: 'tecno-spark-go-5g-mdm', brand: 'TECNO MTK', model: 'Tecno Spark Go 5G', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Reset Spark Go.' }]
  },
  {
    id: 'tecno-pova-6-neo-frp', brand: 'TECNO MTK', model: 'Tecno Pova 6 Neo', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Pova 6 Neo FRP.' }]
  },
  {
    id: 'tecno-pova-6-neo-mdm', brand: 'TECNO MTK', model: 'Tecno Pova 6 Neo', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Unlock Pova 6 Neo.' }]
  },
  {
    id: 'tecno-spark-10-pro-frp', brand: 'TECNO MTK', model: 'Tecno Spark 10 Pro', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Spark 10 Pro FRP.' }]
  },
  {
    id: 'tecno-spark-10-pro-mdm', brand: 'TECNO MTK', model: 'Tecno Spark 10 Pro', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Fix Spark 10 Pro.' }]
  },
  {
    id: 'tecno-spark-30c-frp', brand: 'TECNO MTK', model: 'Tecno Spark 30c', category: 'FRP',
    steps: [{ title: 'Passo 1', description: 'Spark 30c FRP.' }]
  },
  {
    id: 'tecno-spark-30c-mdm', brand: 'TECNO MTK', model: 'Tecno Spark 30c', category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'MDM Bypass Spark 30c.' }]
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
