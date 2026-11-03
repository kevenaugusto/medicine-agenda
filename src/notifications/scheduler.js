// Agendador de notificações locais: dispara no horário previsto de cada dose
// enquanto a página estiver aberta (aba ativa ou em segundo plano).
// Limitação técnica: com o navegador fechado não há disparo (RN-06; risco R1 do PLAIN).

import { listarMedicamentos } from '../db/medicamentos.js'
import { listarPacientes } from '../db/pacientes.js'
import { buscarPorDia } from '../db/registros.js'
import { dataComHora, diaKey, formatarDose } from '../utils/format.js'
import { exibirNotificacao } from './notifications.js'

const INTERVALO_CHECAGEM_MS = 30 * 1000 // re-sincroniza a cada 30 s
const JANELA_DISPARO_MS = 5 * 60 * 1000 // dispara até 5 min após o horário previsto

let timer = null
const notificadas = new Set()

/** Inicia o agendador (chamado uma vez, na inicialização da aplicação). */
export function iniciarAgendador() {
  verificarHorarios()
  if (!timer) timer = setInterval(verificarHorarios, INTERVALO_CHECAGEM_MS)
  document.addEventListener('visibilitychange', aoVoltarParaABa)
}

function aoVoltarParaABa() {
  if (!document.hidden) verificarHorarios()
}

async function verificarHorarios() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const agora = new Date()
  const dia = diaKey(agora)
  try {
    const [pacientes, medicamentos, registros] = await Promise.all([
      listarPacientes(),
      listarMedicamentos(),
      buscarPorDia(dia),
    ])
    const nomes = new Map(pacientes.map((p) => [p.id, p.nome]))
    const registrados = new Set(registros.map((r) => `${r.medicamentoId}:${r.horarioId}`))

    for (const medicamento of medicamentos) {
      if (!medicamento.ativo) continue
      for (const horario of medicamento.horarios || []) {
        if (!horario.ativo) continue
        const chave = `${medicamento.id}:${horario.id}:${dia}`
        if (notificadas.has(chave)) continue
        if (registrados.has(`${medicamento.id}:${horario.id}`)) continue

        const prevista = dataComHora(agora, horario.hora)
        const atraso = agora.getTime() - prevista.getTime()
        if (atraso < 0 || atraso > JANELA_DISPARO_MS) continue

        const dose = horario.dose || formatarDose(medicamento.quantidade, medicamento.unidade)
        exibirNotificacao(`Hora do remédio: ${medicamento.nome}`, {
          body: `${horario.hora} · ${nomes.get(medicamento.pacienteId) ?? 'Paciente'}${dose ? ` · ${dose}` : ''}`,
          tag: chave, // notificações com a mesma tag se substituem na central
          icon: '/pwa-192x192.png',
        })
        notificadas.add(chave)
      }
    }
  } catch {
    // Silencioso: falha de agenda não deve afetar o restante do aplicativo.
  }
}
