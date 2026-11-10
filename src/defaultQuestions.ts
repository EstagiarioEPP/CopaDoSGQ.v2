import { Question, GameTheme } from './types';

/**
 * BANCO OFICIAL DAS 25 PERGUNTAS — COPA DO SGQ ACIM (NOVEMBRO DE 2026)
 *
 * Divisão fixa por dia (sem sorteio e sem repetição):
 * - 16/11/2026: Q01 a Q05 (5S e Gestão da Informação + Não Conformidades)
 * - 17/11/2026: Q06 a Q10 (Não Conformidades + Objetivos e Indicadores + Riscos)
 * - 18/11/2026: Q11 a Q15 (Riscos + Missão, Visão, Valores e Política da Qualidade)
 * - 19/11/2026: Q16 a Q20 (Visão Sistêmica e Melhoria Contínua + Atendimento)
 * - 20/11/2026: Q21 a Q25 (Atendimento + LGPD)
 */
export const OFFICIAL_25_QUESTIONS: Question[] = [
  // --- 16/11/2026: Perguntas 1 a 5 ---
  {
    id: 'Q01',
    pergunta: 'Qual é a principal finalidade do 5S em uma organização?',
    respostas: {
      A: 'Aumentar a quantidade de documentos produzidos.',
      B: 'Organizar o ambiente, eliminar desperdícios e promover hábitos que favoreçam a qualidade.',
      C: 'Reduzir a quantidade de colaboradores de cada setor.',
      D: 'Criar novos processos administrativos.',
    },
    correta: 'B',
    explicacao: 'O 5S busca melhorar a organização, utilização, limpeza, padronização e disciplina, contribuindo para um ambiente mais eficiente.',
    ativo: true,
  },
  {
    id: 'Q02',
    pergunta: 'Um colaborador encontra três versões diferentes de um mesmo procedimento em locais distintos. Qual é o principal risco dessa situação?',
    respostas: {
      A: 'Aumento da produtividade.',
      B: 'Redução do espaço de armazenamento.',
      C: 'Uso de uma informação desatualizada ou incorreta.',
      D: 'Facilidade para escolher a melhor versão.',
    },
    correta: 'C',
    explicacao: 'Quando existem várias versões sem controle adequado, aumenta o risco de alguém utilizar uma informação que não está mais vigente.',
    ativo: true,
  },
  {
    id: 'Q03',
    pergunta: 'Qual situação representa melhor o princípio de organização do 5S?',
    respostas: {
      A: 'Guardar materiais sem identificação para facilitar mudanças futuras.',
      B: 'Manter todos os arquivos na área de trabalho, independentemente da frequência de uso.',
      C: 'Organizar documentos e materiais de forma que sejam facilmente localizados quando necessários.',
      D: 'Acumular materiais antigos para evitar possíveis perdas.',
    },
    correta: 'C',
    explicacao: 'A organização busca definir lugares adequados e facilitar a localização e utilização dos recursos.',
    ativo: true,
  },
  {
    id: 'Q04',
    pergunta: 'O que é uma não conformidade?',
    respostas: {
      A: 'Uma sugestão feita por um colaborador.',
      B: 'O não atendimento a um requisito estabelecido.',
      C: 'Uma melhoria realizada em um processo.',
      D: 'Uma atividade realizada antes do prazo.',
    },
    correta: 'B',
    explicacao: 'Uma não conformidade ocorre quando um requisito definido não é atendido.',
    ativo: true,
  },
  {
    id: 'Q05',
    pergunta: 'Um problema foi corrigido, mas a causa que o originou continua existindo. O que pode acontecer?',
    respostas: {
      A: 'O problema pode voltar a ocorrer.',
      B: 'A não conformidade é automaticamente eliminada para sempre.',
      C: 'O processo deixa de precisar de acompanhamento.',
      D: 'O indicador relacionado deixa de ser necessário.',
    },
    correta: 'A',
    explicacao: 'Corrigir o problema resolve a ocorrência, mas investigar e tratar sua causa ajuda a evitar que ele se repita.',
    ativo: true,
  },

  // --- 17/11/2026: Perguntas 6 a 10 ---
  {
    id: 'Q06',
    pergunta: 'Uma equipe percebe que determinado erro ocorre repetidamente. Qual atitude é mais adequada?',
    respostas: {
      A: 'Corrigir cada erro sem investigar sua origem.',
      B: 'Ignorar os erros quando forem pequenos.',
      C: 'Investigar as causas e definir ações para evitar a recorrência.',
      D: 'Alterar o nome do processo.',
    },
    correta: 'C',
    explicacao: 'A análise das causas permite atuar sobre a origem do problema, e não apenas sobre seus efeitos.',
    ativo: true,
  },
  {
    id: 'Q07',
    pergunta: 'Para que servem os indicadores de desempenho?',
    respostas: {
      A: 'Apenas para preencher relatórios.',
      B: 'Para acompanhar e avaliar o desempenho dos processos.',
      C: 'Para substituir os procedimentos internos.',
      D: 'Para avaliar somente o desempenho individual dos colaboradores.',
    },
    correta: 'B',
    explicacao: 'Indicadores fornecem informações que permitem acompanhar resultados e verificar se os objetivos estão sendo alcançados.',
    ativo: true,
  },
  {
    id: 'Q08',
    pergunta: 'Um setor estabeleceu como objetivo reduzir o tempo de atendimento aos associados. Qual indicador seria mais adequado?',
    respostas: {
      A: 'Número de computadores do setor.',
      B: 'Quantidade de colaboradores.',
      C: 'Tempo médio de atendimento.',
      D: 'Número de reuniões realizadas.',
    },
    correta: 'C',
    explicacao: 'O tempo médio de atendimento mede diretamente o aspecto relacionado ao objetivo definido.',
    ativo: true,
  },
  {
    id: 'Q09',
    pergunta: 'Um indicador apresentou resultado abaixo da meta. Qual deve ser uma atitude adequada?',
    respostas: {
      A: 'Alterar a meta para que o resultado seja atingido.',
      B: 'Ignorar o resultado.',
      C: 'Analisar o resultado e investigar possíveis causas.',
      D: 'Parar de utilizar o indicador.',
    },
    correta: 'C',
    explicacao: 'Resultados abaixo da meta devem ser analisados para compreender as causas e avaliar a necessidade de ações.',
    ativo: true,
  },
  {
    id: 'Q10',
    pergunta: 'No contexto da gestão da qualidade, o que é um risco?',
    respostas: {
      A: 'Um problema que necessariamente já aconteceu.',
      B: 'O efeito da incerteza sobre os resultados esperados.',
      C: 'Uma atividade realizada corretamente.',
      D: 'Uma melhoria já implantada.',
    },
    correta: 'B',
    explicacao: 'O risco está relacionado à possibilidade de algo afetar os resultados esperados, podendo gerar efeitos positivos ou negativos.',
    ativo: true,
  },

  // --- 18/11/2026: Perguntas 11 a 15 ---
  {
    id: 'Q11',
    pergunta: 'Um processo depende exclusivamente de uma pessoa que possui conhecimento específico. Por que isso pode representar um risco?',
    respostas: {
      A: 'Porque a pessoa necessariamente está cometendo uma não conformidade.',
      B: 'Porque o processo pode ser prejudicado caso essa pessoa não esteja disponível.',
      C: 'Porque todo processo deve ter pelo menos cinco responsáveis.',
      D: 'Porque o conhecimento nunca pode ser concentrado em uma pessoa.',
    },
    correta: 'B',
    explicacao: 'A dependência de uma única pessoa pode comprometer a continuidade do processo em situações de ausência ou indisponibilidade.',
    ativo: true,
  },
  {
    id: 'Q12',
    pergunta: 'Qual das situações abaixo representa uma ação de tratamento de risco?',
    respostas: {
      A: 'Esperar o problema acontecer para decidir o que fazer.',
      B: 'Identificar uma possível falha e estabelecer uma medida para reduzir sua probabilidade ou impacto.',
      C: 'Retirar o risco do registro sem análise.',
      D: 'Ignorar riscos considerados inconvenientes.',
    },
    correta: 'B',
    explicacao: 'O tratamento de riscos envolve definir medidas para evitar, reduzir, compartilhar ou lidar adequadamente com seus efeitos.',
    ativo: true,
  },
  {
    id: 'Q13',
    pergunta: 'Qual é a principal diferença entre missão e visão?',
    respostas: {
      A: 'A missão trata do passado e a visão trata dos problemas atuais.',
      B: 'A missão representa a razão de existir da organização e a visão indica onde ela deseja chegar.',
      C: 'A missão apresenta os indicadores e a visão apresenta os procedimentos.',
      D: 'Não existe diferença entre elas.',
    },
    correta: 'B',
    explicacao: 'A missão está relacionada ao propósito da organização, enquanto a visão representa uma direção ou futuro desejado.',
    ativo: true,
  },
  {
    id: 'Q14',
    pergunta: 'Por que os valores organizacionais são importantes no dia a dia?',
    respostas: {
      A: 'Porque orientam comportamentos e decisões dos colaboradores.',
      B: 'Porque servem apenas para materiais publicitários.',
      C: 'Porque substituem os procedimentos internos.',
      D: 'Porque são utilizados somente pela diretoria.',
    },
    correta: 'A',
    explicacao: 'Os valores ajudam a orientar como as pessoas devem agir e tomar decisões dentro da organização.',
    ativo: true,
  },
  {
    id: 'Q15',
    pergunta: 'Qual é uma das funções da Política da Qualidade?',
    respostas: {
      A: 'Definir o salário de cada colaborador.',
      B: 'Estabelecer compromissos e direcionamentos relacionados à qualidade.',
      C: 'Substituir todos os procedimentos da organização.',
      D: 'Determinar somente os horários de atendimento.',
    },
    correta: 'B',
    explicacao: 'A Política da Qualidade apresenta compromissos e direcionamentos que orientam o Sistema de Gestão da Qualidade.',
    ativo: true,
  },

  // --- 19/11/2026: Perguntas 16 a 20 ---
  {
    id: 'Q16',
    pergunta: 'O que significa ter uma visão sistêmica?',
    respostas: {
      A: 'Considerar apenas os resultados do próprio setor.',
      B: 'Entender que processos e setores estão relacionados e podem influenciar uns aos outros.',
      C: 'Evitar contato com outros setores.',
      D: 'Centralizar todas as decisões em uma única área.',
    },
    correta: 'B',
    explicacao: 'A visão sistêmica considera as interações entre processos, setores, pessoas e resultados.',
    ativo: true,
  },
  {
    id: 'Q17',
    pergunta: 'Um setor pretende alterar uma atividade que também afeta outro departamento. Qual atitude demonstra visão sistêmica?',
    respostas: {
      A: 'Fazer a alteração sem comunicar ninguém.',
      B: 'Considerar os impactos da mudança nos processos relacionados.',
      C: 'Informar somente depois que a mudança estiver concluída.',
      D: 'Transferir a responsabilidade para o outro setor.',
    },
    correta: 'B',
    explicacao: 'Mudanças em um processo podem gerar impactos em outros. Avaliar essas relações ajuda a evitar problemas.',
    ativo: true,
  },
  {
    id: 'Q18',
    pergunta: 'Qual situação representa melhor a melhoria contínua?',
    respostas: {
      A: 'Fazer mudanças somente quando ocorrer uma auditoria.',
      B: 'Buscar constantemente oportunidades para melhorar processos e resultados.',
      C: 'Manter todos os processos exatamente iguais.',
      D: 'Corrigir apenas problemas considerados graves.',
    },
    correta: 'B',
    explicacao: 'A melhoria contínua consiste na busca permanente por oportunidades de aperfeiçoamento.',
    ativo: true,
  },
  {
    id: 'Q19',
    pergunta: 'Um associado apresenta uma reclamação durante um atendimento. Qual é a postura mais adequada?',
    respostas: {
      A: 'Interromper o associado para explicar o procedimento.',
      B: 'Ignorar a reclamação se ela parecer pequena.',
      C: 'Ouvir, compreender a situação e buscar o encaminhamento adequado.',
      D: 'Informar que reclamações devem ser feitas somente por escrito.',
    },
    correta: 'C',
    explicacao: 'Um bom atendimento envolve escuta, compreensão da necessidade e encaminhamento adequado da demanda.',
    ativo: true,
  },
  {
    id: 'Q20',
    pergunta: 'Por que é importante registrar informações relacionadas aos atendimentos?',
    respostas: {
      A: 'Apenas para aumentar a quantidade de registros da organização.',
      B: 'Para possibilitar acompanhamento, rastreabilidade e melhoria dos serviços.',
      C: 'Para evitar que o associado volte a entrar em contato.',
      D: 'Para substituir o atendimento pessoal.',
    },
    correta: 'B',
    explicacao: 'Os registros permitem acompanhar demandas, identificar padrões e utilizar informações para melhorar os processos.',
    ativo: true,
  },

  // --- 20/11/2026: Perguntas 21 a 25 ---
  {
    id: 'Q21',
    pergunta: 'Um associado precisa ser encaminhado para outro setor. Qual atitude contribui para uma boa experiência?',
    respostas: {
      A: 'Informar apenas que “não é neste setor”.',
      B: 'Encerrar o atendimento imediatamente.',
      C: 'Orientar claramente o associado sobre onde e como sua demanda será atendida.',
      D: 'Pedir que ele descubra sozinho quem pode ajudá-lo.',
    },
    correta: 'C',
    explicacao: 'Um encaminhamento claro evita retrabalho e reduz o esforço do associado para conseguir atendimento.',
    ativo: true,
  },
  {
    id: 'Q22',
    pergunta: 'Qual alternativa apresenta um exemplo de dado pessoal?',
    respostas: {
      A: 'Nome de uma pessoa.',
      B: 'Nome fantasia de uma empresa.',
      C: 'Número de uma sala da ACIM.',
      D: 'Horário de funcionamento de um setor.',
    },
    correta: 'A',
    explicacao: 'Dado pessoal é uma informação relacionada a uma pessoa natural identificada ou identificável.',
    ativo: true,
  },
  {
    id: 'Q23',
    pergunta: 'Um colaborador possui acesso a dados de associados para executar determinada atividade. Qual prática é mais adequada?',
    respostas: {
      A: 'Compartilhar os dados com qualquer colega que solicitar.',
      B: 'Utilizar os dados somente quando necessário para a finalidade autorizada.',
      C: 'Copiar os dados para seu computador pessoal.',
      D: 'Enviar os dados para seu e-mail pessoal como backup.',
    },
    correta: 'B',
    explicacao: 'O acesso e uso de dados pessoais devem estar relacionados à finalidade legítima e às necessidades da atividade desempenhada.',
    ativo: true,
  },
  {
    id: 'Q24',
    pergunta: 'Qual das alternativas representa um dado pessoal sensível segundo a LGPD?',
    respostas: {
      A: 'Nome completo.',
      B: 'Número de telefone.',
      C: 'Convicção religiosa.',
      D: 'E-mail profissional.',
    },
    correta: 'C',
    explicacao: 'A LGPD considera, entre outros, dados sobre origem racial ou étnica, religião, saúde, vida sexual e opinião política como dados pessoais sensíveis.',
    ativo: true,
  },
  {
    id: 'Q25',
    pergunta: 'Um colaborador percebe que enviou por engano uma planilha contendo dados pessoais para uma pessoa que não deveria recebê-la. O que deve fazer?',
    respostas: {
      A: 'Ignorar o ocorrido se o arquivo já tiver sido enviado.',
      B: 'Apagar a mensagem enviada e não informar ninguém.',
      C: 'Comunicar imediatamente o ocorrido pelos canais internos responsáveis.',
      D: 'Enviar outra mensagem pedindo para o destinatário ignorar o arquivo e considerar o assunto encerrado.',
    },
    correta: 'C',
    explicacao: 'Um possível incidente envolvendo dados pessoais deve ser comunicado rapidamente para que os responsáveis possam avaliar o ocorrido e tomar as providências necessárias.',
    ativo: true,
  },
];

export const DEFAULT_QUESTIONS: Question[] = OFFICIAL_25_QUESTIONS;

export const PRESET_THEMES: GameTheme[] = [
  {
    id: 'sgq',
    name: 'Finais da Copa do SGQ (Oficial ACIM)',
    title: 'COPA DO SGQ 2026',
    subtitle: 'Minijogo de Perguntas e Respostas! 1 tentativa diária por colaborador!',
    primaryColor: '#16a34a',
    accentColor: '#eab308',
    keeperJerseyColor: '#00be98',
    pitchGrassTone: 'classic',
  },
  {
    id: 'finais-sgq-arcade',
    name: 'Finais do SGQ (Verde & Ouro ACIM)',
    title: 'COPA DO SGQ 2026',
    subtitle: 'Minijogo de Perguntas e Respostas! 1 tentativa diária por colaborador!',
    primaryColor: '#059669',
    accentColor: '#facc15',
    keeperJerseyColor: '#00be98',
    pitchGrassTone: 'emerald',
  },
  {
    id: 'brasil',
    name: 'Copa Brasil Canarinho ACIM',
    title: 'COPA BRASIL',
    subtitle: 'Pênalti dos 4 Ângulos',
    primaryColor: '#0284c7',
    accentColor: '#facc15',
    keeperJerseyColor: '#00be98',
    pitchGrassTone: 'arcade',
  },
];
