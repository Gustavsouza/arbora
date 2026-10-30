// Erros do banco em frases do dia a dia. Nunca mostra código técnico, nome de tabela ou detalhe interno.
const REGRAS: [RegExp, string][] = [
  [/SUPABASE_NAO_CONFIGURADO/, 'O sistema ainda não foi ligado ao banco de dados. Confira o arquivo .env.local.'],
  [/DATA_NO_FUTURO/, 'A data não pode ser depois de hoje.'],
  [/CULTURA_INATIVA/, 'Esta cultura está inativa. Reative-a em “Meu pomar” para registrar algo nela.'],
  [/PLANTAS_ACIMA_DO_PLANTIO/, 'O número de plantas é maior que a quantidade cadastrada nesse plantio.'],
  [/plantio_da_cultura/, 'O plantio escolhido é de outra cultura. Escolha um plantio desta cultura.'],
  [/UNIDADE_DO_SISTEMA/, 'As unidades padrão não podem ser alteradas nem apagadas.'],
  [/culturas_nome_unico/, 'Já existe uma cultura com esse nome.'],
  [/unidades_nome_unico|unidades_medida_pkey/, 'Já existe uma unidade com esse nome.'],
  [/colheitas_unidade_fkey|violates foreign key constraint.*unidades_medida/, 'Essa unidade está em uso em alguma colheita e não pode ser apagada.'],
  [/violates foreign key constraint/, 'Esse registro está ligado a outros e não pode ser removido.'],
  [/culturas_meses_validos/, 'Escolha meses de janeiro a dezembro.'],
  [/culturas_dias_/, 'Confira os dias do ciclo: o mínimo não pode ser maior que o máximo.'],
  [/char_length|value too long/, 'Algum texto passou do tamanho permitido. Encurte e tente de novo.'],
  [/check constraint|violates check/, 'Algum valor está fora do permitido. Confira os campos.'],
  [/row-level security|permission denied|42501/i, 'O sistema não permite essa operação.'],
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
