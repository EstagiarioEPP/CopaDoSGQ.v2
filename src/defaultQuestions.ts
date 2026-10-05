import { Question, GameTheme } from './types';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q-rodada-1',
    pergunta: 'Qual é o principal objetivo da metodologia 5S no ambiente de trabalho?',
    respostas: {
      A: 'Aumentar a quantidade de documentos armazenados em cada setor.',
      B: 'Promover organização, limpeza, padronização e disciplina no ambiente de trabalho.',
      C: 'Eliminar todos os registros físicos da organização.',
      D: 'Reduzir o número de colaboradores envolvidos nos processos.'
    },
    correta: 'B',
    explicacao: 'O 5S tem como foco promover organização, limpeza, padronização e disciplina para garantir excelência e segurança.'
  },
  {
    id: 'q-rodada-2',
    pergunta: 'Um colaborador precisa localizar um documento atualizado, mas encontra diversas versões salvas em pastas diferentes. Qual prática contribui para evitar esse problema?',
    respostas: {
      A: 'Salvar uma cópia em cada computador para facilitar o acesso.',
      B: 'Utilizar somente documentos impressos.',
      C: 'Estabelecer critérios de identificação, armazenamento, controle e atualização das informações.',
      D: 'Permitir que cada colaborador altere livremente os documentos.'
    },
    correta: 'C',
    explicacao: 'O controle adequado da informação documentada define critérios claros de identificação, armazenamento e controle de versões.'
  },
  {
    id: 'q-rodada-3',
    pergunta: 'Na metodologia 5S, qual senso está relacionado à manutenção dos bons hábitos e ao cumprimento contínuo dos padrões estabelecidos?',
    respostas: {
      A: 'Seiri – Senso de utilização.',
      B: 'Seiton – Senso de organização.',
      C: 'Seiso – Senso de limpeza.',
      D: 'Shitsuke – Senso de disciplina.'
    },
    correta: 'D',
    explicacao: 'O Shitsuke (disciplina) visa manter os bons hábitos e a conformidade contínua com os padrões de trabalho.'
  },
  {
    id: 'q-rodada-4',
    pergunta: 'O que caracteriza uma não conformidade no Sistema de Gestão da Qualidade?',
    respostas: {
      A: 'Uma situação em que um requisito estabelecido não foi atendido.',
      B: 'Uma sugestão de melhoria apresentada por um colaborador.',
      C: 'Uma atividade realizada dentro do prazo previsto.',
      D: 'Uma mudança planejada em determinado processo.'
    },
    correta: 'A',
    explicacao: 'Uma não conformidade ocorre quando um requisito especificado ou esperado deixa de ser atendido.'
  },
  {
    id: 'q-rodada-5',
    pergunta: 'Após identificar uma não conformidade, a equipe decide corrigir imediatamente o problema. Isso significa necessariamente que a causa foi eliminada?',
    respostas: {
      A: 'Sim, toda correção elimina automaticamente a causa do problema.',
      B: 'Sim, desde que a correção seja registrada no sistema.',
      C: 'Não, corrigir o problema não significa necessariamente eliminar sua causa.',
      D: 'Não, pois nenhuma não conformidade pode ser corrigida imediatamente.'
    },
    correta: 'C',
    explicacao: 'A correção resolve apenas a falha pontual imediata, enquanto a ação corretiva atua na eliminação da causa raiz.'
  }
];

export const PRESET_THEMES: GameTheme[] = [
  {
    id: 'sgq',
    name: 'Finais da Copa do SGQ (Oficial ACIM)',
    title: 'FINAIS DA COPA DO SGQ',
    subtitle: 'Minijogo de Perguntas e Respostas! Tentativa única por colaborador!',
    primaryColor: '#16a34a',
    accentColor: '#eab308',
    keeperJerseyColor: '#00be98',
    pitchGrassTone: 'classic'
  },
  {
    id: 'finais-sgq-arcade',
    name: 'Finais do SGQ (Verde & Ouro ACIM)',
    title: 'FINAIS DA COPA DO SGQ',
    subtitle: 'Minijogo de Perguntas e Respostas! Tentativa única por colaborador!',
    primaryColor: '#059669',
    accentColor: '#facc15',
    keeperJerseyColor: '#00be98',
    pitchGrassTone: 'emerald'
  },
  {
    id: 'brasil',
    name: 'Copa Brasil Canarinho ACIM',
    title: 'COPA BRASIL',
    subtitle: 'Pênalti dos 4 Ângulos',
    primaryColor: '#0284c7',
    accentColor: '#facc15',
    keeperJerseyColor: '#00be98',
    pitchGrassTone: 'arcade'
  }
];
