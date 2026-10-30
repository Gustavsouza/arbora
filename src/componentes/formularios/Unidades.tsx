import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usePomar } from '@/estado/pomar';
import { numero } from '@/lib/formato';
import { codigoDaUnidade, esquemaUnidade, type EntradaUnidade, type SaidaUnidade } from '@/validacao/esquemas';
import { Botao } from '@/componentes/ui/botao';
import { Entrada } from '@/componentes/ui/campos';
import { Dialogo, useConfirmar } from '@/componentes/ui/dialogo';
import { Selo } from '@/componentes/ui/diversos';

/** Unidades de medida: as da planilha são fixas; o proprietário pode criar outras (ex.: "sacas"). */
export function GerenciarUnidades({ aberto, aoMudar }: { aberto: boolean; aoMudar: (v: boolean) => void }) {
  const { unidades, colheitas, criarUnidade, apagarUnidade } = usePomar();
  const confirmar = useConfirmar();
  const [salvando, setSalvando] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntradaUnidade, unknown, SaidaUnidade>({
    resolver: zodResolver(esquemaUnidade), defaultValues: { nome: '', fatorKg: '' },
  });

  async function enviar(v: SaidaUnidade) {
    setSalvando(true);
    const r = await criarUnidade({ codigo: codigoDaUnidade(v.nome), nome: v.nome, fatorKg: v.fatorKg });
    setSalvando(false);
    if (!r.ok) { toast.error(r.mensagem); return; }
    toast.success('Medida criada.', { description: r.valor.nome });
    reset();
  }

  async function apagar(codigo: string, nome: string) {
    if (!(await confirmar({ titulo: `Apagar “${nome}”?`, acao: 'Apagar', texto: 'A medida sai da lista. Só dá para apagar medidas que não foram usadas em nenhuma colheita.' }))) return;
    const r = await apagarUnidade(codigo);
    if (r.ok) toast.success('Medida apagada.'); else toast.error(r.mensagem);
  }

  return (
    <Dialogo aberto={aberto} aoMudar={aoMudar} titulo="Medidas"
      descricao="Só kg e gramas entram no total em kg. Cachos, caixas etc. são somados à parte, a não ser que você diga quanto pesa cada um.">
      <ul className="mb-5 divide-y divide-linha rounded-controle border border-linha">
        {unidades.map((u) => {
          const emUso = colheitas.some((c) => c.unidade === u.codigo);
          return (
            <li key={u.codigo} className="flex min-h-12 items-center justify-between gap-2 px-3.5 py-2">
              <span className="font-medium">{u.nome}</span>
              <span className="flex items-center gap-2">
                {u.fatorKg !== null && <Selo tom="verde">{u.codigo === 'kg' ? 'base' : `= ${numero(u.fatorKg, 6)} kg`}</Selo>}
                {u.padrao ? <Selo>já vem no app</Selo> : (
                  <Botao variante="discreta" tamanho="icone" aria-label={`Apagar ${u.nome}`} disabled={emUso} title={emUso ? 'Já usada em colheitas' : undefined}
                    onClick={() => void apagar(u.codigo, u.nome)} className="text-erro hover:bg-erro-suave"><Trash2 /></Botao>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <form onSubmit={handleSubmit(enviar)} noValidate className="grid gap-3 rounded-controle bg-superficie-suave p-4">
        <h3 className="text-base">Nova medida</h3>
        <Entrada rotulo="Nome" placeholder="Ex.: sacas de 20 kg" {...register('nome')} erro={errors.nome?.message} />
        <Entrada rotulo="Quanto pesa uma, em kg?" opcional inputMode="decimal" placeholder="Ex.: 20" {...register('fatorKg')} erro={errors.fatorKg?.message}
          ajuda="Preencha só se o peso for sempre o mesmo. Em branco, essa medida nunca entra no total em kg." />
        <Botao type="submit" carregando={salvando}>Criar medida</Botao>
      </form>
    </Dialogo>
  );
}
