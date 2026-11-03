// Dados fictícios para demonstração (Etapa 4) e testes de usabilidade.

import { criarConsulta } from './consultas.js'
import { limparTudo, uid } from './db.js'
import { criarMedicamento } from './medicamentos.js'
import { criarPaciente } from './pacientes.js'

const horario = (hora, dose = '') => ({ id: uid(), hora, dose, ativo: true })

// "YYYY-MM-DDTHH:mm" no fuso local (mesmo formato do <input type="datetime-local">).
function formatoDataHoraLocal(data) {
  const dia = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  const horas = `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
  return `${dia}T${horas}`
}

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

  // Consulta para daqui a poucos minutos (testar o alarme "no horário") e
  // outra para amanhã às 14:00 (testar "1 dia antes" = 24 h).
  await criarConsulta({
    pacienteId: paciente.id,
    especialidade: 'Cardiologia',
    profissional: 'Dr. Paulo Henrique Lima',
    endereco: 'Av. das Palmeiras, 100 — Jardim dos Ipês',
    dataHora: formatoDataHoraLocal(new Date(Date.now() + 4 * 60_000)),
    alarmes: ['1h-antes', 'no-horario'],
  })

  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  amanha.setHours(14, 0, 0, 0)
  await criarConsulta({
    pacienteId: paciente.id,
    especialidade: 'Ortopedia',
    profissional: 'Dra. Renata Soares',
    endereco: 'Rua do Comércio, 55 — Centro',
    dataHora: formatoDataHoraLocal(amanha),
    alarmes: ['dia-antes', '15min-antes', 'no-horario'],
  })

  return paciente
}
