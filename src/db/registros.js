// Repositório de registros de administração (store "registros").
// Cada registro representa a tomada de uma dose prevista (medicamento + horário + dia).

import { adicionar, excluir, listarPorIndice, uid } from './db.js'

export async function buscarPorDia(dia) {
  const registros = await listarPorIndice('registros', 'dia', dia)
  return registros.sort((a, b) => a.dataHoraPrevista.localeCompare(b.dataHoraPrevista))
}

export async function buscarPorMedicamento(medicamentoId) {
  return listarPorIndice('registros', 'medicamentoId', medicamentoId)
}

/**
 * Marca uma dose prevista como administrada. É idempotente (RN-05): se já
 * existe um registro para a mesma combinação (medicamento, horário, dia),
 * devolve o registro existente sem criar duplicidade.
 */
export async function marcar({ medicamentoId, horarioId, dia, dataHoraPrevista, status }) {
  const existentes = await buscarPorDia(dia)
  const existente = existentes.find(
    (r) => r.medicamentoId === medicamentoId && r.horarioId === horarioId,
  )
  if (existente) {
    return { registro: existente, criado: false }
  }
  const registro = {
    id: uid(),
    medicamentoId,
    horarioId,
    dia,
    dataHoraPrevista,
    dataHoraRegistro: new Date().toISOString(),
    status,
  }
  await adicionar('registros', registro)
  return { registro, criado: true }
}

export async function excluirRegistro(id) {
  await excluir('registros', id)
}

/**
 * Remove todos os registros de um medicamento em uma transação já aberta.
 * Usado nas exclusões em cascata (medicamento ou paciente).
 */
export function removerRegistrosDoMedicamentoNaTransacao(store, medicamentoId) {
  const request = store.index('medicamentoId').openCursor(IDBKeyRange.only(medicamentoId))
  request.onsuccess = () => {
    const cursor = request.result
    if (cursor) {
      cursor.delete()
      cursor.continue()
    }
  }
}
