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
  videoUrl?: string; // YouTube or other
  steps: MethodStep[];
  files?: { name: string; url: string; size: string }[];
}

export const mockMethods: DeviceMethod[] = [
  {
    id: 'samsung-a10-frp',
    brand: 'Samsung',
    model: 'A10',
    category: 'FRP',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    steps: [
      { title: 'Passo 1', description: 'Conecte o aparelho no Wi-Fi.' },
      { title: 'Passo 2', description: 'Abra a ferramenta SanFirm ou SamFw Tool no seu PC.' },
      { title: 'Passo 3', description: 'Clique em "Remove FRP" e siga as instruções na tela do celular (*#0*#).' },
    ],
    files: [
      { name: 'SamFw_Tool_v4.9.zip', url: '#', size: '15 MB' },
      { name: 'Drivers_Samsung.zip', url: '#', size: '20 MB' }
    ]
  },
  {
    id: 'samsung-a20-frp',
    brand: 'Samsung',
    model: 'A20',
    category: 'FRP',
    steps: [
      { title: 'Passo 1', description: 'Conecte o aparelho no Wi-Fi.' },
      { title: 'Passo 2', description: 'Ative o modo Teste (*#0*#).' },
      { title: 'Passo 3', description: 'Utilize o UnlockTool aba Samsung > Remove FRP.' },
    ],
    files: [
      { name: 'Drivers_Samsung.zip', url: '#', size: '20 MB' }
    ]
  },
  {
    id: 'xiaomi-note9-frp',
    brand: 'Xiaomi',
    model: 'Redmi Note 9',
    category: 'FRP',
    steps: [
      { title: 'Passo 1', description: 'Desligue o aparelho e entre em modo BROM (Volume UP + Down e conecte o cabo).' },
      { title: 'Passo 2', description: 'Abra o SP Flash Tool ou UnlockTool na aba MediaTek.' },
      { title: 'Passo 3', description: 'Selecione "Erase FRP" e aguarde a finalização.' },
    ],
    files: [
      { name: 'MTK_Drivers.zip', url: '#', size: '5 MB' },
      { name: 'SP_Flash_Tool.zip', url: '#', size: '45 MB' }
    ]
  },
  {
    id: 'motorola-g8-frp',
    brand: 'Motorola',
    model: 'Moto G8',
    category: 'FRP',
    steps: [
      { title: 'Passo 1', description: 'Ligue o aparelho e conecte no Wi-Fi.' },
      { title: 'Passo 2', description: 'Altere o idioma para um não latino para bugar o teclado.' },
      { title: 'Passo 3', description: 'Acesse as configurações via YouTube/Chrome > Configurações > Acessibilidade, ative o menu.' },
      { title: 'Passo 4', description: 'Desative o Google Play Services e volte a tela inicial para prosseguir offline.' },
    ]
  },
  {
    id: 'samsung-knox-mdm',
    brand: 'Samsung',
    model: 'Knox (Universal)',
    category: 'MDM',
    steps: [
      { title: 'Passo 1', description: 'Faça Root no aparelho ou utilize um firmware modificado.' },
      { title: 'Passo 2', description: 'Utilize o Chimera Tool para Desabilitar o Knox.' },
    ],
    files: [
      { name: 'Odin_v3.14.zip', url: '#', size: '3 MB' },
      { name: 'Firwmare_Patch_Knox.tar', url: '#', size: '2.5 GB' }
    ]
  },
  {
    id: 'motorola-mdm',
    brand: 'Motorola',
    model: 'PayJoy Removal',
    category: 'MDM',
    steps: [
      { title: 'Passo 1', description: 'Necessário desbloquear o Bootloader.' },
      { title: 'Passo 2', description: 'Flashear arquivo via Fastboot apagando as partições persist e metadata.' },
    ],
    files: [
      { name: 'Fastboot_Tools.zip', url: '#', size: '10 MB' },
      { name: 'Moto_Fix_PayJoy.bat', url: '#', size: '1 KB' }
    ]
  }
];
