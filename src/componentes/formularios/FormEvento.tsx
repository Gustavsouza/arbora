import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { hojeISO } from '@/dominio/datas';
import { CLIMAS, INTENSIDADE, TIPO_EVENTO, TIPOS_EVENTO } from '@/dominio/opcoes';
import type { Evento, Intensidade, TipoEvento } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { cn } from '@/lib/cn';
import { esquemaEvento, type EntradaEvento, type SaidaEvento } from '@/validacao/esquemas';
import { ICONE_EVENTO } from '@/componentes/icones';
import { Botao } from '@/componentes/ui/botao';
import { AreaTexto, Entrada, Seletor } from '@/componentes/ui/campos';
import { Chips } from '@/componentes/ui/diversos';
import { CampoData, MaisDetalhes, OpcoesDeCultura, SeletorDePlantio } from './comuns';

export const ID_FORM_EVENTO = 'form-evento';

const GRUPOS = [
  { grupo: 'ciclo', titulo: 'Ciclo da planta' },
  { grupo: 'manejo', titulo: 'Cuidados' },
  { grupo: 'problema', titulo: 'Problemas' },
] as const;

export function FormEvento({ evento, inicial, aoConcluir, aoSalvando }: {
  evento?: Evento; inicial?: { culturaId?: string; plantioId?: string; tipo?: TipoEvento };
  aoConcluir: () => void; aoSalvando: (v: boolean) => void;
}) {
  const { salvarEvento } = usePomar();
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EntradaEvento, unknown, SaidaEvento>({
    resolver: zodResolver(esquemaEvento),
    defaultValues: {
      culturaId: evento?.culturaId ?? inicial?.culturaId ?? '', plantioId: evento?.plantioId ?? inicial?.plantioId ?? '',
      tipo: (evento?.tipo ?? inicial?.tipo ?? '') as TipoEvento, data: evento?.data ?? hojeISO(), intensidade: evento?.intensidade ?? '',
      plantasAfetadas: evento?.plantasAfetadas?.toString() ?? '', clima: evento?.clima ?? '', observacoes: evento?.observacoes ?? '',
      acaoRealizada: evento?.acaoRealizada ?? '',
    },
  });
  const culturaId = watch('culturaId');
  const clima = watch('clima');

  async function enviar(v: SaidaEvento) {
    aoSalvando(true);
    const r = await salvarEvento(v, evento?.id ?? null);
    aoSalvando(false);
    if (!r.ok) { toast.error(r.mensagem); return; }
    toast.success(evento ? 'Anotação atualizada.' : 'Anotado!', { description: TIPO_EVENTO[v.tipo].rotulo });
    aoConcluir();
  }

  /** Clima: toques nas sugestões montam o texto ("Sol, Calor"); dá para escrever livre também. */
  function alternarClima(c: string) {
    const atuais = clima.split(',').map((x) => x.trim()).filter(Boolean);
    const nova = atuais.includes(c) ? atuais.filter((x) => x !== c) : [...atuais, c];
    setValue('clima', nova.join(', '), { shouldDirty: true });
  }

  return (
    <form id={ID_FORM_EVENTO} onSubmit={handleSubmit(enviar)} noValidate className="grid gap-5">
      <Seletor rotulo="Planta" {...register('culturaId', { onChange: () => setValue('plantioId', '') })} erro={errors.culturaId?.message}>
        <OpcoesDeCultura atual={evento?.culturaId} />
      </Seletor>

      <Controller control={control} name="tipo" render={({ field }) => (
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-semibold">O que aconteceu?</legend>
          {GRUPOS.map(({ grupo, titulo }) => (
            <Chips<TipoEvento> key={grupo} rotulo={titulo} colunas={2}
              opcoes={TIPOS_EVENTO.filter((t) => TIPO_EVENTO[t].grupo === grupo).map((t) => {
                const Icone = ICONE_EVENTO[t];
                return { valor: t, rotulo: TIPO_EVENTO[t].rotulo, icone: <Icone aria-hidden /> };
              })}
              valor={field.value} aoMudar={(v) => field.onChange(v)} />
          ))}
          {errors.tipo && <span role="alert" className="text-[0.8125rem] font-semibold text-erro">{errors.tipo.message}</span>}
        </fieldset>
      )} />

      <Controller control={control} name="data" render={({ field }) => (
        <CampoData rotulo="Quando?" valor={field.value} aoMudar={field.onChange} erro={errors.data?.message} />
      )} />

      <MaisDetalhes abertoInicial={Boolean(evento && (evento.observacoes || evento.intensidade || evento.clima || evento.acaoRealizada || evento.plantasAfetadas))}
        resumo="local, quanto, tempo, observações">
        <Controller control={control} name="plantioId" render={({ field }) => (
          <SeletorDePlantio culturaId={culturaId} valor={field.value} aoMudar={field.onChange} />
        )} />
        <Controller control={control} name="intensidade" render={({ field }) => (
          <Chips<Intensidade> rotulo="Quanto?" colunas={3} permitirVazio valor={field.value as Intensidade | ''} aoMudar={field.onChange}
            opcoes={(Object.keys(INTENSIDADE) as Intensidade[]).map((v) => ({ valor: v, rotulo: INTENSIDADE[v] }))} />
        )} />
        <Entrada rotulo="Quantos pés?" opcional inputMode="numeric" placeholder="Ex.: 3" {...register('plantasAfetadas')} erro={errors.plantasAfetadas?.message} />
        <div className="grid gap-2">
          <Entrada rotulo="Como estava o tempo?" opcional placeholder="Toque abaixo ou escreva" {...register('clima')} erro={errors.clima?.message} />
          <div className="flex flex-wrap gap-1.5" aria-label="Sugestões de tempo">
            {CLIMAS.map((c) => {
              const ativo = clima.split(',').map((x) => x.trim()).includes(c);
              return (
                <button key={c} type="button" aria-pressed={ativo} onClick={() => alternarClima(c)}
                  className={cn('min-h-9 rounded-full border px-3 text-sm', ativo ? 'border-primaria bg-primaria-suave font-semibold text-primaria-forte' : 'border-linha hover:border-borda')}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <AreaTexto rotulo="Observações" opcional placeholder="O que você viu?" {...register('observacoes')} erro={errors.observacoes?.message} />
        <AreaTexto rotulo="O que você fez?" opcional rows={2} placeholder="Ex.: podei os galhos secos" {...register('acaoRealizada')} erro={errors.acaoRealizada?.message} />
      </MaisDetalhes>
    </form>
  );
}

export function BotoesDoForm({ form, salvando, aoCancelar, rotulo = 'Salvar' }: { form: string; salvando: boolean; aoCancelar: () => void; rotulo?: string }) {
  return (
    <>
      <Botao variante="secundaria" onClick={aoCancelar}>Cancelar</Botao>
      <Botao type="submit" form={form} carregando={salvando} className="sm:min-w-36">{rotulo}</Botao>
    </>
  );
}
