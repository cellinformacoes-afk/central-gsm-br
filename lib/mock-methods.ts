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
    id: 'realme-frp',
    brand: 'REALME',
    model: 'FRP (Contas Google)',
    category: 'FRP',
    steps: [
      { title: 'Passo 1', description: 'Conecte no Wi-Fi e acesse o menu de ajuda.' },
      { title: 'Passo 2', description: 'Utilize o método de bugar o teclado ou UnlockTool via EDL/BROM.' },
    ],
  },
  {
    id: 'motorola-frp',
    brand: 'MOTOROLA',
    model: 'FRP (Contas Google)',
    category: 'FRP',
    steps: [
      { title: 'Passo 1', description: 'Ative o Wi-Fi e mude o idioma.' },
      { title: 'Passo 2', description: 'Acesse o Chrome e desabilite o Google Play Services.' },
    ],
  },
  {
    id: 'infinix-frp',
    brand: 'INFINIX MTK',
    model: 'FRP (Contas Google)',
    category: 'FRP',
    steps: [
      { title: 'Passo 1', description: 'Conecte o cabo em modo BROM (Vol + e -).' },
      { title: 'Passo 2', description: 'Selecione a opção Erase FRP na sua ferramenta MTK.' },
    ],
  },
  {
    id: 'tecno-frp',
    brand: 'TECNO MTK',
    model: 'FRP (Contas Google)',
    category: 'FRP',
    steps: [
      { title: 'Passo 1', description: 'Utilize o modo BROM para conexão.' },
      { title: 'Passo 2', description: 'Execute o procedimento de remoção via UnlockTool ou Pandora.' },
    ],
  },
  {
    id: 'realme-mdm',
    brand: 'REALME',
    model: 'MDM / PayJoy',
    category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Necessário Auth ID ou ferramenta licenciada.' }],
  },
  {
    id: 'motorola-mdm',
    brand: 'MOTOROLA',
    model: 'MDM / PayJoy',
    category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Flashear partição persist via Fastboot.' }],
  },
  {
    id: 'infinix-mdm',
    brand: 'INFINIX MTK',
    model: 'MDM / PayJoy',
    category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Conecte em modo BROM e use a função Reset MDM.' }],
  },
  {
    id: 'tecno-mdm',
    brand: 'TECNO MTK',
    model: 'MDM / PayJoy',
    category: 'MDM',
    steps: [{ title: 'Passo 1', description: 'Utilize ferramenta certificada para Reset MDM (Tool DL).' }],
  }
];
