import { Question, GameTheme } from './types';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'dia-1',
    pergunta: 'Dia 1: No ciclo PDCA, qual etapa tem como objetivo checar e medir os resultados obtidos?',
    respostas: {
      A: 'Etapa "C" (Check / Verificar)',
      B: 'Etapa "P" (Plan / Planejar)',
      C: 'Etapa "D" (Do / Executar)',
      D: 'Etapa "A" (Action / Agir Corretivamente)'
    },
    correta: 'A',
    explicacao: 'A etapa Check (Verificar) avalia se as metas planejadas foram atingidas através de indicadores.'
  },
  {
    id: 'dia-2',
    pergunta: 'Dia 2: Qual é o foco primordial do programa 5S no ambiente corporativo e operacional?',
    respostas: {
      A: 'Aumentar relatórios e burocracia diária',
      B: 'Substituir as normas técnicas de segurança',
      C: 'Reduzir o quadro de colaboradores',
      D: 'Promover organização, limpeza, disciplina e segurança'
    },
    correta: 'D',
    explicacao: 'O 5S cria as bases para a excelência e redução de desperdícios na rotina de trabalho.'
  },
  {
    id: 'dia-3',
    pergunta: 'Dia 3: Ao identificar uma Não Conformidade em um processo, qual atitude correta do SGQ?',
    respostas: {
      A: 'Apenas aplicar punição ao operador responsável',
      B: 'Investigar a causa raiz e definir ação corretiva eficaz',
      C: 'Ignorar o ocorrido para não atrasar a produção',
      D: 'Esconder o desvio até a auditoria seguinte'
    },
    correta: 'B',
    explicacao: 'Tratar a causa raiz impede a reincidência da falha e promove a melhoria contínua.'
  },
  {
    id: 'dia-4',
    pergunta: 'Dia 4: O que significa a sigla SGQ dentro de uma organização?',
    respostas: {
      A: 'Setor Geral de Quantificação',
      B: 'Supervisão Global de Qualificação',
      C: 'Sistema de Gestão da Qualidade',
      D: 'Sindicato Geral dos Químicos'
    },
    correta: 'C',
    explicacao: 'SGQ (Sistema de Gestão da Qualidade) estabelece políticas e objetivos para satisfação do cliente.'
  },
  {
    id: 'dia-5',
    pergunta: 'Dia 5: Segundo a norma ISO 9001, qual destes princípios de gestão é essencial?',
    respostas: {
      A: 'Foco no cliente e melhoria contínua dos processos',
      B: 'Priorizar velocidade sem checagem de conformidade',
      C: 'Centralização extrema sem participação da equipe',
      D: 'Eliminação de registros e evidências de auditoria'
    },
    correta: 'A',
    explicacao: 'O foco no cliente e a melhoria contínua orientam todas as diretrizes da ISO 9001.'
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
