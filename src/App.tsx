import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Banknote,
  CalendarClock,
  ChevronRight,
  FileLock2,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
} from 'lucide-react'
import './App.css'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type ContractStatus = 'active' | 'overdue'

type Contract = {
  id: string
  operationId?: string
  clientId?: string
  clientName: string
  documentNumber: string
  email: string
  phone: string
  requestedBy: string
  value: string
  date: string
  status: ContractStatus
}

type ContractForm = Omit<Contract, 'id'>

type OperationRow = {
  id: string
  code: string
  principal_amount: number
  status: ContractStatus
  due_date: string
  requested_by: string | null
  client_id: string
  clients:
    | {
        full_name: string
        document_number: string | null
        email: string | null
        phone: string | null
      }
    | {
        full_name: string
        document_number: string | null
        email: string | null
        phone: string | null
      }[]
    | null
}

const emptyForm: ContractForm = {
  clientName: '',
  documentNumber: '',
  email: '',
  phone: '',
  requestedBy: '',
  value: '',
  date: '',
  status: 'active',
}

const storageKey = 'mts-appjus-contracts-v2'

function loadContracts() {
  const stored = window.localStorage.getItem(storageKey)
  if (!stored) {
    return []
  }

  try {
    return JSON.parse(stored) as Contract[]
  } catch {
    return []
  }
}

function formatCurrency(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  const amount = Number(digits) / 100
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

function App() {
  const [contracts, setContracts] = useState<Contract[]>(loadContracts)
  const [form, setForm] = useState<ContractForm>(emptyForm)
  const [query, setQuery] = useState('')
  const [systemMessage, setSystemMessage] = useState('Base zerada e pronta para cadastro.')

  useEffect(() => {
    async function loadSupabaseContracts() {
      if (!isSupabaseConfigured || !supabase) {
        return
      }

      const { data, error } = await supabase
        .from('operations')
        .select('id, code, principal_amount, status, due_date, requested_by, client_id, clients(full_name, document_number, email, phone)')
        .order('created_at', { ascending: false })

      if (error) {
        setSystemMessage('Supabase configurado, mas nao foi possivel carregar o banco. Usando dados locais.')
        return
      }

      const nextContracts = ((data ?? []) as OperationRow[]).map((operation) => {
        const client = Array.isArray(operation.clients) ? operation.clients[0] : operation.clients
        return {
          id: operation.code,
          operationId: operation.id,
          clientId: operation.client_id,
          clientName: client?.full_name ?? '',
          documentNumber: client?.document_number ?? '',
          email: client?.email ?? '',
          phone: client?.phone ?? '',
          requestedBy: operation.requested_by ?? '',
          value: Number(operation.principal_amount).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          date: operation.due_date,
          status: operation.status,
        }
      })

      setContracts(nextContracts)
      window.localStorage.setItem(storageKey, JSON.stringify(nextContracts))
      setSystemMessage('Contratos carregados do Supabase.')
    }

    void loadSupabaseContracts()
  }, [])

  const filteredContracts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return contracts
    }

    return contracts.filter((contract) =>
      [
        contract.clientName,
        contract.documentNumber,
        contract.email,
        contract.phone,
        contract.requestedBy,
        contract.value,
        contract.date,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [contracts, query])

  const metrics = useMemo(
    () => [
      {
        label: 'Quantidade de contratos',
        value: String(contracts.length),
        detail: 'Cadastrados na base',
        icon: FileText,
      },
      {
        label: 'Contratos ativos',
        value: String(contracts.filter((contract) => contract.status === 'active').length),
        detail: 'Em acompanhamento',
        icon: Banknote,
      },
      {
        label: 'Contratos inadimplentes',
        value: String(contracts.filter((contract) => contract.status === 'overdue').length),
        detail: 'Exigem acao juridica',
        icon: CalendarClock,
      },
    ],
    [contracts],
  )

  function persistContracts(nextContracts: Contract[], message = 'Alteracoes salvas no sistema.') {
    setContracts(nextContracts)
    window.localStorage.setItem(storageKey, JSON.stringify(nextContracts))
    setSystemMessage(message)
  }

  function updateForm(field: keyof ContractForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: field === 'value' ? formatCurrency(value) : value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextContract: Contract = {
      ...form,
      id: `MTS-${String(contracts.length + 1).padStart(4, '0')}`,
      clientName: form.clientName.trim(),
      documentNumber: form.documentNumber.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      requestedBy: form.requestedBy.trim(),
      value: form.value.trim(),
      date: form.date,
    }

    if (!nextContract.clientName || !nextContract.requestedBy || !nextContract.value || !nextContract.date) {
      setSystemMessage('Preencha referencia, cliente, valor e data para salvar.')
      return
    }

    if (isSupabaseConfigured && supabase) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: nextContract.clientName,
          document_number: nextContract.documentNumber || null,
          email: nextContract.email || null,
          phone: nextContract.phone || null,
        })
        .select('id')
        .single()

      if (clientError) {
        setSystemMessage('Nao foi possivel salvar o cliente no Supabase.')
        return
      }

      const amount = Number(nextContract.value.replace(/\D/g, '')) / 100
      const { data: operation, error: operationError } = await supabase
        .from('operations')
        .insert({
          code: nextContract.id,
          client_id: client.id,
          principal_amount: amount,
          status: nextContract.status,
          risk: nextContract.status === 'overdue' ? 'high' : 'low',
          guarantee_type: 'Contrato',
          requested_by: nextContract.requestedBy,
          due_date: nextContract.date,
        })
        .select('id')
        .single()

      if (operationError) {
        setSystemMessage('Cliente salvo, mas contrato nao foi criado no Supabase.')
        return
      }

      nextContract.clientId = client.id
      nextContract.operationId = operation.id
    }

    persistContracts(
      [nextContract, ...contracts],
      isSupabaseConfigured ? 'Contrato salvo no Supabase.' : 'Contrato salvo localmente.',
    )
    setForm(emptyForm)
  }

  async function removeContract(contract: Contract) {
    if (isSupabaseConfigured && supabase && contract.operationId) {
      await supabase.from('operations').delete().eq('id', contract.operationId)
      if (contract.clientId) {
        await supabase.from('clients').delete().eq('id', contract.clientId)
      }
    }

    persistContracts(contracts.filter((item) => item.id !== contract.id), 'Contrato removido.')
  }

  async function clearContracts() {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('operations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    persistContracts([], isSupabaseConfigured ? 'Base local e Supabase zerados.' : 'Base local zerada.')
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="brand">
          <img className="brand-logo" src="/brand/mts-appjus-logo.png" alt="MTS AppJus" />
          <div>
            <strong>MTS AppJus</strong>
            <span>Acordos privados</span>
          </div>
        </div>

        <nav className="nav-list">
          <a className="active" href="#dashboard">
            <LayoutDashboard size={18} aria-hidden="true" />
            Dashboard
          </a>
          <a href="#contratos">
            <FileLock2 size={18} aria-hidden="true" />
            Contratos
          </a>
          <a href="#cadastro">
            <Plus size={18} aria-hidden="true" />
            Novo acordo
          </a>
        </nav>

        <section className="security-panel" aria-label="Resumo de seguranca">
          <LockKeyhole size={18} aria-hidden="true" />
          <div>
            <strong>Gestao discreta</strong>
            <span>Controle seguro de acordos, valores e vencimentos.</span>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <section className="brand-hero" aria-label="Identidade MTS AppJus">
          <img src="/brand/mts-appjus-logo.png" alt="MTS AppJus - Gestao Discreta e Segura de Acordos Privados" />
        </section>

        <header className="topbar" id="dashboard">
          <div>
            <span className="eyebrow">Gestao discreta e segura de acordos privados</span>
            <h1>Base operacional</h1>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input
                aria-label="Buscar contratos"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar contrato, nome, documento ou referencia"
                value={query}
              />
            </label>
            <a className="primary-button" href="#cadastro">
              <Plus size={18} aria-hidden="true" />
              Novo acordo
            </a>
          </div>
        </header>

        <nav className="top-tabs" aria-label="Guias superiores">
          <a className="active" href="#dashboard">
            Resumo
          </a>
          <a href="#contratos">Contratos</a>
          <a href="#cadastro">Novo acordo</a>
        </nav>

        <section className="metric-grid compact" aria-label="Indicadores principais">
          {metrics.map((item) => {
            const Icon = item.icon
            return (
              <article className="metric-card" key={item.label}>
                <div className="metric-icon">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </article>
            )
          })}
        </section>

        <section className="system-message" aria-live="polite">
          {systemMessage}
        </section>

        <section className="content-grid clean">
          <article className="panel contracts-panel" id="contratos">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Base de acordos</span>
                <h2>Contratos cadastrados</h2>
              </div>
              <button className="ghost-button" onClick={() => void clearContracts()} type="button">
                <Trash2 size={16} aria-hidden="true" />
                Limpar base
              </button>
            </div>

            <div className="contract-list">
              <div className="contract-header">
                <span>Nome</span>
                <span>Valor</span>
                <span>Data</span>
                <span>Status</span>
                <span></span>
              </div>
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <div className="contract-row" key={contract.id}>
                    <div>
                      <strong>{contract.clientName}</strong>
                      <span>{contract.id}</span>
                    </div>
                    <strong>{contract.value}</strong>
                    <time dateTime={contract.date}>{formatDate(contract.date)}</time>
                    <span className={`status-badge status-${contract.status}`}>
                      {contract.status === 'active' ? 'Ativo' : 'Inadimplente'}
                    </span>
                    <button
                      className="icon-button remove-button"
                      onClick={() => removeContract(contract)}
                      type="button"
                      aria-label={`Remover contrato de ${contract.clientName}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <strong>Nenhum contrato cadastrado</strong>
                  <span>Use a guia Cadastro para juristas para inserir o primeiro contrato.</span>
                </div>
              )}
            </div>
          </article>

          <article className="panel intake-panel" id="cadastro">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Entrada operacional</span>
                <h2>Novo acordo privado</h2>
              </div>
              <UserRoundCheck size={22} aria-hidden="true" />
            </div>
            <form className="intake-form" onSubmit={handleSubmit}>
              <fieldset>
                <legend>Referência da pessoa que pediu o crédito</legend>
                <label>
                  Nome da referência
                  <input
                    onChange={(event) => updateForm('requestedBy', event.target.value)}
                    placeholder="Quem solicitou o crédito"
                    required
                    value={form.requestedBy}
                  />
                </label>
              </fieldset>

              <fieldset>
                <legend>Informações ao cliente</legend>
                <label>
                  Nome do cliente
                  <input
                    onChange={(event) => updateForm('clientName', event.target.value)}
                    placeholder="Nome completo ou razão social"
                    required
                    value={form.clientName}
                  />
                </label>
                <label>
                  CPF ou CNPJ
                  <input
                    onChange={(event) => updateForm('documentNumber', event.target.value)}
                    placeholder="Documento do cliente"
                    value={form.documentNumber}
                  />
                </label>
                <label>
                  Telefone
                  <input
                    onChange={(event) => updateForm('phone', event.target.value)}
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                  />
                </label>
                <label>
                  E-mail
                  <input
                    onChange={(event) => updateForm('email', event.target.value)}
                    placeholder="cliente@email.com"
                    type="email"
                    value={form.email}
                  />
                </label>
              </fieldset>

              <fieldset>
                <legend>Dados do contrato</legend>
                <label>
                  Valor do contrato
                  <input
                    onChange={(event) => updateForm('value', event.target.value)}
                    placeholder="R$ 0,00"
                    required
                    value={form.value}
                  />
                </label>
                <label>
                  Data
                  <input
                    onChange={(event) => updateForm('date', event.target.value)}
                    required
                    type="date"
                    value={form.date}
                  />
                </label>
                <label>
                  Status
                  <select
                    onChange={(event) => updateForm('status', event.target.value)}
                    value={form.status}
                  >
                    <option value="active">Contrato ativo</option>
                    <option value="overdue">Contrato inadimplente</option>
                  </select>
                </label>
              </fieldset>

              <button className="primary-button full" type="submit">
                Salvar contrato
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </form>
          </article>
        </section>

        <footer className="site-footer">
          <span>Feito por: mtsinforj</span>
          <a href="mailto:mts.ic@hotmail.com">mts.ic@hotmail.com</a>
        </footer>
      </section>
    </main>
  )
}

export default App
