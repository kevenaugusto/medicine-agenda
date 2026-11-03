import { useEffect, useMemo, useState } from 'react'
import { excluirConsulta, listarConsultas, rotuloDoAlarme } from '../db/consultas.js'
import { listarPacientes } from '../db/pacientes.js'
import { formatarDataHora } from '../utils/format.js'

export default function Consultas({ aoNavegar }) {
  const [dados, setDados] = useState(null) // { consultas, nomes: Map(id → nome do paciente) }

  useEffect(() => {
    let ativo = true
    Promise.all([listarConsultas(), listarPacientes()]).then(([consultas, pacientes]) => {
      if (ativo) {
        setDados({ consultas, nomes: new Map(pacientes.map((p) => [p.id, p.nome])) })
      }
    })
    return () => {
      ativo = false
    }
  }, [])

  const { proximas, passadas } = useMemo(() => {
    if (!dados) return { proximas: [], passadas: [] }
    const agora = new Date()
    const proximas = []
    const passadas = []
    for (const consulta of dados.consultas) {
      const data = new Date(consulta.dataHora)
      // Data inválida entra em "passadas" para nunca sumir da lista.
      if (Number.isNaN(data.getTime()) || data < agora) passadas.push(consulta)
      else proximas.push(consulta)
    }
    return { proximas, passadas }
  }, [dados])

  const excluir = async (consulta) => {
    const confirma = window.confirm(
      `Excluir a consulta de ${consulta.especialidade} em ${formatarDataHora(consulta.dataHora)}? Essa ação não pode ser desfeita.`,
    )
    if (!confirma) return
    await excluirConsulta(consulta.id)
    const [consultas, pacientes] = await Promise.all([listarConsultas(), listarPacientes()])
    setDados({ consultas, nomes: new Map(pacientes.map((p) => [p.id, p.nome])) })
  }

  const cardConsulta = (consulta) => (
    <li className="card" key={consulta.id}>
      <div className="card-info">
        <strong className="card-titulo">{consulta.especialidade}</strong>
        <span className="card-detalhe">{formatarDataHora(consulta.dataHora)}</span>
        <span className="card-detalhe">{consulta.profissional}</span>
        {consulta.endereco && <span className="card-detalhe secundaria">{consulta.endereco}</span>}
        <button
          type="button"
          className="botao-link consulta-paciente"
          onClick={() => aoNavegar('paciente', { pacienteId: consulta.pacienteId })}
        >
          Paciente: {dados.nomes.get(consulta.pacienteId) ?? '—'}
        </button>
        <div className="chip-horarios">
          {consulta.alarmes.map((codigo) => (
            <span key={codigo} className="chip chip-hora">
              {rotuloDoAlarme(codigo)}
            </span>
          ))}
        </div>
      </div>
      <div className="card-acoes">
        <button
          type="button"
          className="botao-secundario"
          onClick={() => aoNavegar('consulta-form', { consultaId: consulta.id })}
        >
          Editar
        </button>
        <button type="button" className="botao-perigo" onClick={() => excluir(consulta)}>
          Excluir
        </button>
      </div>
    </li>
  )

  const total = dados?.consultas.length ?? 0

  return (
    <section>
      <header className="pagina-cabecalho com-acao">
        <div>
          <h2>Consultas</h2>
          <p className="subtitulo">{dados ? `${total} consulta(s) agendada(s)` : ' '}</p>
        </div>
        <button type="button" className="botao primario" onClick={() => aoNavegar('consulta-form')}>
          Nova consulta
        </button>
      </header>

      {!dados ? (
        <div className="painel">Carregando…</div>
      ) : total === 0 ? (
        <div className="painel vazio">
          <p>
            <strong>Nenhuma consulta agendada ainda.</strong> Toque em “Nova consulta” para
            registrar e receber lembretes.
          </p>
        </div>
      ) : (
        <>
          {proximas.length > 0 && (
            <section className="grupo-consultas" aria-label="Próximas consultas">
              <h3 className="secao-titulo">Próximas</h3>
              <ul className="lista-cards">{proximas.map(cardConsulta)}</ul>
            </section>
          )}
          {passadas.length > 0 && (
            <section className="grupo-consultas" aria-label="Consultas passadas">
              <h3 className="secao-titulo">Passadas</h3>
              <ul className="lista-cards">{passadas.map(cardConsulta)}</ul>
            </section>
          )}
        </>
      )}
    </section>
  )
}
