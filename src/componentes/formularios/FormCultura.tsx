import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PADRAO } from '@/dominio/opcoes';
import type { Cultura, Padrao } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { comparaTexto, paraCampo } from '@/lib/formato';
import { esquemaCultura, type EntradaCultura, type SaidaCultura } from '@/validacao/esquemas';
import { AreaTexto, Entrada, Seletor } from '@/componentes/ui/campos';
import { SeletorDeMeses } from '@/componentes/ui/diversos';

export const ID_FORM_CULTURA = 'form-cultura';
const iguais = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function FormCultura({ cultura, aoConcluir, aoSalvando }: { cultura?: Cultura; aoConcluir: (c: Cultura) => void; aoSalvando: (v: boolean) => void }) {
  const { salvarCultura, culturas } = usePomar();
  const grupos = [...new Set(culturas.map((c) => c.grupo))].sort(comparaTexto);
  const { control, register, handleSubmit, watch, formState: { errors } } = useForm<EntradaCultura, unknown, SaidaCultura>({
    resolver: zodResolver(esquemaCultura),
    defaultValues: {
      nome: cultura?.nome ?? '', grupo: cultura?.grupo ?? '', descricao: cultura?.descricao ?? '', floracaoEsperada: cultura?.floracaoEsperada ?? '',
      colheitaEsperada: cultura?.colheitaEsperada ?? '', floracaoPadrao: cultura?.floracaoPadrao ?? 'a_confirmar', colheitaPadrao: cultura?.colheitaPadrao ?? 'a_confirmar',
      mesesFloracao: cultura?.mesesFloracao ?? [], mesesFrutificacao: cultura?.mesesFrutificacao ?? [], mesesColheita: cultura?.mesesColheita ?? [],
      floracaoDiasMin: paraCampo(cultura?.floracaoDias?.min), floracaoDiasMax: paraCampo(cultura?.floracaoDias?.max),
      colheitaDiasMin: paraCampo(cultura?.colheitaDias?.min), colheitaDiasMax: paraCampo(cultura?.colheitaDias?.max), observacoes: cultura?.observacoes ?? '',
    },
  });
  const floracaoPadrao = watch('floracaoPadrao');
  const colheitaPadrao = watch('colheitaPadrao');

  async function enviar(v: SaidaCultura) {
    // Mexeu nos meses (ou cadastrou com meses)? Passam a ser "ajustados por você", não mais estimados pela estação.
    const mexeu = !cultura || !iguais(v.mesesFloracao, cultura.mesesFloracao) || !iguais(v.mesesFrutificacao, cultura.mesesFrutificacao) || !iguais(v.mesesColheita, cultura.mesesColheita);
    const temMeses = v.mesesFloracao.length + v.mesesFrutificacao.length + v.mesesColheita.length > 0;
    aoSalvando(true);
    const r = await salvarCultura({
      nome: v.nome, grupo: v.grupo, descricao: v.descricao, floracaoEsperada: v.floracaoEsperada, colheitaEsperada: v.colheitaEsperada,
      floracaoPadrao: v.floracaoPadrao, colheitaPadrao: v.colheitaPadrao, mesesFloracao: v.mesesFloracao, mesesFrutificacao: v.mesesFrutificacao,
      mesesColheita: v.mesesColheita, mesesConfirmados: mexeu ? temMeses : (cultura?.mesesConfirmados ?? false),
      floracaoDias: v.floracaoPadrao === 'apos_plantio' ? { min: v.floracaoDiasMin, max: v.floracaoDiasMax } : null,
      colheitaDias: v.colheitaPadrao === 'apos_plantio' ? { min: v.colheitaDiasMin, max: v.colheitaDiasMax } : null,
      observacoes: v.observacoes, ativo: cultura?.ativo ?? true,
    }, cultura?.id ?? null);
    aoSalvando(false);
    if (!r.ok) { toast.error(r.mensagem); return; }
    toast.success(cultura ? 'Planta atualizada.' : 'Planta adicionada.', { description: r.valor.nome });
    aoConcluir(r.valor);
  }

  const opcoesPadrao = (Object.keys(PADRAO) as Padrao[]).map((p) => <option key={p} value={p}>{PADRAO[p]}</option>);

  return (
    <form id={ID_FORM_CULTURA} onSubmit={handleSubmit(enviar)} noValidate className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada rotulo="Nome" placeholder="Ex.: Jabuticaba" {...register('nome')} erro={errors.nome?.message} />
        <Entrada rotulo="Tipo" placeholder="Ex.: Frutífera" list="grupos-de-cultura" {...register('grupo')} erro={errors.grupo?.message} />
        <datalist id="grupos-de-cultura">{grupos.map((g) => <option key={g} value={g} />)}</datalist>
      </div>
      <AreaTexto rotulo="Descrição" opcional rows={2} {...register('descricao')} erro={errors.descricao?.message} />

      <section className="grid gap-4 rounded-controle bg-superficie-suave p-4">
        <div>
          <h3 className="text-base">Época de florada e colheita</h3>
          <p className="text-sm text-texto-suave">É só uma referência: cada ano pode ser diferente. Marque só os meses que você conhece.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Entrada rotulo="Quando costuma florir" opcional placeholder="Ex.: Primavera–verão" {...register('floracaoEsperada')} erro={errors.floracaoEsperada?.message} />
          <Seletor rotulo="A floração é…" {...register('floracaoPadrao')}>{opcoesPadrao}</Seletor>
          <Entrada rotulo="Quando costuma dar colheita" opcional placeholder="Ex.: Verão–outono" {...register('colheitaEsperada')} erro={errors.colheitaEsperada?.message} />
          <Seletor rotulo="A colheita é…" {...register('colheitaPadrao')}>{opcoesPadrao}</Seletor>
        </div>
        {(floracaoPadrao === 'apos_plantio' || colheitaPadrao === 'apos_plantio') && (
          <div className="grid grid-cols-2 gap-3">
            {floracaoPadrao === 'apos_plantio' && <>
              <Entrada rotulo="Floração: de (dias)" inputMode="numeric" {...register('floracaoDiasMin')} erro={errors.floracaoDiasMin?.message} />
              <Entrada rotulo="até (dias)" inputMode="numeric" {...register('floracaoDiasMax')} erro={errors.floracaoDiasMax?.message} />
            </>}
            {colheitaPadrao === 'apos_plantio' && <>
              <Entrada rotulo="Colheita: de (dias)" inputMode="numeric" {...register('colheitaDiasMin')} erro={errors.colheitaDiasMin?.message} />
              <Entrada rotulo="até (dias)" inputMode="numeric" {...register('colheitaDiasMax')} erro={errors.colheitaDiasMax?.message} />
            </>}
            <p className="col-span-2 text-[0.8125rem] text-texto-suave">Dias contados a partir do dia em que foi plantado.</p>
          </div>
        )}
        <Controller control={control} name="mesesFloracao" render={({ field }) => (
          <SeletorDeMeses rotulo="Meses de floração" valor={field.value} aoMudar={field.onChange} cor="var(--fase-floracao)" />
        )} />
        <Controller control={control} name="mesesFrutificacao" render={({ field }) => (
          <SeletorDeMeses rotulo="Meses com frutos se formando" valor={field.value} aoMudar={field.onChange} cor="var(--fase-frutificacao)" />
        )} />
        <Controller control={control} name="mesesColheita" render={({ field }) => (
          <SeletorDeMeses rotulo="Meses de colheita" valor={field.value} aoMudar={field.onChange} cor="var(--fase-colheita)" />
        )} />
      </section>

      <AreaTexto rotulo="Cuidados e observações" opcional {...register('observacoes')} erro={errors.observacoes?.message} />
    </form>
  );
}
