import {
  Apple, Ban, Bug, Cherry, Droplets, Flower, Flower2, Leaf, NotebookPen, PackageCheck, Scissors, ShoppingBasket, Shovel, TriangleAlert,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { TipoEvento } from '@/dominio/tipos';

type Icone = ComponentType<SVGProps<SVGSVGElement>>;

export const ICONE_EVENTO: Record<TipoEvento, Icone> = {
  floracao_inicio: Flower2, floracao_pico: Flower, floracao_fim: Leaf, sem_floracao: Ban, frutificacao: Cherry, fruto_maduro: Apple,
  colheita_inicio: ShoppingBasket, colheita_fim: PackageCheck, poda: Scissors, adubacao: Shovel, irrigacao: Droplets,
  problema: TriangleAlert, praga_doenca: Bug, outro: NotebookPen,
};

/** Cor do ícone do evento na linha do tempo. */
export const TOM_EVENTO: Record<TipoEvento, string> = {
  floracao_inicio: 'bg-sol-suave text-sol-forte', floracao_pico: 'bg-sol-suave text-sol-forte', floracao_fim: 'bg-sol-suave text-sol-forte',
  sem_floracao: 'bg-fundo-forte text-texto-suave', frutificacao: 'bg-primaria-suave text-primaria', fruto_maduro: 'bg-primaria-suave text-primaria',
  colheita_inicio: 'bg-terra-suave text-terra', colheita_fim: 'bg-terra-suave text-terra', poda: 'bg-primaria-suave text-primaria',
  adubacao: 'bg-terra-suave text-terra', irrigacao: 'bg-[#E3EFF5] text-[#2B6A86]', problema: 'bg-erro-suave text-erro', praga_doenca: 'bg-erro-suave text-erro',
  outro: 'bg-fundo-forte text-texto-suave',
};
