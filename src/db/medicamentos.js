// Repositório de medicamentos (store "medicamentos", com horários embutidos).

import { adicionar, atualizar, emTransacao, listar, listarPorIndice, obter, uid } from './db.js'
import { removerRegistrosDoMedicamentoNaTransacao } from './registros.js'

export async function listarMedicamentos() {
  const medicamentos = await listar('medicamentos')
  return medicamentos.sort((a, b) => String(a.criadoEm).localeCompare(String(b.criadoEm)))
}

export async function listarMedicamentosPorPaciente(pacienteId) {
  const medicamentos = await listarPorIndice('medicamentos', 'pacienteId', pacienteId)
  return medicamentos.sort((a, b) => String(a.criadoEm).localeCompare(String(b.criadoEm)))
}

export async function buscarMedicamento(id) {
  return obter('medicamentos', id)
}

export async function criarMedicamento(dados) {
  const agora = new Date().toISOString()
  const medicamento = {
    id: uid(),
    pacienteId: dados.pacienteId,
    nome: dados.nome.trim(),
    quantidade: String(dados.quantidade ?? '').trim(),
    unidade: String(dados.unidade ?? '').trim(),
    instrucoes: String(dados.instrucoes ?? '').trim(),
    horarios: dados.horarios,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  return adicionar('medicamentos', medicamento)
}

/** Atualiza apenas os campos informados (valores `undefined` são ignorados). */
export async function atualizarMedicamento(id, dados) {
  const atual = await obter('medicamentos', id)
  if (!atual) throw new Error('Medicamento não encontrado')
  const limpos = Object.fromEntries(Object.entries(dados).filter(([, valor]) => valor !== undefined))
  const medicamento = {
    ...atual,
    ...limpos,
    id: atual.id,
    atualizadoEm: new Date().toISOString(),
  }
  return atualizar('medicamentos', medicamento)
}

export async function alternarVisibilidade(id, ativo) {
  return atualizarMedicamento(id, { ativo: Boolean(ativo) })
}

/** Exclui o medicamento e, na mesma transação, seus registros de administração. */
export async function excluirMedicamento(id) {
  await emTransacao('readwrite', ['medicamentos', 'registros'], (stores) => {
    removerRegistrosDoMedicamentoNaTransacao(stores.registros, id)
    stores.medicamentos.delete(id)
  })
}
