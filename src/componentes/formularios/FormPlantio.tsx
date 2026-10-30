import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { hojeISO } from '@/dominio/datas';
import { ESTADO, ESTAGIO } from '@/dominio/opcoes';
import type { EstadoAtual, Estagio, Plantio } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { paraCampo } from '@/lib/formato';
import { esquemaPlantio, type EntradaPlantio, type SaidaPlantio } from '@/validacao/esquemas';
import { AreaTexto, Entrada } from '@/componentes/ui/campos';
import { Chips } from '@/componentes/ui/diversos';

export const ID_FORM_PLANTIO = 'form-plantio';

export function FormPlantio({ culturaId, plantio, aoConcluir, aoSalvando }: {
  culturaId: string; plantio?: Plantio; aoConcluir: () => void; aoSalvando: (v: boolean) => void;
}) {
  const { salvarPlantio } = usePomar();
  const { control, register, handleSubmit, formState: { errors } } = useForm<EntradaPlantio, unknown, SaidaPlantio>({
    resolver: zodResolver(esquemaPlantio),
    defaultValues: {
      quantidade: plantio?.quantidade?.toString() ?? '', dataPlantio: plantio?.dataPlantio ?? '', estagio: plantio?.estagio ?? '',
      localizacao: plantio?.localizacao ?? '', exposicaoSolarHoras: paraCampo(plantio?.exposicaoSolarHoras),
      estadoAtual: plantio?.estadoAtual ?? '', observacoes: plantio?.observacoes ?? '',
    },
  });

  async function enviar(v: SaidaPlantio) {
    aoSalvando(true);
    const r = await salvarPlantio({ ...v, culturaId }, plantio?.id ?? null);
    aoSalvando(false);
    if (!r.ok) { toast.error(r.mensagem); return; }
    toast.success(plantio ? 'Local atualizado.' : 'Local adicionado.');
    aoConcluir();
  }

  return (
    <form id={ID_FORM_PLANTIO} onSubmit={handleSubmit(enviar)} noValidate className="grid gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Entrada rotulo="Quantos pés?" inputMode="numeric" placeholder="Ex.: 15" ajuda="Pés ou touceiras" {...register('quantidade')} erro={errors.quantidade?.message} />
        <Entrada rotulo="Horas de sol" inputMode="decimal" placeholder="Ex.: 6" ajuda="Sol direto por dia" {...register('exposicaoSolarHoras')} erro={errors.exposicaoSolarHoras?.message} />
      </div>
      <Entrada rotulo="Onde fica no sítio?" placeholder="Ex.: Perto do açude" {...register('localizacao')} erro={errors.localizacao?.message} />
      <Entrada rotulo="Quando foi plantado?" type="date" max={hojeISO()} opcional {...register('dataPlantio')} erro={errors.dataPlantio?.message}
        ajuda="Pode ser uma data aproximada. Com ela o app calcula a idade da planta." />
      <Controller control={control} name="estagio" render={({ field }) => (
        <Chips<Estagio> rotulo="Fase da planta" colunas={2} permitirVazio valor={field.value as Estagio | ''} aoMudar={field.onChange}
          opcoes={(Object.keys(ESTAGIO) as Estagio[]).map((e) => ({ valor: e, rotulo: ESTAGIO[e] }))} />
      )} />
      <Controller control={control} name="estadoAtual" render={({ field }) => (
        <Chips<EstadoAtual> rotulo="Como está?" colunas={2} permitirVazio valor={field.value as EstadoAtual | ''} aoMudar={field.onChange}
          opcoes={(Object.keys(ESTADO) as EstadoAtual[]).map((e) => ({ valor: e, rotulo: ESTADO[e] }))} />
      )} />
      <AreaTexto rotulo="Observações" opcional {...register('observacoes')} erro={errors.observacoes?.message} />
    </form>
  );
}
