import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { hojeISO } from '@/dominio/datas';
import { DESTINO, DESTINOS, QUALIDADE } from '@/dominio/opcoes';
import type { Colheita, Destino, Qualidade } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { numero, paraCampo } from '@/lib/formato';
import { esquemaColheita, type EntradaColheita, type SaidaColheita } from '@/validacao/esquemas';
import { AreaTexto, Entrada, Seletor } from '@/componentes/ui/campos';
import { Chips } from '@/componentes/ui/diversos';
import { CampoData, MaisDetalhes, OpcoesDeCultura, SeletorDePlantio } from './comuns';

export const ID_FORM_COLHEITA = 'form-colheita';

export function FormColheita({ colheita, inicial, aoConcluir, aoSalvando }: {
  colheita?: Colheita; inicial?: { culturaId?: string; plantioId?: string }; aoConcluir: () => void; aoSalvando: (v: boolean) => void;
}) {
  const { salvarColheita, unidades, colheitas, culturaPorId } = usePomar();
  // Unidade sugerida: a última usada nesta cultura (comparar safras pede a mesma unidade), senão kg.
  const ultimaUnidade = (culturaId: string) => colheitas.find((c) => c.culturaId === culturaId)?.unidade ?? 'kg';
  const culturaInicial = colheita?.culturaId ?? inicial?.culturaId ?? '';

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EntradaColheita, unknown, SaidaColheita>({
    resolver: zodResolver(esquemaColheita),
    defaultValues: {
      culturaId: culturaInicial, plantioId: colheita?.plantioId ?? inicial?.plantioId ?? '', data: colheita?.data ?? hojeISO(),
      quantidade: paraCampo(colheita?.quantidade), unidade: colheita?.unidade ?? ultimaUnidade(culturaInicial),
      destino: colheita?.destino ?? 'consumo_familiar', qualidade: colheita?.qualidade ?? '', plantasColhidas: colheita?.plantasColhidas?.toString() ?? '',
      observacoes: colheita?.observacoes ?? '',
    },
  });
  const culturaId = watch('culturaId');

  async function enviar(v: SaidaColheita) {
    aoSalvando(true);
    const r = await salvarColheita(v, colheita?.id ?? null);
    aoSalvando(false);
    if (!r.ok) { toast.error(r.mensagem); return; }
    const nomeUnidade = unidades.find((u) => u.codigo === v.unidade)?.nome ?? v.unidade;
    toast.success(colheita ? 'Colheita atualizada.' : 'Colheita registrada.', { description: `${culturaPorId.get(v.culturaId)?.nome ?? ''}: ${numero(v.quantidade, 3)} ${nomeUnidade}` });
    aoConcluir();
  }

  return (
    <form id={ID_FORM_COLHEITA} onSubmit={handleSubmit(enviar)} noValidate className="grid gap-5">
      <Seletor rotulo="Cultura" erro={errors.culturaId?.message}
        {...register('culturaId', { onChange: (e) => { setValue('plantioId', ''); if (!colheita) setValue('unidade', ultimaUnidade(e.target.value)); } })}>
        <OpcoesDeCultura atual={colheita?.culturaId} />
      </Seletor>

      <div className="grid grid-cols-[1fr_auto] items-start gap-2">
        <Entrada rotulo="Quantidade" inputMode="decimal" placeholder="Ex.: 2,5" autoComplete="off" {...register('quantidade')} erro={errors.quantidade?.message}
          className="[&_input]:text-lg [&_input]:font-semibold" />
        <Seletor rotulo="Unidade" {...register('unidade')} erro={errors.unidade?.message} className="min-w-32">
          {unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.nome}</option>)}
        </Seletor>
      </div>

      <Controller control={control} name="data" render={({ field }) => (
        <CampoData rotulo="Data da colheita" valor={field.value} aoMudar={field.onChange} erro={errors.data?.message} />
      )} />

      <Controller control={control} name="destino" render={({ field }) => (
        <Chips<Destino> rotulo="Para onde vai?" colunas={2} valor={field.value} aoMudar={(v) => field.onChange(v || 'consumo_familiar')}
          opcoes={DESTINOS.map((d) => ({ valor: d, rotulo: DESTINO[d] }))} erro={errors.destino?.message} />
      )} />

      <MaisDetalhes abertoInicial={Boolean(colheita && (colheita.qualidade || colheita.observacoes || colheita.plantasColhidas))} resumo="plantio, qualidade, observações">
        <Controller control={control} name="plantioId" render={({ field }) => (
          <SeletorDePlantio culturaId={culturaId} valor={field.value} aoMudar={field.onChange} />
        )} />
        <Controller control={control} name="qualidade" render={({ field }) => (
          <Chips<Qualidade> rotulo="Qualidade" colunas={4} permitirVazio valor={field.value as Qualidade | ''} aoMudar={field.onChange}
            opcoes={(Object.keys(QUALIDADE) as Qualidade[]).map((q) => ({ valor: q, rotulo: QUALIDADE[q] }))} />
        )} />
        <Entrada rotulo="Plantas colhidas" opcional inputMode="numeric" placeholder="Ex.: 4" {...register('plantasColhidas')} erro={errors.plantasColhidas?.message} />
        <AreaTexto rotulo="Observações" opcional {...register('observacoes')} erro={errors.observacoes?.message} />
      </MaisDetalhes>
    </form>
  );
}
