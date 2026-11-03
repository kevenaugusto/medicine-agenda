// Montagem da agenda diária a partir dos dados em memória (cálculo puro).

import { dataComHora, diaKey, formatarDose } from '../utils/format.js'

const JANELA_ATRASO_MIN = 10

/**
 * Combina paciente(s), medicamentos e registros do dia em grupos de doses por
 * horário. Retorna { grupos, proximaDose, totalPendentes }.
 */
export function montarAgenda({ pacientes, medicamentos, registros, data = new Date() }) {
  const nomes = new Map(pacientes.map((p) => [p.id, p.nome]))
  const registrosDoDia = registros.filter((r) => r.dia === diaKey(data))
  const agora = Date.now()

  const itens = []
  for (const medicamento of medicamentos) {
    if (!medicamento.ativo) continue
    for (const horario of medicamento.horarios || []) {
      if (!horario.ativo) continue
      const dataPrevista = dataComHora(data, horario.hora)
      const registro = registrosDoDia.find(
        (r) => r.medicamentoId === medicamento.id && r.horarioId === horario.id,
      )
      itens.push({
        medicamento,
        horario,
        pacienteNome: nomes.get(medicamento.pacienteId) ?? 'Paciente não encontrado',
        doseRotulo: horario.dose || formatarDose(medicamento.quantidade, medicamento.unidade),
        dataPrevista,
        registro,
        passouDoHorario: !registro && dataPrevista.getTime() < agora - JANELA_ATRASO_MIN * 60 * 1000,
      })
    }
  }

  itens.sort((a, b) => a.dataPrevista - b.dataPrevista || a.pacienteNome.localeCompare(b.pacienteNome, 'pt-BR'))

  const grupos = []
  for (const item of itens) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.chave === item.horario.hora) {
      ultimo.doses.push(item)
    } else {
      grupos.push({ chave: item.horario.hora, doses: [item] })
    }
  }

  return {
    grupos,
    proximaDose: itens.find((i) => !i.registro && i.dataPrevista.getTime() >= agora) || null,
    totalPendentes: itens.filter((i) => !i.registro).length,
  }
}
