import { useCallback, useEffect, useState } from 'react'
import { excluirConsulta, listarConsultasPorPaciente, rotuloDoAlarme } from '../db/consultas.js'
import { alternarVisibilidade, excluirMedicamento, listarMedicamentosPorPaciente } from '../db/medicamentos.js'
import { buscarPaciente } from '../db/pacientes.js'
import { formatarDataCurta, formatarDataHora, formatarDose } from '../utils/format.js'

export default function DetalhePaciente({ pacienteId, aoNavegar }) {
  const [paciente, setPaciente] = useState(null)
  const [medicamentos, setMedicamentos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [erro, setErro] = useState('')

  // Lê os dados sem atualizar estado — o efeito só sincroniza nas respostas.
  const buscarDados = useCallback(async () => {
    const [p, meds, consultas] = await Promise.all([
      buscarPaciente(pacienteId),
      listarMedicamentosPorPaciente(pacienteId),
      listarConsultasPorPaciente(pacienteId),
    ])
    consultas.sort((a, b) => a.dataHora.localeCompare(b.dataHora))
    return { p, meds, consultas }
  }, [pacienteId])

  useEffect(() => {
    let ativo = true
    buscarDados()
      .then(({ p, meds, consultas }) => {
        if (!ativo) return
        if (!p) {
          setErro('Paciente não encontrado.')
          return
        }
        setPaciente(p)
        setMedicamentos(meds)
        setConsultas(consultas)
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message)
      })
    return () => {
      ativo = false
    }
  }, [buscarDados])

  const alternar = async (medicamento, ativo) => {
    await alternarVisibilidade(medicamento.id, ativo)
    const { p, meds, consultas } = await buscarDados()
    if (p) {
      setPaciente(p)
      setMedicamentos(meds)
      setConsultas(consultas)
    }
  }

  const excluir = async (medicamento) => {
    const confirma = window.confirm(
      `Excluir o medicamento “${medicamento.nome}” e seu histórico de administração?`,
    )
    if (!confirma) return
    await excluirMedicamento(medicamento.id)
    const { p, meds, consultas } = await buscarDados()
    if (p) {
      setPaciente(p)
      setMedicamentos(meds)
      setConsultas(consultas)
    }
  }

  const excluirConsultaPaciente = async (consulta) => {
    const confirma = window.confirm(
      `Excluir a consulta de ${consulta.especialidade} em ${formatarDataHora(consulta.dataHora)}? Essa ação não pode ser desfeita.`,
    )
    if (!confirma) return
    await excluirConsulta(consulta.id)
    const { p, meds, consultas } = await buscarDados()
    if (p) {
      setPaciente(p)
      setMedicamentos(meds)
      setConsultas(consultas)
    }
  }

  if (erro) {
    return (
      <div className="painel erro">
        <p>{erro}</p>
        <button type="button" className="botao-secundario" onClick={() => aoNavegar('pacientes')}>
          Voltar aos pacientes
        </button>
      </div>
    )
  }
  if (!paciente) {
    return <div className="painel">Carregando…</div>
  }

  return (
    <section>
      <button type="button" className="botao-link voltar" onClick={() => aoNavegar('pacientes')}>
        ← Pacientes
      </button>

      <header className="pagina-cabecalho com-acao">
        <div>
          <h2>{paciente.nome}</h2>
          <p className="subtitulo">
            {paciente.dataNascimento
              ? `Nascimento: ${formatarDataCurta(paciente.dataNascimento)}`
              : 'Nascimento não informado'}
          </p>
          {paciente.observacoes && <p className="detalhe-observacoes">{paciente.observacoes}</p>}
        </div>
        <button
          type="button"
          className="botao-secundario"
          onClick={() => aoNavegar('paciente-form', { pacienteId })}
        >
          Editar dados
        </button>
      </header>

      <header className="pagina-cabecalho com-acao">
        <h3 className="secao-titulo">Medicamentos</h3>
        <button
          type="button"
          className="botao primario"
          onClick={() => aoNavegar('medicamento-form', { pacienteId })}
        >
          Novo medicamento
        </button>
      </header>

      {medicamentos.length === 0 ? (
        <div className="painel vazio">
          <p>
            <strong>Nenhum medicamento cadastrado.</strong> Cadastre o primeiro medicamento e
            defina os horários de administração.
          </p>
        </div>
      ) : (
        <ul className="lista-cards">
          {medicamentos.map((med) => (
            <li className={`card${med.ativo ? '' : ' inativo'}`} key={med.id}>
              <div className="card-info">
                <strong className="card-titulo">{med.nome}</strong>
                {formatarDose(med.quantidade, med.unidade) && (
                  <span className="card-detalhe dose">{formatarDose(med.quantidade, med.unidade)}</span>
                )}
                {med.instrucoes && <span className="card-detalhe secundaria">{med.instrucoes}</span>}
                <div className="chip-horarios">
                  {med.horarios.map((h) => (
                    <span className={h.ativo ? 'chip chip-hora' : 'chip chip-hora desativado'} key={h.id}>
                      {h.hora}
                      {h.dose ? ` · ${h.dose}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card-acoes">
                <label className="chave">
                  <input
                    type="checkbox"
                    checked={med.ativo}
                    onChange={(e) => alternar(med, e.target.checked)}
                  />
                  Na agenda
                </label>
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => aoNavegar('medicamento-form', { pacienteId, medicamentoId: med.id })}
                >
                  Editar
                </button>
                <button type="button" className="botao-perigo" onClick={() => excluir(med)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <header className="pagina-cabecalho com-acao">
        <h3 className="secao-titulo">Consultas</h3>
        <button
          type="button"
          className="botao primario"
          onClick={() => aoNavegar('consulta-form', { pacienteId })}
        >
          Nova consulta
        </button>
      </header>

      {consultas.length === 0 ? (
        <div className="painel vazio">
          <p>
            <strong>Nenhuma consulta cadastrada.</strong> Registre as consultas médicas aqui
            para receber lembretes.
          </p>
        </div>
      ) : (
        <ul className="lista-cards">
          {consultas.map((consulta) => (
            <li className="card" key={consulta.id}>
              <div className="card-info">
                <strong className="card-titulo">{consulta.especialidade}</strong>
                <span className="card-detalhe">{formatarDataHora(consulta.dataHora)}</span>
                <span className="card-detalhe">{consulta.profissional}</span>
                {consulta.endereco && (
                  <span className="card-detalhe secundaria">{consulta.endereco}</span>
                )}
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
                  onClick={() => aoNavegar('consulta-form', { pacienteId, consultaId: consulta.id })}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="botao-perigo"
                  onClick={() => excluirConsultaPaciente(consulta)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
