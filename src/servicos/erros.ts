// Erros do banco em frases do dia a dia. Nunca mostra código técnico, nome de tabela ou detalhe interno.
const REGRAS: [RegExp, string][] = [
  [/SUPABASE_NAO_CONFIGURADO/, 'O aplicativo ainda não foi ligado ao banco de dados. Avise quem instalou.'],
  [/DATA_NO_FUTURO/, 'A data não pode ser depois de hoje.'],
  [/CULTURA_INATIVA/, 'Esta planta está arquivada. Desarquive em “Meu pomar” para anotar algo nela.'],
  [/PLANTAS_ACIMA_DO_PLANTIO/, 'O número de pés é maior do que o anotado nesse local.'],
  [/plantio_da_cultura/, 'O local escolhido é de outra planta. Escolha um local desta planta.'],
  [/UNIDADE_DO_SISTEMA/, 'As medidas que já vêm no sistema não podem ser mudadas nem apagadas.'],
  [/culturas_nome_unico/, 'Já existe uma planta com esse nome.'],
  [/unidades_nome_unico|unidades_medida_pkey/, 'Já existe uma medida com esse nome.'],
  [/colheitas_unidade_fkey|violates foreign key constraint.*unidades_medida/, 'Essa medida já foi usada em alguma colheita e não pode ser apagada.'],
  [/violates foreign key constraint/, 'Isso está ligado a outras anotações e não pode ser apagado.'],
  [/culturas_meses_validos/, 'Escolha meses de janeiro a dezembro.'],
  [/culturas_dias_/, 'Confira os dias: o “de” não pode ser maior que o “até”.'],
  [/char_length|value too long/, 'Algum texto ficou grande demais. Encurte e tente de novo.'],
  [/check constraint|violates check/, 'Algum valor não está certo. Confira o que foi preenchido.'],
  [/row-level security|permission denied|42501/i, 'Isso não pode ser feito aqui.'],
  [/Failed to fetch|NetworkError|network|Load failed/i, 'Sem conexão com o servidor. Verifique a internet e tente de novo.'],
];

export function mensagemDeErro(erro: unknown): string {
  const texto = erro instanceof Error ? erro.message
    : typeof erro === 'object' && erro !== null
      ? ['message', 'details', 'hint', 'code'].map((k) => (erro as Record<string, unknown>)[k]).filter(Boolean).join(' ')
      : String(erro ?? '');
  for (const [re, msg] of REGRAS) if (re.test(texto)) return msg;
  return 'Não foi possível concluir. Tente de novo em instantes.';
}
