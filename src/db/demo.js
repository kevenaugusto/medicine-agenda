// Dados fictícios para demonstração (Etapa 4) e testes de usabilidade.

import { limparTudo, uid } from './db.js'
import { criarMedicamento } from './medicamentos.js'
import { criarPaciente } from './pacientes.js'

const horario = (hora, dose = '') => ({ id: uid(), hora, dose, ativo: true })

export async function carregarDadosDeExemplo() {
  await limparTudo()
  const paciente = await criarPaciente({
    nome: 'Maria de Fátima Souza',
    dataNascimento: '1945-03-12',
    observacoes: 'Demonstração: caso fictício criado com os dados de exemplo.',
  })

  await criarMedicamento({
    pacienteId: paciente.id,
    nome: 'Losartana 50 mg',
    quantidade: '50',
    unidade: 'mg',
    instrucoes: 'Tomar todos os dias, após o almoço.',
    horarios: [horario('08:00'), horario('20:00')],
  })

  await criarMedicamento({
    pacienteId: paciente.id,
    nome: 'Metformina 850 mg',
    quantidade: '850',
    unidade: 'mg',
    instrucoes: 'Junto das refeições principais.',
    horarios: [
      horario('07:30', '1 comprimido'),
      horario('12:30', '1 comprimido'),
      horario('19:30', '1 comprimido'),
    ],
  })

  await criarMedicamento({
    pacienteId: paciente.id,
    nome: 'Sinvastatina',
    quantidade: '20',
    unidade: 'mg',
    instrucoes: 'Administrar à noite.',
    horarios: [horario('21:00')],
  })

  return paciente
}
