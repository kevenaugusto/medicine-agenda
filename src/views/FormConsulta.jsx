import { useEffect, useState } from 'react'
import { atualizarConsulta, buscarConsulta, criarConsulta, TIPOS_ALARME } from '../db/consultas.js'
import { listarPacientes } from '../db/pacientes.js'

const FORM_VAZIO = {
  pacienteId: '',
  especialidade: '',
  profissional: '',
  endereco: '',
  dataHora: '',
  alarmes: [],
}

export default function FormConsulta({ consultaId, pacienteId, aoVoltar }) {
  const editando = Boolean(consultaId)
  const [pacientes, setPacientes] = useState(null)
  const [form, setForm] = useState(() => ({ ...FORM_VAZIO, pacienteId: pacienteId ?? '' }))
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    listarPacientes().then((dados) => {
      if (ativo) setPacientes(dados)
    })
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (!consultaId) return
    let ativo = true
    buscarConsulta(consultaId).then((consulta) => {
      if (!ativo) return
      if (consulta) {
        setForm({
          pacienteId: consulta.pacienteId || '',
          especialidade: consulta.especialidade || '',
          profissional: consulta.profissional || '',
          endereco: consulta.endereco || '',
          dataHora: consulta.dataHora || '',
          alarmes: consulta.alarmes || [],
        })
      }
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
  }, [consultaId])

  const alterar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const alternarAlarme = (codigo) => (e) => {
    const marcado = e.target.checked
    setForm((f) => ({
      ...f,
      alarmes: marcado ? [...f.alarmes, codigo] : f.alarmes.filter((a) => a !== codigo),
    }))
  }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      if (editando) {
        await atualizarConsulta(consultaId, form)
      } else {
        await criarConsulta(form)
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

  // Paciente fica travado apenas quando a consulta é criada a partir do detalhe do paciente.
  const pacienteTravado = !editando && Boolean(pacienteId)

  return (
    <section>
      <header className="pagina-cabecalho">
        <h2>{editando ? 'Editar consulta' : 'Nova consulta'}</h2>
      </header>

      <form className="formulario" onSubmit={salvar}>
        <label className="campo-formulario">
          <span className="rotulo">
            Paciente <em className="obrigatorio">obrigatório</em>
          </span>
          <select
            className="entrada"
            value={form.pacienteId}
            onChange={alterar('pacienteId')}
            disabled={pacienteTravado}
          >
            <option value="">Selecione o paciente…</option>
            {pacientes?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="linha-campos">
          <label className="campo-formulario">
            <span className="rotulo">
              Especialidade <em className="obrigatorio">obrigatória</em>
            </span>
            <input
              className="entrada"
              value={form.especialidade}
              onChange={alterar('especialidade')}
              autoFocus
              placeholder="Ex.: Cardiologia"
            />
          </label>
          <label className="campo-formulario">
            <span className="rotulo">
              Profissional <em className="obrigatorio">obrigatório</em>
            </span>
            <input
              className="entrada"
              value={form.profissional}
              onChange={alterar('profissional')}
              placeholder="Ex.: Dr. Paulo Lima"
            />
          </label>
        </div>

        <label className="campo-formulario">
          <span className="rotulo">Endereço do consultório</span>
          <input
            className="entrada"
            value={form.endereco}
            onChange={alterar('endereco')}
            placeholder="Ex.: Av. das Palmeiras, 100"
          />
        </label>

        <label className="campo-formulario">
          <span className="rotulo">
            Data e horário do atendimento <em className="obrigatorio">obrigatório</em>
          </span>
          <input
            className="entrada"
            type="datetime-local"
            value={form.dataHora}
            onChange={alterar('dataHora')}
          />
        </label>

        <fieldset className="campo-formulario">
          <legend className="rotulo">
            Lembretes <em className="obrigatorio">uma ou mais opções</em>
          </legend>
          <div className="opcoes-alarme">
            {TIPOS_ALARME.map((alarme) => (
              <label className="opcao-alarme" key={alarme.codigo}>
                <input
                  type="checkbox"
                  checked={form.alarmes.includes(alarme.codigo)}
                  onChange={alternarAlarme(alarme.codigo)}
                />
                <span>{alarme.rotulo}</span>
              </label>
            ))}
          </div>
          <p className="nota">Lembretes cujo horário já passou no cadastro não disparam.</p>
        </fieldset>

        {erro && <p className="erro-campo">{erro}</p>}

        <div className="acoes-form">
          <button type="submit" className="botao primario" disabled={salvando}>
            {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar consulta'}
          </button>
          <button type="button" className="botao-secundario" onClick={aoVoltar}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
