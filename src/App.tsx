import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Calculator,
  Banknote,
  CalendarClock,
  ChevronRight,
  FileLock2,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MessageCircle,
  Copy,
  AtSign,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
} from 'lucide-react'
import './App.css'
import { isSupabaseConfigured, supabase, supabaseConfig } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

type ContractStatus = 'active' | 'paused' | 'overdue'
type ContractDuration = 'indefinite' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
type ContractTab = 'all' | 'monthly' | ContractStatus
type AuthMode = 'sign-in' | 'sign-up'

type Contract = {
  id: string
  operationId?: string
  clientId?: string
  clientName: string
  documentNumber: string
  email: string
  phone: string
  value: string
  date: string
  status: ContractStatus
  duration: ContractDuration
  interestPercent: number
}

type Tenant = {
  id: string
  name: string
  subscriptionStatus: 'pending_payment' | 'trialing' | 'active' | 'past_due' | 'canceled'
}

type AuthForm = {
  email: string
  password: string
  organizationName: string
}

type ContractForm = Omit<Contract, 'id'>

type FormErrors = Partial<Record<keyof ContractForm, string>>

type OperationRow = {
  id: string
  code: string
  principal_amount: number
  interest_percentage: number | null
  status: ContractStatus
  duration_months: number | null
  duration_indefinite: boolean | null
  due_date: string
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

type MembershipRow = {
  tenant_id: string
  tenants:
    | {
        id: string
        name: string
        subscriptions:
          | {
              status: Tenant['subscriptionStatus']
            }[]
          | null
      }
    | {
        id: string
        name: string
        subscriptions:
          | {
              status: Tenant['subscriptionStatus']
            }[]
          | null
      }[]
    | null
}

type PendingAccessRow = {
  id: string
  status: Tenant['subscriptionStatus']
  billing_email: string | null
  created_at: string
  tenants:
    | {
        id: string
        name: string
      }
    | {
        id: string
        name: string
      }[]
    | null
}

type RegistrationResult = {
  ok: boolean
  code?: string
  message?: string
  user_id?: string
  tenant_id?: string
}

const emptyForm: ContractForm = {
  clientName: '',
  documentNumber: '',
  email: '',
  phone: '',
  value: '',
  date: '',
  status: 'active',
  duration: 'indefinite',
  interestPercent: 30,
}

const emptyAuthForm: AuthForm = {
  email: '',
  password: '',
  organizationName: '',
}

const storageKey = 'mts-appjus-contracts-v2'
const contractsPerPage = 5
const contractStatusLabels: Record<ContractStatus, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  overdue: 'Inadimplente',
}

const contractDurationOptions: { label: string; value: ContractDuration }[] = [
  { label: 'Tempo indeterminado', value: 'indefinite' },
  ...Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1) as ContractDuration
    return { label: `${value}x`, value }
  }),
]

const interestPercentageOptions = Array.from({ length: 10 }, (_, index) => (index + 1) * 10)

const pixAmount = 'R$ 29,99'
const pixPhone = '21964976686'
const pixQrPath = `${import.meta.env.BASE_URL}payments/pix-mtsappjus.svg`
const pixCopyPath = `${import.meta.env.BASE_URL}payments/pix-copia-e-cola.txt`
const trainingPath = `${import.meta.env.BASE_URL}docs/treinamento-usuario-whatsapp.txt`
const contactEmail = 'mts.ic@hotmail.com'
const contactPhone = '21964976686'
const instagramHandle = '@mtsinforj'
const whatsappLink = `https://wa.me/55${contactPhone}`

const subscriptionStatusLabels: Record<Tenant['subscriptionStatus'], string> = {
  pending_payment: 'Aguardando pagamento/liberacao',
  trialing: 'Aguardando liberacao',
  active: 'Liberado',
  past_due: 'Pendente',
  canceled: 'Cancelado',
}

function formatDuration(value: ContractDuration) {
  return value === 'indefinite' ? 'Tempo indeterminado' : `${value}x`
}

function loadContracts() {
  const stored = window.localStorage.getItem(storageKey)
  if (!stored) {
    return []
  }

  try {
    const parsedContracts = JSON.parse(stored) as Partial<Contract>[]
    return parsedContracts.map((contract, index) => ({
      id: contract.id ?? `MTS-${String(index + 1).padStart(4, '0')}`,
      operationId: contract.operationId,
      clientId: contract.clientId,
      clientName: contract.clientName ?? '',
      documentNumber: contract.documentNumber ?? '',
      email: contract.email ?? '',
      phone: contract.phone ?? '',
      value: contract.value ?? '',
      date: contract.date ?? '',
      status: contract.status ?? 'active',
      duration: contract.duration ?? 'indefinite',
      interestPercent: Number(contract.interestPercent ?? 30),
    }))
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

function parseCurrencyValue(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

function formatCurrencyAmount(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function getReceivableAmount(contract: Contract) {
  const principal = parseCurrencyValue(contract.value)
  return principal * (1 + Number(contract.interestPercent || 0) / 100)
}

function getCurrentMonthKey() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 7)
}

function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function isValidCpf(documentNumber: string) {
  const digits = onlyDigits(documentNumber)
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false
  }

  const validateDigit = (size: number) => {
    const numbers = digits.slice(0, size).split('').map(Number)
    const sum = numbers.reduce((total, number, index) => total + number * (size + 1 - index), 0)
    const result = (sum * 10) % 11
    return (result === 10 ? 0 : result) === Number(digits[size])
  }

  return validateDigit(9) && validateDigit(10)
}

function isValidCnpj(documentNumber: string) {
  const digits = onlyDigits(documentNumber)
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false
  }

  const calculate = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((total, number, index) => total + Number(number) * weights[index], 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const firstDigit = calculate(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const secondDigit = calculate(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return firstDigit === Number(digits[12]) && secondDigit === Number(digits[13])
}

function formatDocument(value: string) {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function isValidDocument(documentNumber: string) {
  const digits = onlyDigits(documentNumber)
  return digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false
}

function getEmailDomain(email: string) {
  const parts = email.trim().toLowerCase().split('@')
  return parts.length === 2 ? parts[1] : ''
}

function isValidEmailDomain(email: string) {
  const domain = getEmailDomain(email)
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/i.test(domain)
}

function isValidPersonName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  const words = normalized.split(' ').filter(Boolean)
  if (words.length < 2) {
    return false
  }

  return words.every((word) => /^[\p{L}'-]{2,}$/u.test(word)) && !/(.)\1{3,}/i.test(normalized)
}

function isValidBrazilPhone(value: string) {
  const digits = onlyDigits(value)
  if ((digits.length !== 10 && digits.length !== 11) || /^(\d)\1+$/.test(digits)) {
    return false
  }

  const ddd = Number(digits.slice(0, 2))
  if (ddd < 11 || ddd > 99) {
    return false
  }

  return digits.length === 10 || digits[2] === '9'
}

function displayInfo(value: string) {
  return value.trim() || 'Sem informacao'
}

function getWhatsAppPhone(value: string) {
  const digits = onlyDigits(value)
  if (!isValidBrazilPhone(digits)) {
    return ''
  }

  return digits.startsWith('55') ? digits : `55${digits}`
}

function getDebtReminderUrl(contract: Contract) {
  const phone = getWhatsAppPhone(contract.phone)
  if (!phone) {
    return ''
  }

  const message = [
    `Ola, ${contract.clientName}.`,
    `Lembrete sobre o contrato ${contract.id}.`,
    `Valor registrado: ${contract.value}.`,
    `Data/vencimento: ${formatDate(contract.date)}.`,
    `Status: ${contractStatusLabels[contract.status]}.`,
    'Por favor, verifique a pendencia e retorne assim que possivel.',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
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
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [authForm, setAuthForm] = useState<AuthForm>(emptyAuthForm)
  const [session, setSession] = useState<Session | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [query, setQuery] = useState('')
  const [contractTab, setContractTab] = useState<ContractTab>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingAccess, setPendingAccess] = useState<PendingAccessRow[]>([])
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorValue, setCalculatorValue] = useState('')
  const [systemMessage, setSystemMessage] = useState('Base zerada e pronta para cadastro.')
  const brandLogoPath = `${import.meta.env.BASE_URL}brand/mts-appjus-logo.png`
  const isAppAdmin = session?.user.email?.toLowerCase() === contactEmail

  const loadPendingAccess = useCallback(async () => {
    if (!supabase || !isAppAdmin) {
      setPendingAccess([])
      return
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, billing_email, created_at, tenants(id, name)')
      .neq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      setSystemMessage('Nao foi possivel carregar acessos pendentes.')
      return
    }

    setPendingAccess((data ?? []) as PendingAccessRow[])
  }, [isAppAdmin])

  async function approveAccess(subscriptionId: string) {
    if (!supabase || !isAppAdmin) {
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        provider: 'pix',
        approved_at: new Date().toISOString(),
        approved_by: session?.user.id ?? null,
        current_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)

    if (error) {
      setSystemMessage('Nao foi possivel liberar este acesso.')
      return
    }

    setSystemMessage('Acesso liberado. O usuario ja pode entrar no sistema.')
    await loadPendingAccess()
  }

  async function copyPixPayload() {
    try {
      const response = await fetch(pixCopyPath)
      const payload = await response.text()
      await navigator.clipboard.writeText(payload.trim())
      setSystemMessage('Codigo Pix copiado. Envie o comprovante pelo WhatsApp para liberar o acesso.')
    } catch {
      await navigator.clipboard.writeText(pixPhone)
      setSystemMessage('Chave Pix telefone copiada. Envie o comprovante pelo WhatsApp para liberar o acesso.')
    }
  }

  async function loadTenant(currentSession: Session | null) {
    if (!isSupabaseConfigured || !supabase || !currentSession) {
      setTenant(null)
      return null
    }

    const currentUserIsAdmin = currentSession.user.email?.toLowerCase() === contactEmail

    const { data, error } = await supabase
      .from('tenant_members')
      .select('tenant_id, tenants(id, name, subscriptions(status))')
      .eq('user_id', currentSession.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      setSystemMessage('Nao foi possivel carregar a empresa do usuario.')
      return null
    }

    const membership = data as MembershipRow | null
    const tenantData = Array.isArray(membership?.tenants) ? membership?.tenants[0] : membership?.tenants
    if (!tenantData) {
      setTenant(null)
      setSystemMessage(
        currentUserIsAdmin
          ? 'Acesso master liberado. Use o painel para autorizar clientes.'
          : 'Usuario autenticado sem empresa vinculada. Crie uma conta nova ou solicite convite.',
      )
      return null
    }

    const subscription = tenantData.subscriptions?.[0]
    const nextTenant: Tenant = {
      id: tenantData.id,
      name: tenantData.name,
      subscriptionStatus: subscription?.status ?? 'trialing',
    }

    setTenant(nextTenant)
    return nextTenant
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadTenant(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setTenant(null)
        setContracts([])
      } else {
        void loadTenant(nextSession)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadSupabaseContracts() {
      if (!isSupabaseConfigured || !supabase || !session || !tenant) {
        return
      }

      const { data, error } = await supabase
        .from('operations')
        .select('id, code, principal_amount, interest_percentage, status, duration_months, duration_indefinite, due_date, client_id, clients(full_name, document_number, email, phone)')
        .eq('tenant_id', tenant.id)
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
          value: Number(operation.principal_amount).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          date: operation.due_date,
          status: operation.status,
          interestPercent: Number(operation.interest_percentage ?? 30),
          duration: operation.duration_indefinite
            ? 'indefinite'
            : String(operation.duration_months ?? 1) as ContractDuration,
        }
      })

      setContracts(nextContracts)
      window.localStorage.setItem(storageKey, JSON.stringify(nextContracts))
      setSystemMessage('Contratos carregados do Supabase.')
    }

    void loadSupabaseContracts()
  }, [session, tenant])

  useEffect(() => {
    void loadPendingAccess()
  }, [loadPendingAccess])

  const filteredContracts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const currentMonthKey = getCurrentMonthKey()
    const contractsByTab =
      contractTab === 'all'
        ? contracts
        : contractTab === 'monthly'
          ? contracts.filter((contract) => contract.date.slice(0, 7) === currentMonthKey)
          : contracts.filter((contract) => contract.status === contractTab)

    if (!normalizedQuery) {
      return contractsByTab
    }

    return contractsByTab.filter((contract) =>
      [
        contract.clientName,
        contract.documentNumber,
        contract.email,
        contract.phone,
        contract.value,
        contract.date,
        `${contract.interestPercent}%`,
        formatCurrencyAmount(getReceivableAmount(contract)),
        contractStatusLabels[contract.status],
        formatDuration(contract.duration),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [contractTab, contracts, query])

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / contractsPerPage))
  const pagedContracts = filteredContracts.slice((currentPage - 1) * contractsPerPage, currentPage * contractsPerPage)
  const filteredContractsTotal = useMemo(
    () => filteredContracts.reduce((total, contract) => total + getReceivableAmount(contract), 0),
    [filteredContracts],
  )
  const currentMonthLabel = useMemo(getCurrentMonthLabel, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [contractTab, query])

  const metrics = useMemo(
    () => [
      {
        label: 'Contratos ativos',
        value: String(contracts.filter((contract) => contract.status === 'active').length),
        detail: 'Em acompanhamento',
        icon: FileText,
      },
      {
        label: 'Contratos pausados',
        value: String(contracts.filter((contract) => contract.status === 'paused').length),
        detail: 'Aguardando alteracao',
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
    if (!isSupabaseConfigured) {
      window.localStorage.setItem(storageKey, JSON.stringify(nextContracts))
    }
    setSystemMessage(message)
  }

  function updateAuthForm(field: keyof AuthForm, value: string) {
    setAuthForm((current) => ({ ...current, [field]: value }))
  }

  async function createTenantForUser(currentSession: Session, organizationName: string) {
    if (!supabase) {
      return null
    }

    const tenantName = organizationName.trim() || `Base de ${currentSession.user.email ?? 'usuario'}`
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: tenantName, owner_id: currentSession.user.id })
      .select('id, name')
      .single()

    if (tenantError) {
      setSystemMessage('Login feito, mas nao foi possivel criar a empresa.')
      return null
    }

    await supabase.from('tenant_members').insert({
      tenant_id: tenantData.id,
      user_id: currentSession.user.id,
      role: 'owner',
    })

    await supabase.from('subscriptions').insert({
      tenant_id: tenantData.id,
      status: 'pending_payment',
      billing_email: currentSession.user.email,
      provider: 'pix',
      provider_subscription_id: 'PIX_UNICO_29_99',
      payment_amount: 29.99,
      payment_method: 'pix',
    })

    const nextTenant: Tenant = {
      id: tenantData.id,
      name: tenantData.name,
      subscriptionStatus: 'pending_payment',
    }
    setTenant(nextTenant)
    return nextTenant
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setSystemMessage('Supabase nao configurado para login online.')
      return
    }

    setAuthLoading(true)
    if (authMode === 'sign-up') {
      const normalizedEmail = authForm.email.trim().toLowerCase()
      const { data: registration, error: registrationError } = await supabase.rpc('register_app_user', {
        p_email: normalizedEmail,
        p_password: authForm.password,
        p_organization_name: authForm.organizationName,
      })

      if (registrationError) {
        setSystemMessage('Nao foi possivel criar o acesso agora. Tente novamente ou chame no WhatsApp.')
        setAuthLoading(false)
        return
      }

      const registrationResult = registration as RegistrationResult | null
      if (!registrationResult?.ok) {
        setSystemMessage(registrationResult?.message ?? 'Nao foi possivel criar este acesso.')
        setAuthLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: authForm.password,
      })

      if (error) {
        setSystemMessage('Conta criada. Entre com seu e-mail e senha para acompanhar a liberacao.')
        setAuthLoading(false)
        return
      }

      setSession(data.session)
      await loadTenant(data.session)
      setSystemMessage('Conta criada sem limite de e-mail. Pague o Pix e envie o comprovante para liberar o login.')
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email.trim(),
        password: authForm.password,
      })

      if (error) {
        setSystemMessage(error.message)
        setAuthLoading(false)
        return
      }

      setSession(data.session)
      const loadedTenant = await loadTenant(data.session)
      const signingInAsAdmin = data.session?.user.email?.toLowerCase() === contactEmail
      if (!loadedTenant && data.session && !signingInAsAdmin) {
        await createTenantForUser(data.session, authForm.organizationName)
      }
      setSystemMessage(
        signingInAsAdmin
          ? 'Acesso master liberado. Use o painel para autorizar clientes.'
          : 'Login validado. Verificando liberacao de acesso.',
      )
    }

    setAuthLoading(false)
  }

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setSession(null)
    setTenant(null)
    setContracts([])
    setSystemMessage('Sessao encerrada.')
  }

  function updateForm(field: keyof ContractForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]:
        field === 'value'
          ? formatCurrency(value)
          : field === 'documentNumber'
            ? formatDocument(value)
            : field === 'phone'
              ? formatPhone(value)
              : field === 'interestPercent'
                ? Number(value)
              : value,
    }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validateField(field: keyof ContractForm, value: string) {
    const trimmed = value.trim()

    if (field === 'clientName' && !isValidPersonName(trimmed)) {
      return 'Nao validado: informe nome completo ou razao social valida.'
    }

    if (field === 'documentNumber' && trimmed && !isValidDocument(trimmed)) {
      return 'Nao validado: CPF/CNPJ com digito verificador invalido.'
    }

    if (field === 'phone' && trimmed && !isValidBrazilPhone(trimmed)) {
      return 'Nao validado: telefone brasileiro com DDD e numero real.'
    }

    if (field === 'email' && trimmed && !isValidEmailDomain(trimmed)) {
      return 'Nao validado: dominio de e-mail invalido.'
    }

    if (field === 'value' && Number(trimmed.replace(/\D/g, '')) <= 0) {
      return 'Nao validado: informe valor maior que zero.'
    }

    if (field === 'date' && Number.isNaN(new Date(`${trimmed}T00:00:00`).getTime())) {
      return 'Nao validado: informe uma data real.'
    }

    return ''
  }

  function validateAndMarkField(field: keyof ContractForm) {
    const error = validateField(field, String(form[field] ?? ''))
    setFormErrors((current) => ({ ...current, [field]: error || undefined }))
    return !error
  }

  function validateForm(nextContract: Contract) {
    const requiredFields: (keyof ContractForm)[] = [
      'clientName',
      'value',
      'date',
    ]
    const nextErrors: FormErrors = {}

    for (const field of requiredFields) {
      const error = validateField(field, String(nextContract[field] ?? ''))
      if (error) {
        nextErrors[field] = error
      }
    }

    if (nextContract.email) {
      const emailError = validateField('email', nextContract.email)
      if (emailError) {
        nextErrors.email = emailError
      }
    }

    setFormErrors(nextErrors)
    return nextErrors
  }

  async function lookupDocument(documentNumber: string) {
    const documentDigits = onlyDigits(documentNumber)
    if (!documentDigits) {
      setFormErrors((current) => ({ ...current, documentNumber: undefined }))
      return
    }

    if (documentDigits.length !== 11 && documentDigits.length !== 14) {
      return
    }

    if (!isValidDocument(documentDigits)) {
      setFormErrors((current) => ({
        ...current,
        documentNumber: 'Nao validado: CPF/CNPJ com digito verificador invalido.',
      }))
      setSystemMessage('CPF/CNPJ com digito verificador invalido.')
      return
    }

    const localMatch = contracts.find((contract) => onlyDigits(contract.documentNumber) === documentDigits)
    if (localMatch) {
      setForm((current) => ({
        ...current,
        clientName: localMatch.clientName,
        email: localMatch.email,
        phone: localMatch.phone,
      }))
      setFormErrors((current) => ({ ...current, documentNumber: undefined }))
      setSystemMessage('CPF/CNPJ encontrado na base local. Dados do cliente preenchidos.')
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setFormErrors((current) => ({ ...current, documentNumber: undefined }))
      setSystemMessage('CPF/CNPJ validado. Supabase nao configurado para consulta em rede.')
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .select('full_name, document_number, email, phone')
      .eq('document_digits', documentDigits)
      .maybeSingle()

    if (error) {
      setSystemMessage('CPF/CNPJ validado, mas a consulta no Supabase nao respondeu.')
      return
    }

    if (!data) {
      setFormErrors((current) => ({ ...current, documentNumber: undefined }))
      setSystemMessage('CPF/CNPJ valido e livre para novo cadastro.')
      return
    }

    setForm((current) => ({
      ...current,
      clientName: data.full_name ?? current.clientName,
      documentNumber: formatDocument(data.document_number ?? current.documentNumber),
      email: data.email ?? current.email,
      phone: data.phone ?? current.phone,
    }))
    setFormErrors((current) => ({ ...current, documentNumber: undefined }))
    setSystemMessage('CPF/CNPJ encontrado na base Supabase. Dados do cliente preenchidos.')
  }

  async function lookupPhone(phone: string) {
    const phoneDigits = onlyDigits(phone)
    if (!phoneDigits) {
      setFormErrors((current) => ({ ...current, phone: undefined }))
      return
    }

    if (!isValidBrazilPhone(phoneDigits)) {
      setFormErrors((current) => ({
        ...current,
        phone: 'Nao validado: telefone brasileiro com DDD e numero real.',
      }))
      return
    }

    const localMatch = contracts.find((contract) => onlyDigits(contract.phone) === phoneDigits)
    if (localMatch) {
      setForm((current) => ({
        ...current,
        clientName: localMatch.clientName,
        documentNumber: localMatch.documentNumber,
        email: localMatch.email,
      }))
      setFormErrors((current) => ({ ...current, phone: undefined }))
      setSystemMessage('Telefone encontrado na base local. Dados do cliente preenchidos.')
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setFormErrors((current) => ({ ...current, phone: undefined }))
      setSystemMessage('Telefone validado. Supabase nao configurado para consulta em rede.')
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .select('full_name, document_number, email, phone')
      .eq('phone_digits', phoneDigits)
      .maybeSingle()

    if (error) {
      setSystemMessage('Telefone validado, mas a consulta no Supabase nao respondeu.')
      return
    }

    if (!data) {
      setFormErrors((current) => ({ ...current, phone: undefined }))
      setSystemMessage('Telefone valido e livre para novo cadastro.')
      return
    }

    setForm((current) => ({
      ...current,
      clientName: data.full_name ?? current.clientName,
      documentNumber: formatDocument(data.document_number ?? current.documentNumber),
      email: data.email ?? current.email,
      phone: formatPhone(data.phone ?? current.phone),
    }))
    setFormErrors((current) => ({ ...current, phone: undefined }))
    setSystemMessage('Telefone encontrado na base Supabase. Dados do cliente preenchidos.')
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
      value: form.value.trim(),
      date: form.date,
      interestPercent: Number(form.interestPercent || 30),
    }

    const nextErrors = validateForm(nextContract)
    if (Object.keys(nextErrors).length > 0) {
      setSystemMessage('Cadastro bloqueado: corrija os campos nao validados.')
      return
    }

    if (isSupabaseConfigured && supabase) {
      if (!tenant) {
        setSystemMessage('Selecione ou crie uma empresa antes de cadastrar contratos.')
        return
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          tenant_id: tenant.id,
          full_name: nextContract.clientName,
          document_number: nextContract.documentNumber || null,
          document_digits: onlyDigits(nextContract.documentNumber) || null,
          email_domain: getEmailDomain(nextContract.email) || null,
          email: nextContract.email || null,
          phone_digits: onlyDigits(nextContract.phone) || null,
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
          tenant_id: tenant.id,
          code: nextContract.id,
          client_id: client.id,
          principal_amount: amount,
          status: nextContract.status,
          risk: nextContract.status === 'overdue' ? 'high' : 'low',
          guarantee_type: 'Contrato',
          interest_percentage: nextContract.interestPercent,
          duration_indefinite: nextContract.duration === 'indefinite',
          duration_months: nextContract.duration === 'indefinite' ? null : Number(nextContract.duration),
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
    setFormErrors({})
  }

  async function removeContract(contract: Contract) {
    if (isSupabaseConfigured && supabase && tenant && contract.operationId) {
      await supabase.from('operations').delete().eq('id', contract.operationId).eq('tenant_id', tenant.id)
      if (contract.clientId) {
        await supabase.from('clients').delete().eq('id', contract.clientId).eq('tenant_id', tenant.id)
      }
    }

    persistContracts(contracts.filter((item) => item.id !== contract.id), 'Contrato removido.')
  }

  async function clearContracts() {
    if (isSupabaseConfigured && supabase && tenant) {
      await supabase.from('operations').delete().eq('tenant_id', tenant.id)
      await supabase.from('clients').delete().eq('tenant_id', tenant.id)
    }

    persistContracts([], isSupabaseConfigured ? 'Base local e Supabase zerados.' : 'Base local zerada.')
  }

  function appendCalculatorValue(value: string) {
    setCalculatorValue((current) => `${current}${value}`)
  }

  function resolveCalculator() {
    const expression = calculatorValue.replaceAll(',', '.').replaceAll('×', '*').replaceAll('÷', '/')
    if (!expression || !/^[\d+\-*/().\s%]+$/.test(expression)) {
      setCalculatorValue('Erro')
      return
    }

    try {
      const result = Function(`"use strict"; return (${expression})`)() as unknown
      setCalculatorValue(typeof result === 'number' && Number.isFinite(result) ? String(result).replace('.', ',') : 'Erro')
    } catch {
      setCalculatorValue('Erro')
    }
  }

  if (authLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <img src={brandLogoPath} alt="MTS AppJus" />
          <strong>Carregando sua base segura...</strong>
        </section>
      </main>
    )
  }

  if (isSupabaseConfigured && !session) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <img src={brandLogoPath} alt="MTS AppJus" />
          <div>
            <span className="eyebrow">Acesso unico por usuario</span>
            <h1>{authMode === 'sign-in' ? 'Entrar no sistema' : 'Criar minha base'}</h1>
            <p>Cada login acessa somente a propria base. O acesso e liberado manualmente apos Pix.</p>
          </div>
          <section className="payment-box" aria-label="Compra do sistema via Pix">
            <div>
              <span className="eyebrow">Compra do sistema</span>
              <strong>{pixAmount} uma vez so</strong>
              <p>Pix telefone: {pixPhone}. Envie o comprovante pelo WhatsApp para liberacao.</p>
            </div>
            <img src={pixQrPath} alt="QR Code Pix MTS AppJus" />
            <div className="payment-actions">
              <button className="ghost-button" onClick={() => void copyPixPayload()} type="button">
                <Copy size={16} aria-hidden="true" />
                Copiar Pix
              </button>
              <a className="ghost-button" href={whatsappLink} rel="noreferrer" target="_blank">
                <Phone size={16} aria-hidden="true" />
                Enviar comprovante
              </a>
            </div>
          </section>
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'sign-up' ? (
              <label>
                Nome da empresa ou base
                <input
                  onChange={(event) => updateAuthForm('organizationName', event.target.value)}
                  placeholder="Ex.: Juridico Silva"
                  required
                  value={authForm.organizationName}
                />
              </label>
            ) : null}
            <label>
              E-mail
              <input
                onChange={(event) => updateAuthForm('email', event.target.value)}
                placeholder="usuario@email.com"
                required
                type="email"
                value={authForm.email}
              />
            </label>
            <label>
              Senha
              <input
                minLength={6}
                onChange={(event) => updateAuthForm('password', event.target.value)}
                placeholder="Minimo 6 caracteres"
                required
                type="password"
                value={authForm.password}
              />
            </label>
            <button className="primary-button full" type="submit">
              <ShieldCheck size={18} aria-hidden="true" />
              {authMode === 'sign-in' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
          <button
            className="auth-switch"
            onClick={() => setAuthMode((mode) => (mode === 'sign-in' ? 'sign-up' : 'sign-in'))}
            type="button"
          >
            {authMode === 'sign-in' ? 'Comprar e criar acesso' : 'Ja tenho acesso'}
          </button>
          <a className="auth-training" href={trainingPath} download>
            Baixar treinamento para WhatsApp
          </a>
          <span className="auth-message">{systemMessage}</span>
        </section>
      </main>
    )
  }

  if (isSupabaseConfigured && session && tenant && tenant.subscriptionStatus !== 'active' && !isAppAdmin) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <img src={brandLogoPath} alt="MTS AppJus" />
          <div>
            <span className="eyebrow">Acesso aguardando liberacao</span>
            <h1>Pagamento Pix pendente</h1>
            <p>
              Seu usuario foi criado, mas o sistema so libera a base apos confirmacao manual do pagamento.
            </p>
          </div>
          <section className="payment-box" aria-label="Pagamento pendente via Pix">
            <div>
              <strong>{pixAmount} uma vez so</strong>
              <p>Status atual: {subscriptionStatusLabels[tenant.subscriptionStatus]}.</p>
              <p>Envie o comprovante pelo WhatsApp e aguarde a liberacao do login.</p>
            </div>
            <img src={pixQrPath} alt="QR Code Pix MTS AppJus" />
            <div className="payment-actions">
              <button className="ghost-button" onClick={() => void copyPixPayload()} type="button">
                <Copy size={16} aria-hidden="true" />
                Copiar Pix
              </button>
              <a className="ghost-button" href={whatsappLink} rel="noreferrer" target="_blank">
                <Phone size={16} aria-hidden="true" />
                WhatsApp
              </a>
              <button className="ghost-button" onClick={() => void loadTenant(session)} type="button">
                Conferir liberacao
              </button>
            </div>
          </section>
          <button className="auth-switch" onClick={() => void handleSignOut()} type="button">
            Sair
          </button>
          <span className="auth-message">{systemMessage}</span>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="brand">
          <span className="brand-logo-frame">
            <img className="brand-logo" src={brandLogoPath} alt="MTS AppJus" />
          </span>
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
          <button
            className={calculatorOpen ? 'active nav-button' : 'nav-button'}
            onClick={() => setCalculatorOpen((current) => !current)}
            type="button"
          >
            <Calculator size={18} aria-hidden="true" />
            Calculadora
          </button>
          {isAppAdmin ? (
            <a href="#liberacao">
              <ShieldCheck size={18} aria-hidden="true" />
              Liberar acessos
            </a>
          ) : null}
        </nav>

        {calculatorOpen ? (
          <section className="quick-calculator" aria-label="Calculadora rapida">
            <input
              aria-label="Visor da calculadora"
              onChange={(event) => setCalculatorValue(event.target.value)}
              placeholder="0"
              value={calculatorValue}
            />
            <div>
              {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', ',', '.', '+'].map((key) => (
                <button key={key} onClick={() => appendCalculatorValue(key)} type="button">
                  {key}
                </button>
              ))}
              <button onClick={() => setCalculatorValue('')} type="button">
                C
              </button>
              <button onClick={() => appendCalculatorValue('/100')} type="button">
                %
              </button>
              <button className="equals" onClick={resolveCalculator} type="button">
                =
              </button>
            </div>
          </section>
        ) : null}

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
          <img src={brandLogoPath} alt="MTS AppJus - Gestao Discreta e Segura de Acordos Privados" />
        </section>

        <header className="topbar" id="dashboard">
          <div>
            <span className="eyebrow">Gestao discreta e segura de acordos privados</span>
            <h1>Base operacional</h1>
            <p className="title-support">Controle de contratos, clientes, datas reais e documentos vinculados.</p>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input
                aria-label="Buscar contratos"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar contrato, nome, documento"
                value={query}
              />
            </label>
            <a className="primary-button" href="#cadastro">
              <Plus size={18} aria-hidden="true" />
              Novo acordo
            </a>
            {isAppAdmin ? (
              <a className="ghost-button" href="#liberacao">
                <ShieldCheck size={18} aria-hidden="true" />
                Liberar acessos
              </a>
            ) : null}
          </div>
        </header>

        <section className="tenant-bar" aria-label="Conta ativa">
          <div>
            <strong>
              {isAppAdmin
                ? 'Acesso master'
                : tenant?.name ?? (isSupabaseConfigured ? 'Supabase conectado' : 'Banco Supabase pendente')}
            </strong>
            <span>
              {isAppAdmin
                ? 'Administrador liberado para aprovar clientes apos confirmacao do Pix.'
                : tenant
                ? `Acesso: ${subscriptionStatusLabels[tenant.subscriptionStatus]}`
                : isSupabaseConfigured
                  ? 'Login online habilitado. Entre para usar sua base na nuvem.'
                  : `Configure no Cloudflare: ${supabaseConfig.missing.join(' + ')}`}
            </span>
          </div>
          {session ? (
            <button className="ghost-button" onClick={() => void handleSignOut()} type="button">
              Sair
            </button>
          ) : null}
        </section>

        <nav className="top-tabs" aria-label="Guias superiores">
          <a className="active" href="#dashboard">
            Resumo
          </a>
          <a href="#contratos">Contratos</a>
          <a href="#cadastro">Novo acordo</a>
          {isAppAdmin ? <a href="#liberacao">Liberar acessos</a> : null}
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
          {isAppAdmin ? (
            <article className="panel admin-panel" id="liberacao">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Painel do proprietario</span>
                  <h2>Liberação de acessos Pix</h2>
                </div>
                <button className="ghost-button" onClick={() => void loadPendingAccess()} type="button">
                  Atualizar
                </button>
              </div>
              <div className="admin-list">
                {pendingAccess.length > 0 ? (
                  pendingAccess.map((access) => {
                    const accessTenant = Array.isArray(access.tenants) ? access.tenants[0] : access.tenants
                    return (
                      <div className="admin-row" key={access.id}>
                        <div>
                          <strong>{accessTenant?.name ?? 'Base sem nome'}</strong>
                          <span>{access.billing_email ?? 'sem e-mail'}</span>
                          <small>{subscriptionStatusLabels[access.status]}</small>
                        </div>
                        <button className="primary-button" onClick={() => void approveAccess(access.id)} type="button">
                          Liberar login
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <div className="empty-state">
                    <strong>Nenhum acesso pendente</strong>
                    <span>Quando um usuario comprar por Pix, ele aparece aqui para liberacao.</span>
                  </div>
                )}
              </div>
            </article>
          ) : null}

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
              <div className="contract-tabs" aria-label="Filtrar contratos por status">
                {[
                  { label: 'Todos', value: 'all' as ContractTab },
                  { label: 'Mensal', value: 'monthly' as ContractTab },
                  { label: 'Ativos', value: 'active' as ContractTab },
                  { label: 'Pausados', value: 'paused' as ContractTab },
                  { label: 'Inadimplentes', value: 'overdue' as ContractTab },
                ].map((tab) => {
                  const count =
                    tab.value === 'all'
                      ? contracts.length
                      : tab.value === 'monthly'
                        ? contracts.filter((contract) => contract.date.slice(0, 7) === getCurrentMonthKey()).length
                        : contracts.filter((contract) => contract.status === tab.value).length
                  return (
                    <button
                      className={contractTab === tab.value ? 'active' : undefined}
                      key={tab.value}
                      onClick={() => setContractTab(tab.value)}
                      type="button"
                    >
                      {tab.label}
                      <span>{count}</span>
                    </button>
                  )
                })}
              </div>
              <div className="contract-header">
                <span>Nome</span>
                <span>Valor</span>
                <span>%</span>
                <span>A receber 30d</span>
                <span>Data</span>
                <span>Tempo</span>
                <span>Status</span>
                <span>Acoes</span>
              </div>
              {pagedContracts.length > 0 ? (
                pagedContracts.map((contract) => {
                  const reminderUrl = getDebtReminderUrl(contract)
                  return (
                    <div className="contract-row" key={contract.id}>
                      <div>
                        <strong>{contract.clientName}</strong>
                        <span>
                          {contract.id} - CPF/CNPJ: {displayInfo(contract.documentNumber)}
                        </span>
                        <small>
                          Tel: {displayInfo(contract.phone)} | E-mail: {displayInfo(contract.email)}
                        </small>
                      </div>
                      <strong data-label="Valor">{contract.value}</strong>
                      <span data-label="Porcentagem">{contract.interestPercent}%</span>
                      <strong data-label="A receber 30d">{formatCurrencyAmount(getReceivableAmount(contract))}</strong>
                      <time data-label="Data" dateTime={contract.date}>{formatDate(contract.date)}</time>
                      <span data-label="Tempo">{formatDuration(contract.duration)}</span>
                      <span data-label="Status" className={`status-badge status-${contract.status}`}>
                        {contractStatusLabels[contract.status]}
                      </span>
                      <div className="row-actions" data-label="Acoes">
                        {reminderUrl ? (
                          <a
                            className="icon-button whatsapp-button"
                            href={reminderUrl}
                            rel="noreferrer"
                            target="_blank"
                            aria-label={`Enviar lembrete por WhatsApp para ${contract.clientName}`}
                          >
                            <MessageCircle size={16} aria-hidden="true" />
                          </a>
                        ) : (
                          <button
                            className="icon-button whatsapp-button"
                            disabled
                            title="Sem telefone valido para WhatsApp"
                            type="button"
                            aria-label={`Sem telefone valido para ${contract.clientName}`}
                          >
                            <MessageCircle size={16} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          className="icon-button remove-button"
                          onClick={() => removeContract(contract)}
                          type="button"
                          aria-label={`Remover contrato de ${contract.clientName}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state">
                  <strong>Nenhum contrato cadastrado</strong>
                  <span>Use a guia Cadastro para juristas para inserir o primeiro contrato.</span>
                </div>
              )}
              <div className="contracts-total">
                <span>
                  {contractTab === 'monthly'
                    ? `Total a receber em 30 dias - ${currentMonthLabel}`
                    : 'Total a receber em 30 dias'}
                </span>
                <strong>{formatCurrencyAmount(filteredContractsTotal)}</strong>
              </div>
              {filteredContracts.length > 0 ? (
                <div className="pagination-bar">
                  <span>
                    Pagina {currentPage} de {totalPages}
                  </span>
                  <div>
                    <button
                      className="ghost-button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      type="button"
                    >
                      Anterior
                    </button>
                    <button
                      className="ghost-button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      type="button"
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              ) : null}
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
                <legend>Informações ao cliente</legend>
                <label>
                  Nome do cliente
                  <input
                    aria-invalid={Boolean(formErrors.clientName)}
                    className={formErrors.clientName ? 'field-invalid' : undefined}
                    onBlur={() => validateAndMarkField('clientName')}
                    onChange={(event) => updateForm('clientName', event.target.value)}
                    placeholder="Nome completo ou razão social"
                    required
                    value={form.clientName}
                  />
                  {formErrors.clientName ? <small className="field-error">{formErrors.clientName}</small> : null}
                </label>
                <label>
                  CPF ou CNPJ
                  <input
                    aria-invalid={Boolean(formErrors.documentNumber)}
                    className={formErrors.documentNumber ? 'field-invalid' : undefined}
                    inputMode="numeric"
                    onBlur={(event) => void lookupDocument(event.target.value)}
                    onChange={(event) => updateForm('documentNumber', event.target.value)}
                    placeholder="Sem informacao"
                    value={form.documentNumber}
                  />
                  {formErrors.documentNumber ? <small className="field-error">{formErrors.documentNumber}</small> : null}
                  {!formErrors.documentNumber ? (
                    <small>Preferencialmente informe CPF/CNPJ correto. Se nao tiver, deixe em branco.</small>
                  ) : null}
                </label>
                <label>
                  Telefone
                  <input
                    aria-invalid={Boolean(formErrors.phone)}
                    className={formErrors.phone ? 'field-invalid' : undefined}
                    inputMode="tel"
                    onBlur={(event) => void lookupPhone(event.target.value)}
                    onChange={(event) => updateForm('phone', event.target.value)}
                    placeholder="Sem informacao"
                    value={form.phone}
                  />
                  {formErrors.phone ? <small className="field-error">{formErrors.phone}</small> : null}
                  {!formErrors.phone ? (
                    <small>Preferencialmente informe telefone real com DDD para lembretes no WhatsApp.</small>
                  ) : null}
                </label>
                <label>
                  E-mail
                  <span className={`email-field ${formErrors.email ? 'field-invalid' : ''}`}>
                    <Mail size={16} aria-hidden="true" />
                    <input
                      aria-invalid={Boolean(formErrors.email)}
                      onBlur={() => validateAndMarkField('email')}
                      onChange={(event) => updateForm('email', event.target.value)}
                      placeholder="Sem informacao"
                      type="email"
                      value={form.email}
                    />
                  </span>
                  {formErrors.email ? (
                    <small className="field-error">{formErrors.email}</small>
                  ) : form.email ? (
                    <small>Dominio vinculado: {getEmailDomain(form.email) || 'informe o dominio'}</small>
                  ) : (
                    <small>Preferencialmente informe um e-mail valido. Se nao tiver, deixe em branco.</small>
                  )}
                </label>
              </fieldset>

              <fieldset>
                <legend>Dados do contrato</legend>
                <label>
                  Valor do contrato
                  <input
                    aria-invalid={Boolean(formErrors.value)}
                    className={formErrors.value ? 'field-invalid' : undefined}
                    onBlur={() => validateAndMarkField('value')}
                    onChange={(event) => updateForm('value', event.target.value)}
                    placeholder="R$ 0,00"
                    required
                    value={form.value}
                  />
                  {formErrors.value ? <small className="field-error">{formErrors.value}</small> : null}
                </label>
                <label>
                  Porcentagem a receber
                  <select
                    onChange={(event) => updateForm('interestPercent', event.target.value)}
                    value={form.interestPercent}
                  >
                    {interestPercentageOptions.map((percentage) => (
                      <option key={percentage} value={percentage}>
                        {percentage}%
                      </option>
                    ))}
                  </select>
                  <small>
                    Exemplo: R$ 100,00 com 30% vira R$ 130,00 a receber em 30 dias.
                  </small>
                </label>
                <label>
                  Data
                  <input
                    aria-invalid={Boolean(formErrors.date)}
                    className={formErrors.date ? 'field-invalid' : undefined}
                    onBlur={() => validateAndMarkField('date')}
                    onChange={(event) => updateForm('date', event.target.value)}
                    required
                    type="date"
                    value={form.date}
                  />
                  {formErrors.date ? <small className="field-error">{formErrors.date}</small> : null}
                </label>
                <label>
                  Tempo do contrato
                  <select
                    onChange={(event) => updateForm('duration', event.target.value)}
                    value={form.duration}
                  >
                    {contractDurationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    onChange={(event) => updateForm('status', event.target.value)}
                    value={form.status}
                  >
                    <option value="active">Contrato ativo</option>
                    <option value="paused">Contrato pausado</option>
                    <option value="overdue">Contrato inadimplente</option>
                  </select>
                </label>
              </fieldset>

              <button className="primary-button full" type="submit">
                <ShieldCheck size={18} aria-hidden="true" />
                Salvar contrato
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </form>
          </article>
        </section>

        <footer className="site-footer">
          <div className="footer-brandline">
            <strong>Feito por - empresa mtsinforj 2/2026.</strong>
            <span>RJ-BRASIL</span>
          </div>
          <div className="footer-socials" aria-label="Links de contato">
            <a href={whatsappLink} rel="noreferrer" target="_blank" aria-label="WhatsApp mtsinforj">
              <Phone size={16} aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/mtsinforj" rel="noreferrer" target="_blank" aria-label="Instagram mtsinforj">
              <AtSign size={16} aria-hidden="true" />
              <span>{instagramHandle}</span>
            </a>
            <a href="mailto:mts.ic@hotmail.com" aria-label="E-mail mtsinforj">
              <Mail size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="footer-payment" aria-label="Bandeiras de cartoes aceitas">
            <span>Cartoes aceitos</span>
            <div>
              <i>VISA</i>
              <i>MASTER</i>
              <i>ELO</i>
              <i>AMEX</i>
              <i>PIX</i>
            </div>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App
