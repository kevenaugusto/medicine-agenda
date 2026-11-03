// Repositório de consultas médicas (store "consultas").
// Alarmes de lembrete: enum fixo com o offset de minutos antes do horário da
// consulta — "um dia antes" = 24 h exatas (decisão aprovada no plano).

import { adicionar, atualizar, excluir, listar, listarPorIndice, obter, uid } from './db.js'

export const TIPOS_ALARME = [
  { codigo: 'dia-antes', rotulo: '1 dia antes', offsetMin: 24 * 60 },
  { codigo: '1h-antes', rotulo: '1 hora antes', offsetMin: 60 },
  { codigo: '15min-antes', rotulo: '15 minutos antes', offsetMin: 15 },
  { codigo: 'no-horario', rotulo: 'No horário da consulta', offsetMin: 0 },
]

export function rotuloDoAlarme(codigo) {
  return TIPOS_ALARME.find((a) => a.codigo === codigo)?.rotulo ?? codigo
}

export function offsetDoAlarme(codigo) {
  return TIPOS_ALARME.find((a) => a.codigo === codigo)?.offsetMin ?? 0
}

export async function listarConsultas() {
  const consultas = await listar('consultas')
  return consultas.sort((a, b) => a.dataHora.localeCompare(b.dataHora))
}

export async function listarConsultasPorPaciente(pacienteId) {
  return listarPorIndice('consultas', 'pacienteId', pacienteId)
}

export async function buscarConsulta(id) {
  return obter('consultas', id)
}

function normalizarAlarmes(alarmes) {
  const codigosValidos = new Set(TIPOS_ALARME.map((a) => a.codigo))
  return [...new Set(alarmes ?? [])].filter((codigo) => codigosValidos.has(codigo))
}

function validarDados(dados) {
  const especialidade = String(dados.especialidade ?? '').trim()
  const profissional = String(dados.profissional ?? '').trim()
  const dataHora = String(dados.dataHora ?? '').trim()
  const alarmes = normalizarAlarmes(dados.alarmes)

  if (!dados.pacienteId) throw new Error('Selecione o paciente da consulta.')
  if (!especialidade) throw new Error('Informe a especialidade médica.')
  if (!profissional) throw new Error('Informe o profissional responsável.')
  if (!dataHora || Number.isNaN(new Date(dataHora).getTime())) {
    throw new Error('Informe uma data e horário de atendimento válidos.')
  }
  if (alarmes.length === 0) throw new Error('Selecione ao menos um alarme de lembrete.')

  return { pacienteId: dados.pacienteId, especialidade, profissional, dataHora, alarmes }
}

export async function criarConsulta(dados) {
  const campos = validarDados(dados)
  const agora = new Date().toISOString()
  const consulta = {
    id: uid(),
    ...campos,
    endereco: String(dados.endereco ?? '').trim(),
    disparos: [],
    criadoEm: agora,
    atualizadoEm: agora,
  }
  return adicionar('consultas', consulta)
}

export async function atualizarConsulta(id, dados) {
  const atual = await obter('consultas', id)
  if (!atual) throw new Error('Consulta não encontrada')
  const campos = validarDados(dados)
  const consulta = {
    ...atual,
    ...campos,
    endereco: String(dados.endereco ?? '').trim(),
    disparos: (atual.disparos || []).slice(-20),
    atualizadoEm: new Date().toISOString(),
  }
  return atualizar('consultas', consulta)
}

export async function excluirConsulta(id) {
  await excluir('consultas', id)
}

/**
 * Registra um alarme disparado na consulta (regra de não repetição, RN-C3).
 * `horarioAlarme` é o horário previsto do lembrete, usado como chave da
 * instância; o histórico é limitado às últimas 20 entradas.
 */
export async function registrarDisparoDeAlarme(id, tipo, horarioAlarme) {
  const atual = await buscarConsulta(id)
  if (!atual) return
  const disparos = [
    ...(atual.disparos || []),
    { tipo, horarioAlarme, disparadoEm: new Date().toISOString() },
  ]
  await atualizar('consultas', {
    ...atual,
    disparos: disparos.slice(-20),
    atualizadoEm: new Date().toISOString(),
  })
}

/**
 * Remove todas as consultas de um paciente em uma transação já aberta.
 * Usado na exclusão em cascata do paciente (RN-C4).
 */
export function removerConsultasDoPacienteNaTransacao(store, pacienteId) {
  const request = store.index('pacienteId').openCursor(IDBKeyRange.only(pacienteId))
  request.onsuccess = () => {
    const cursor = request.result
    if (cursor) {
      cursor.delete()
      cursor.continue()
    }
  }
}
