// Repositório de pacientes (store "pacientes").

import { adicionar, atualizar, emTransacao, listar, obter, uid } from './db.js'
import { listarMedicamentosPorPaciente } from './medicamentos.js'
import { removerConsultasDoPacienteNaTransacao } from './consultas.js'
import { removerRegistrosDoMedicamentoNaTransacao } from './registros.js'

export async function listarPacientes() {
  const pacientes = await listar('pacientes')
  return pacientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function buscarPaciente(id) {
  return obter('pacientes', id)
}

export async function criarPaciente(dados) {
  const agora = new Date().toISOString()
  const paciente = {
    id: uid(),
    nome: dados.nome.trim(),
    dataNascimento: dados.dataNascimento || '',
    observacoes: String(dados.observacoes ?? '').trim(),
    criadoEm: agora,
    atualizadoEm: agora,
  }
  return adicionar('pacientes', paciente)
}

export async function atualizarPaciente(id, dados) {
  const atual = await obter('pacientes', id)
  if (!atual) throw new Error('Paciente não encontrado')
  const paciente = {
    ...atual,
    id: atual.id,
    nome: dados.nome.trim(),
    dataNascimento: dados.dataNascimento || '',
    observacoes: String(dados.observacoes ?? '').trim(),
    atualizadoEm: new Date().toISOString(),
  }
  return atualizar('pacientes', paciente)
}

/**
 * Exclui o paciente e, em transação única, todos os seus medicamentos, os
 * registros de administração desses medicamentos (RN-02) e as suas consultas
 * médicas (RN-C4).
 */
export async function excluirPaciente(id) {
  const medicamentos = await listarMedicamentosPorPaciente(id)
  await emTransacao(
    'readwrite',
    ['pacientes', 'medicamentos', 'registros', 'consultas'],
    (stores) => {
      for (const medicamento of medicamentos) {
        removerRegistrosDoMedicamentoNaTransacao(stores.registros, medicamento.id)
        stores.medicamentos.delete(medicamento.id)
      }
      removerConsultasDoPacienteNaTransacao(stores.consultas, id)
      stores.pacientes.delete(id)
    },
  )
}
