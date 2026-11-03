import { useCallback, useEffect, useMemo, useState } from 'react'
import { excluirPaciente, listarPacientes } from '../db/pacientes.js'
import { formatarDataCurta } from '../utils/format.js'

// Busca sem diferenciar maiúsculas, acentos e cedilhas ("jose" encontra "José").
function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export default function Pacientes({ aoNavegar }) {
  const [pacientes, setPacientes] = useState(null)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setPacientes(await listarPacientes())
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtrados = useMemo(() => {
    if (!pacientes) return []
    const termo = normalizar(busca.trim())
    if (!termo) return pacientes
    return pacientes.filter((p) => normalizar(p.nome).includes(termo))
  }, [pacientes, busca])

  const excluir = async (paciente) => {
    const confirma = window.confirm(
      `Excluir ${paciente.nome} e todos os medicamentos vinculados? Essa ação não pode ser desfeita.`,
    )
    if (!confirma) return
    await excluirPaciente(paciente.id)
    await carregar()
  }

  return (
    <section>
      <header className="pagina-cabecalho com-acao">
        <div>
          <h2>Pacientes</h2>
          <p className="subtitulo">
            {pacientes ? `${pacientes.length} paciente(s) cadastrado(s)` : ' '}
          </p>
        </div>
        <button type="button" className="botao primario" onClick={() => aoNavegar('paciente-form')}>
          Novo paciente
        </button>
      </header>

      <input
        className="campo busca entrada"
        type="search"
        placeholder="Buscar por nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        aria-label="Buscar paciente por nome"
      />

      {!pacientes ? (
        <div className="painel">Carregando…</div>
      ) : filtrados.length === 0 ? (
        <div className="painel vazio">
          {pacientes.length === 0 ? (
            <p>
              <strong>Nenhum paciente cadastrado ainda.</strong> Toque em “Novo paciente” para
              começar.
            </p>
          ) : (
            <p>Nenhum paciente encontrado com esse nome.</p>
          )}
        </div>
      ) : (
        <ul className="lista-cards">
          {filtrados.map((p) => (
            <li className="card" key={p.id}>
              <div className="card-info">
                <strong className="card-titulo">{p.nome}</strong>
                <span className="card-detalhe">
                  {p.dataNascimento
                    ? `Nascimento: ${formatarDataCurta(p.dataNascimento)}`
                    : 'Nascimento não informado'}
                </span>
                {p.observacoes && <span className="card-detalhe secundaria">{p.observacoes}</span>}
              </div>
              <div className="card-acoes">
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => aoNavegar('paciente', { pacienteId: p.id })}
                >
                  Ver medicamentos
                </button>
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => aoNavegar('paciente-form', { pacienteId: p.id })}
                >
                  Editar
                </button>
                <button type="button" className="botao-perigo" onClick={() => excluir(p)}>
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
