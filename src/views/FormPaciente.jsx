import { useEffect, useState } from 'react'
import { atualizarPaciente, buscarPaciente, criarPaciente } from '../db/pacientes.js'

const FORM_VAZIO = { nome: '', dataNascimento: '', observacoes: '' }

export default function FormPaciente({ pacienteId, aoVoltar }) {
  const editando = Boolean(pacienteId)
  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!pacienteId) return
    let ativo = true
    buscarPaciente(pacienteId).then((p) => {
      if (!ativo) return
      setForm({
        nome: p?.nome || '',
        dataNascimento: p?.dataNascimento || '',
        observacoes: p?.observacoes || '',
      })
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
  }, [pacienteId])

  const alterar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const salvar = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErro('Informe o nome do paciente.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      if (editando) {
        await atualizarPaciente(pacienteId, form)
      } else {
        await criarPaciente(form)
      }
      aoVoltar()
    } catch (falha) {
      setErro(falha.message)
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div className="painel">Carregando…</div>
  }

  return (
    <section>
      <header className="pagina-cabecalho">
        <h2>{editando ? 'Editar paciente' : 'Novo paciente'}</h2>
      </header>

      <form className="formulario" onSubmit={salvar}>
        <label className="campo-formulario">
          <span className="rotulo">
            Nome <em className="obrigatorio">obrigatório</em>
          </span>
          <input
            className="entrada"
            value={form.nome}
            onChange={alterar('nome')}
            autoFocus
            placeholder="Nome completo"
          />
        </label>

        <label className="campo-formulario">
          <span className="rotulo">Data de nascimento</span>
          <input
            className="entrada"
            type="date"
            value={form.dataNascimento}
            onChange={alterar('dataNascimento')}
          />
        </label>

        <label className="campo-formulario">
          <span className="rotulo">Observações</span>
          <textarea
            className="entrada"
            rows="3"
            value={form.observacoes}
            onChange={alterar('observacoes')}
            placeholder="Ex.: alergias, restrições, informações de cuidado…"
          />
        </label>

        {erro && <p className="erro-campo">{erro}</p>}

        <div className="acoes-form">
          <button type="submit" className="botao primario" disabled={salvando}>
            {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar paciente'}
          </button>
          <button type="button" className="botao-secundario" onClick={aoVoltar}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
