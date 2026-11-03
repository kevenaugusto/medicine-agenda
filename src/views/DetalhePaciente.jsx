import { useCallback, useEffect, useState } from 'react'
import { alternarVisibilidade, excluirMedicamento, listarMedicamentosPorPaciente } from '../db/medicamentos.js'
import { buscarPaciente } from '../db/pacientes.js'
import { formatarDataCurta, formatarDose } from '../utils/format.js'

export default function DetalhePaciente({ pacienteId, aoNavegar }) {
  const [paciente, setPaciente] = useState(null)
  const [medicamentos, setMedicamentos] = useState([])
  const [erro, setErro] = useState('')

  // Lê os dados sem atualizar estado — o efeito só sincroniza nas respostas.
  const buscarDados = useCallback(async () => {
    const [p, meds] = await Promise.all([
      buscarPaciente(pacienteId),
      listarMedicamentosPorPaciente(pacienteId),
    ])
    return { p, meds }
  }, [pacienteId])

  useEffect(() => {
    let ativo = true
    buscarDados()
      .then(({ p, meds }) => {
        if (!ativo) return
        if (!p) {
          setErro('Paciente não encontrado.')
          return
        }
        setPaciente(p)
        setMedicamentos(meds)
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
    const { p, meds } = await buscarDados()
    if (p) {
      setPaciente(p)
      setMedicamentos(meds)
    }
  }

  const excluir = async (medicamento) => {
    const confirma = window.confirm(
      `Excluir o medicamento “${medicamento.nome}” e seu histórico de administração?`,
    )
    if (!confirma) return
    await excluirMedicamento(medicamento.id)
    const { p, meds } = await buscarDados()
    if (p) {
      setPaciente(p)
      setMedicamentos(meds)
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
    </section>
  )
}
