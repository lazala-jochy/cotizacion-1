import { supabase } from './supabaseClient.js'

async function unwrap(promise) {
  const { data, error } = await promise
  if (error) throw new Error(error.message)
  return data
}

function orFilter(columns, search) {
  const escaped = search.replace(/[%,]/g, '')
  return columns.map((col) => `${col}.ilike.%${escaped}%`).join(',')
}

export const api = {
  clients: {
    list: (search = '') => {
      let query = supabase.from('clients').select('*').order('name')
      if (search) query = query.or(orFilter(['name', 'email'], search))
      return unwrap(query)
    },
    get: (id) => unwrap(supabase.from('clients').select('*').eq('id', id).single()),
    create: (payload) => unwrap(supabase.from('clients').insert(payload).select().single()),
    update: (id, payload) => unwrap(supabase.from('clients').update(payload).eq('id', id).select().single()),
    delete: (id) => unwrap(supabase.from('clients').delete().eq('id', id))
  },

  products: {
    list: (search = '') => {
      let query = supabase.from('products').select('*').order('name')
      if (search) query = query.or(orFilter(['name', 'sku'], search))
      return unwrap(query)
    },
    get: (id) => unwrap(supabase.from('products').select('*').eq('id', id).single()),
    create: (payload) => unwrap(supabase.from('products').insert(payload).select().single()),
    update: (id, payload) => unwrap(supabase.from('products').update(payload).eq('id', id).select().single()),
    delete: (id) => unwrap(supabase.from('products').delete().eq('id', id))
  },

  quotes: {
    list: async (filters = {}) => {
      const { search = '', status = '' } = filters
      let query = supabase
        .from('quotes')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      const rows = await unwrap(query)
      const mapped = rows.map(({ clients, ...rest }) => ({ ...rest, client_name: clients?.name || null }))
      if (!search) return mapped
      const term = search.toLowerCase()
      return mapped.filter(
        (q) => q.folio.toLowerCase().includes(term) || (q.client_name || '').toLowerCase().includes(term)
      )
    },
    get: async (id) => {
      const data = await unwrap(supabase.from('quotes').select('*, quote_items(*)').eq('id', id).single())
      const { quote_items, ...rest } = data
      return { ...rest, items: quote_items || [] }
    },
    create: (payload) =>
      unwrap(
        supabase.rpc('create_quote', {
          p_client_id: payload.client_id,
          p_issue_date: payload.issue_date,
          p_valid_until: payload.valid_until,
          p_status: payload.status,
          p_tax_rate: payload.tax_rate,
          p_currency: payload.currency,
          p_notes: payload.notes,
          p_items: payload.items
        })
      ),
    update: (id, payload) =>
      unwrap(
        supabase.rpc('update_quote', {
          p_quote_id: id,
          p_client_id: payload.client_id,
          p_issue_date: payload.issue_date,
          p_valid_until: payload.valid_until,
          p_status: payload.status,
          p_tax_rate: payload.tax_rate,
          p_currency: payload.currency,
          p_notes: payload.notes,
          p_items: payload.items
        })
      ),
    duplicate: (id) => unwrap(supabase.rpc('duplicate_quote', { p_quote_id: id })),
    updateStatus: (id, status) => unwrap(supabase.from('quotes').update({ status }).eq('id', id).select().single()),
    delete: (id) => unwrap(supabase.from('quotes').delete().eq('id', id))
  },

  settings: {
    get: () => unwrap(supabase.from('organizations').select('*').single()),
    update: (payload) => unwrap(supabase.from('organizations').update(payload).select().single())
  },

  auth: {
    signUp: ({ email, password, companyName, companyTaxId, companyAddress, companyPhone, companyEmail, companyLogoPath }) =>
      supabase.auth.signUp({ email, password }).then(async ({ data, error }) => {
        if (error) throw new Error(error.message)
        if (data.session) {
          const { error: rpcError } = await supabase.rpc('complete_signup', {
            p_company_name: companyName,
            p_company_tax_id: companyTaxId,
            p_company_address: companyAddress,
            p_company_phone: companyPhone,
            p_company_email: companyEmail,
            p_company_logo_path: companyLogoPath || null
          })
          if (rpcError) {
            // La cuenta de acceso ya se creó en Supabase Auth pero la empresa no se pudo
            // registrar (ej. nombre/RNC/correo duplicado): cerramos la sesión para no dejar
            // al usuario "a medias" (con sesión pero sin organización) y que pueda reintentar.
            await supabase.auth.signOut()
            throw new Error(rpcError.message)
          }
        }
        return data
      }),
    signIn: ({ email, password }) => unwrap(supabase.auth.signInWithPassword({ email, password })),
    recoverPassword: ({ email, companyTaxId, newPassword }) =>
      unwrap(
        supabase.rpc('recover_password', {
          p_email: email,
          p_company_tax_id: companyTaxId,
          p_new_password: newPassword
        })
      ),
    checkCompanyName: (name) => unwrap(supabase.rpc('company_name_available', { p_name: name })),
    checkCompanyTaxId: (taxId) => unwrap(supabase.rpc('company_tax_id_available', { p_tax_id: taxId })),
    checkCompanyEmail: (email) => unwrap(supabase.rpc('company_email_available', { p_email: email }))
  },

  files: {
    pickLogo: (...args) => window.api.files.pickLogo(...args),
    getLogoDataUri: (...args) => window.api.files.getLogoDataUri(...args)
  },

  credentials: {
    save: (email, password) => window.api.credentials.save({ email, password }),
    load: () => window.api.credentials.load(),
    clear: () => window.api.credentials.clear()
  },

  app: {
    getVersion: () => window.api.app.getVersion()
  },

  pdf: {
    export: (...args) => window.api.pdf.export(...args)
  }
}
