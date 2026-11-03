// Camada de acesso ao IndexedDB (IndexedDB puro, sem biblioteca externa).
// Banco: medicine-agenda — object stores: pacientes, medicamentos, registros, consultas.

const NOME_BANCO = 'medicine-agenda'
const VERSAO = 2 // v2: adiciona a store "consultas" (evolução aditiva)

let conexaoPromise = null

function promessaDeRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function criarEsquema(db) {
  if (!db.objectStoreNames.contains('pacientes')) {
    const store = db.createObjectStore('pacientes', { keyPath: 'id' })
    store.createIndex('nome', 'nome')
  }
  if (!db.objectStoreNames.contains('medicamentos')) {
    const store = db.createObjectStore('medicamentos', { keyPath: 'id' })
    store.createIndex('pacienteId', 'pacienteId')
  }
  if (!db.objectStoreNames.contains('registros')) {
    const store = db.createObjectStore('registros', { keyPath: 'id' })
    store.createIndex('medicamentoId', 'medicamentoId')
    store.createIndex('dia', 'dia')
  }
  if (!db.objectStoreNames.contains('consultas')) {
    const store = db.createObjectStore('consultas', { keyPath: 'id' })
    store.createIndex('pacienteId', 'pacienteId')
    store.createIndex('dataHora', 'dataHora')
  }
}

/** Abre (ou cria) o banco; a promessa é compartilhada entre chamadas. */
export function abrirBanco() {
  if (!conexaoPromise) {
    conexaoPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(NOME_BANCO, VERSAO)
      request.onupgradeneeded = () => criarEsquema(request.result)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  return conexaoPromise
}

/** Identificador único — UUID quando disponível, com fallback local. */
export function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Executa uma função dentro de uma transação. A função recebe um mapa de
 * object stores e dispara as requisições; a promessa resolve quando a
 * transação conclui.
 */
export async function emTransacao(modo, nomesDasStores, executar) {
  const db = await abrirBanco()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(nomesDasStores, modo)
    const stores = Object.fromEntries(
      nomesDasStores.map((nome) => [nome, txn.objectStore(nome)]),
    )
    txn.oncomplete = () => resolve(undefined)
    txn.onerror = () => reject(txn.error)
    txn.onabort = () => reject(txn.error)
    try {
      executar(stores)
    } catch (erro) {
      txn.abort()
      reject(erro)
    }
  })
}

export async function listar(storeNome) {
  const db = await abrirBanco()
  const txn = db.transaction(storeNome, 'readonly')
  return promessaDeRequest(txn.objectStore(storeNome).getAll())
}

export async function listarPorIndice(storeNome, indice, valor) {
  const db = await abrirBanco()
  const txn = db.transaction(storeNome, 'readonly')
  return promessaDeRequest(txn.objectStore(storeNome).index(indice).getAll(valor))
}

export async function obter(storeNome, chave) {
  const db = await abrirBanco()
  const txn = db.transaction(storeNome, 'readonly')
  return promessaDeRequest(txn.objectStore(storeNome).get(chave))
}

export async function adicionar(storeNome, registro) {
  await emTransacao('readwrite', [storeNome], (stores) => stores[storeNome].add(registro))
  return registro
}

export async function atualizar(storeNome, registro) {
  await emTransacao('readwrite', [storeNome], (stores) => stores[storeNome].put(registro))
  return registro
}

export async function excluir(storeNome, chave) {
  await emTransacao('readwrite', [storeNome], (stores) => stores[storeNome].delete(chave))
}

export async function limparTudo() {
  await emTransacao(
    'readwrite',
    ['pacientes', 'medicamentos', 'registros', 'consultas'],
    (stores) => {
      stores.pacientes.clear()
      stores.medicamentos.clear()
      stores.registros.clear()
      stores.consultas.clear()
    },
  )
}
