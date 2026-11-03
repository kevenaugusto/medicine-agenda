import { useState } from 'react'
import './App.css'
import AgendaDoDia from './views/AgendaDoDia.jsx'
import Configuracoes from './views/Configuracoes.jsx'
import DetalhePaciente from './views/DetalhePaciente.jsx'
import FormMedicamento from './views/FormMedicamento.jsx'
import FormPaciente from './views/FormPaciente.jsx'
import Pacientes from './views/Pacientes.jsx'

export default function App() {
  const [rota, setRota] = useState({ nome: 'agenda' })

  const navegar = (nome, params = {}) => setRota({ nome, ...params })
  const voltarDoPaciente = (atual) =>
    atual.pacienteId ? () => navegar('paciente', { pacienteId: atual.pacienteId }) : () => navegar('pacientes')

  let conteudo
  switch (rota.nome) {
    case 'pacientes':
      conteudo = <Pacientes aoNavegar={navegar} />
      break
    case 'paciente-form':
      conteudo = <FormPaciente pacienteId={rota.pacienteId} aoVoltar={voltarDoPaciente(rota)} />
      break
    case 'paciente':
      conteudo = <DetalhePaciente pacienteId={rota.pacienteId} aoNavegar={navegar} />
      break
    case 'medicamento-form':
      conteudo = (
        <FormMedicamento
          pacienteId={rota.pacienteId}
          medicamentoId={rota.medicamentoId}
          aoVoltar={() => navegar('paciente', { pacienteId: rota.pacienteId })}
        />
      )
      break
    case 'config':
      conteudo = <Configuracoes />
      break
    default:
      conteudo = <AgendaDoDia aoNavegar={navegar} />
  }

  const classeAtiva = (nome, grupo) => (rota.nome === nome || grupo.includes(rota.nome) ? ' ativo' : '')

  return (
    <div className="app">
      <header className="app-cabecalho">
        <div className="app-titulo">
          <h1>Agenda de Medicamentos</h1>
          <span className="app-slogan">apoio à rotina de tratamento</span>
        </div>
        <nav className="app-nav" aria-label="Navegação principal">
          <button type="button" className={`nav-item${classeAtiva('agenda', [])}`} onClick={() => navegar('agenda')}>
            Agenda do dia
          </button>
          <button
            type="button"
            className={`nav-item${classeAtiva('pacientes', ['paciente', 'paciente-form', 'medicamento-form'])}`}
            onClick={() => navegar('pacientes')}
          >
            Pacientes
          </button>
          <button type="button" className={`nav-item${classeAtiva('config', [])}`} onClick={() => navegar('config')}>
            Configurações
          </button>
        </nav>
      </header>

      <main className="app-conteudo">{conteudo}</main>

      <footer className="app-rodape">
        Aplicativo de apoio — não substitui prescrição nem a orientação de profissionais de saúde.
      </footer>
    </div>
  )
}
