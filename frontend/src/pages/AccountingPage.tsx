import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { api } from '../hooks/useApi'

// ─── Types ────────────────────────────────────────────────────────
interface Invoice {
  id?: number
  invoice_kind: string
  invoice_type: string
  template: string
  subject: string
  taxpayer_role: string
  tax_number: string
  total: number
  vat: number
  status: string
  issue_date: string
  portfolio_date: string
  counterparty_id: string
  counterparty_tax_number: string
  branch: string
  counterparty_name: string
  counterparty_trade_name: string
  counterparty_type: string
  settlement_method: string
  year_period: string
  total_without_tax: number
  reference_invoice: string
  response_datetime: string
  settlement_balance: number
  extra_data: Record<string, any>
  created_at?: string
  updated_at?: string
}

// ─── Column mapping from Excel headers ───────────────────────────
const COL_MAP_BUY: Record<string, keyof Invoice> = {
  'نوع صورت‌حساب': 'invoice_type',
  'الگو صورت‌حساب': 'template',
  'موضوع صورت‌حساب': 'subject',
  'نقش مودی (نقش خریدار)': 'taxpayer_role',
  'شماره مالیاتی صورت‌حساب': 'tax_number',
  'مجموع صورت‌حساب': 'total',
  'مالیات بر ارزش افزوده': 'vat',
  'وضعیت صورت‌حساب': 'status',
  'تاریخ صدور صورت‌حساب': 'issue_date',
  'تاریخ درج در کارپوشه': 'portfolio_date',
  'شناسه هویتی فروشنده/ عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_id',
  'شماره اقتصادی فروشنده/ عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_tax_number',
  'شعبه خریدار': 'branch',
  'نام فروشنده/عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_name',
  'نام تجاری فروشنده/عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_trade_name',
  'نوع شخص فروشنده/عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_type',
  'روش تسویه': 'settlement_method',
  'سال و دوره': 'year_period',
  'مجموع بهای کالا و خدمات صورت‌حساب بدون مالیات‌ها و عوارض (ریال)': 'total_without_tax',
  'شماره مالیاتی صورت‌حساب مرجع': 'reference_invoice',
  'تاریخ و زمان واکنش به صورت‌حساب': 'response_datetime',
  'مانده تسویه صورت‌حساب': 'settlement_balance',
}

const COL_MAP_SELL: Record<string, keyof Invoice> = {
  'نوع صورت‌حساب': 'invoice_type',
  'الگو صورت‌حساب': 'template',
  'موضوع صورت‌حساب': 'subject',
  'نقش مودی (نقش فروشنده)': 'taxpayer_role',
  'شماره مالیاتی صورت‌حساب': 'tax_number',
  'مجموع صورت‌حساب': 'total',
  'مالیات بر ارزش افزوده': 'vat',
  'وضعیت صورت‌حساب': 'status',
  'تاریخ صدور صورت‌حساب': 'issue_date',
  'تاریخ درج در کارپوشه': 'portfolio_date',
  'شناسه هویتی خریدار/ عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_id',
  'شماره اقتصادی خریدار/عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_tax_number',
  'شعبه فروشنده': 'branch',
  'نام خریدار/عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_name',
  'نام تجاری خریدار/عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_trade_name',
  'نوع شخص خریدار/عرضه کننده واسط کالا و خدمت/ حق‌العملکار': 'counterparty_type',
  'روش تسویه': 'settlement_method',
  'سال و دوره': 'year_period',
  'مجموع بهای کالا و خدمات صورت‌حساب بدون مالیات‌ها و عوارض (ریال)': 'total_without_tax',
  'شماره مالیاتی صورت‌حساب مرجع': 'reference_invoice',
  'تاریخ و زمان واکنش به صورت‌حساب': 'response_datetime',
  'مانده تسویه صورت‌حساب': 'settlement_balance',
}

const EXTRA_SELL_COLS = ['وضعیت احتساب', 'تاریخ صدور صورت‌حساب ارجاعی ابطال کننده', 'تاریخ تنظیم وضعیت عدم احتساب']

function parseExcel(file: File, kind: 'خرید' | 'فروش'): Promise<Invoice[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (rows.length < 2) return resolve([])

        const headers: string[] = rows[0].map(String)
        const colMap = kind === 'خرید' ? COL_MAP_BUY : COL_MAP_SELL

        const invoices: Invoice[] = rows.slice(1).map(row => {
          const inv: any = {
            invoice_kind: kind,
            invoice_type: '', template: '', subject: '', taxpayer_role: '',
            tax_number: '', total: 0, vat: 0, status: '', issue_date: '',
            portfolio_date: '', counterparty_id: '', counterparty_tax_number: '',
            branch: '', counterparty_name: '', counterparty_trade_name: '',
            counterparty_type: '', settlement_method: '', year_period: '',
            total_without_tax: 0, reference_invoice: '', response_datetime: '',
            settlement_balance: 0, extra_data: {},
          }
          headers.forEach((h, i) => {
            const field = colMap[h]
            const val = row[i]
            if (field) {
              inv[field] = typeof inv[field] === 'number' ? (Number(val) || 0) : String(val ?? '')
            } else if (EXTRA_SELL_COLS.includes(h) && val !== '') {
              inv.extra_data[h] = val
            }
          })
          return inv as Invoice
        }).filter(inv => inv.tax_number || inv.counterparty_name)

        resolve(invoices)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function fmt(n: number) {
  return n.toLocaleString('fa-IR')
}

const EMPTY: Invoice = {
  invoice_kind: 'خرید', invoice_type: 'اول', template: 'فروش', subject: 'اصلی',
  taxpayer_role: 'عادی', tax_number: '', total: 0, vat: 0, status: 'در انتظار واکنش',
  issue_date: '', portfolio_date: '', counterparty_id: '', counterparty_tax_number: '',
  branch: '', counterparty_name: '', counterparty_trade_name: '', counterparty_type: 'حقوقی',
  settlement_method: 'نقدی', year_period: '', total_without_tax: 0,
  reference_invoice: '', response_datetime: '', settlement_balance: 0, extra_data: {},
}

const STATUS_COLORS: Record<string, string> = {
  'تایید سیستمی':       '#22c55e',
  'تایید شده':          '#22c55e',
  'در انتظار واکنش':    '#f59e0b',
  'باطل شده':           '#ef4444',
  'ابطالی':             '#ef4444',
  'عدم نیاز به واکنش':  '#6b7280',
}

// ─── Modal component ──────────────────────────────────────────────
function InvoiceModal({
  inv, onSave, onClose,
}: {
  inv: Invoice | null
  onSave: (data: Invoice) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Invoice>(inv ?? { ...EMPTY })

  const set = (k: keyof Invoice, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          background: '#1e1e2e', borderRadius: 16, padding: 24,
          width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
          direction: 'rtl', color: '#e2e8f0',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#a78bfa' }}>
          {inv?.id ? 'ویرایش صورت‌حساب' : 'صورت‌حساب جدید'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['invoice_kind', 'نوع', 'select', ['خرید', 'فروش']],
            ['subject', 'موضوع', 'select', ['اصلی', 'اصلاحی', 'ابطالی']],
            ['tax_number', 'شماره مالیاتی', 'text'],
            ['counterparty_name', 'نام طرف حساب', 'text'],
            ['counterparty_id', 'شناسه هویتی', 'text'],
            ['counterparty_tax_number', 'شماره اقتصادی', 'text'],
            ['total', 'مجموع (ریال)', 'number'],
            ['vat', 'مالیات ارزش افزوده', 'number'],
            ['total_without_tax', 'مبلغ بدون مالیات', 'number'],
            ['settlement_balance', 'مانده تسویه', 'number'],
            ['issue_date', 'تاریخ صدور', 'text'],
            ['portfolio_date', 'تاریخ درج کارپوشه', 'text'],
            ['status', 'وضعیت', 'select', ['تایید سیستمی','تایید شده','در انتظار واکنش','باطل شده','عدم نیاز به واکنش']],
            ['settlement_method', 'روش تسویه', 'select', ['نقدی', 'غیرنقدی', 'مختلط']],
            ['year_period', 'سال و دوره', 'text'],
            ['branch', 'شعبه', 'text'],
            ['counterparty_type', 'نوع شخص', 'select', ['حقوقی', 'حقیقی']],
            ['reference_invoice', 'صورت‌حساب مرجع', 'text'],
          ] as [keyof Invoice, string, string, string[]?][]).map(([key, label, type, opts]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#94a3b8' }}>{label}</label>
              {type === 'select' ? (
                <select
                  value={String(form[key] ?? '')}
                  onChange={e => set(key, e.target.value)}
                  style={inputStyle}
                >
                  {opts!.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={type}
                  value={String(form[key] ?? '')}
                  onChange={e => set(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnStyle, background: '#374151' }}>لغو</button>
          <button onClick={() => onSave(form)} style={{ ...btnStyle, background: '#7c3aed' }}>ذخیره</button>
        </div>
      </motion.div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#2d2d44', border: '1px solid #4b5563', borderRadius: 8,
  padding: '8px 10px', color: '#e2e8f0', fontSize: 13, outline: 'none',
  direction: 'rtl',
}
const btnStyle: React.CSSProperties = {
  padding: '9px 20px', borderRadius: 10, border: 'none',
  cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600,
}

// ─── Main Page ────────────────────────────────────────────────────
export default function AccountingPage() {
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<'خرید' | 'فروش'>('خرید')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [modalInv, setModalInv] = useState<Invoice | null | false>(false)
  const [summary, setSummary] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [invRes, sumRes] = await Promise.all([
        api.getInvoices({ kind: tab, status: statusFilter || undefined, search: search || undefined }),
        api.getAccountingSummary(),
      ])
      setInvoices(invRes.data)
      setSummary(sumRes.data)
    } catch {
      showToast('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const parsed = await parseExcel(file, tab)
      if (parsed.length === 0) { showToast('فایل خالی یا ساختار نادرست'); return }
      await api.bulkCreateInvoices(parsed)
      showToast(`${parsed.length} صورت‌حساب وارد شد`)
      await load()
    } catch {
      showToast('خطا در پردازش فایل اکسل')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleSave = async (data: Invoice) => {
    try {
      if (data.id) {
        await api.updateInvoice(data.id, data)
        showToast('ویرایش ذخیره شد')
      } else {
        await api.createInvoice({ ...data, invoice_kind: tab })
        showToast('صورت‌حساب ایجاد شد')
      }
      setModalInv(false)
      await load()
    } catch {
      showToast('خطا در ذخیره')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('حذف شود؟')) return
    try {
      await api.deleteInvoice(id)
      showToast('حذف شد')
      await load()
    } catch {
      showToast('خطا در حذف')
    }
  }

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(`${selected.size} مورد حذف شود؟`)) return
    try {
      await api.deleteManyInvoices(Array.from(selected))
      setSelected(new Set())
      showToast(`${selected.size} مورد حذف شد`)
      await load()
    } catch {
      showToast('خطا در حذف')
    }
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === invoices.length) setSelected(new Set())
    else setSelected(new Set(invoices.map(i => i.id!).filter(Boolean)))
  }

  const cur = summary?.[tab === 'خرید' ? 'purchase' : 'sale']

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
              background: '#7c3aed', color: '#fff', padding: '10px 24px', borderRadius: 10,
              zIndex: 2000, fontSize: 14, fontWeight: 600,
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ background: '#1e1e2e', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 22, padding: 4 }}>
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>سامانه حسابداری — صورت‌حساب‌های الکترونیکی</h1>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px' }}>
        {/* Summary Cards */}
        {cur && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'تعداد صورت‌حساب', value: String(cur.count), color: '#a78bfa' },
              { label: 'مجموع کل (ریال)', value: fmt(cur.total), color: '#22c55e' },
              { label: 'مالیات ارزش افزوده', value: fmt(cur.vat), color: '#f59e0b' },
              { label: 'مبلغ بدون مالیات', value: fmt(cur.without_tax), color: '#38bdf8' },
            ].map(card => (
              <div key={card.label} style={{ background: '#1e1e2e', borderRadius: 12, padding: '14px 16px', border: `1px solid ${card.color}33` }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{card.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: '#1e1e2e', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {(['خرید', 'فروش'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(new Set()) }}
              style={{
                padding: '8px 28px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: tab === t ? '#7c3aed' : 'transparent',
                color: tab === t ? '#fff' : '#94a3b8',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
              }}
            >
              {t === 'خرید' ? 'خرید (ورودی)' : 'فروش (خروجی)'}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو: نام، شماره مالیاتی..."
              style={{ ...inputStyle, width: 220, fontSize: 13 }}
            />
            <button type="submit" style={{ ...btnStyle, background: '#334155', fontSize: 13 }}>جستجو</button>
          </form>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, fontSize: 13 }}>
            <option value="">همه وضعیت‌ها</option>
            {['تایید سیستمی', 'تایید شده', 'در انتظار واکنش', 'باطل شده', 'عدم نیاز به واکنش'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div style={{ marginRight: 'auto', display: 'flex', gap: 8 }}>
            {selected.size > 0 && (
              <button onClick={handleDeleteSelected} style={{ ...btnStyle, background: '#dc2626', fontSize: 13 }}>
                حذف {selected.size} مورد
              </button>
            )}
            <button onClick={() => setModalInv({ ...EMPTY, invoice_kind: tab })} style={{ ...btnStyle, background: '#059669', fontSize: 13 }}>
              + سند جدید
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} style={{ display: 'none' }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              style={{ ...btnStyle, background: '#1d4ed8', fontSize: 13, opacity: importing ? 0.6 : 1 }}
            >
              {importing ? 'در حال پردازش...' : 'آپلود اکسل'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #2d2d44' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>در حال بارگذاری...</div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div>هنوز صورت‌حسابی وجود ندارد</div>
              <div style={{ fontSize: 12, marginTop: 6, color: '#475569' }}>فایل اکسل آپلود کنید یا سند جدید بزنید</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#1e1e2e', borderBottom: '2px solid #374151' }}>
                  <th style={th}>
                    <input type="checkbox" checked={selected.size === invoices.length && invoices.length > 0} onChange={toggleAll} />
                  </th>
                  <th style={th}>ردیف</th>
                  <th style={th}>شماره مالیاتی</th>
                  <th style={th}>نام طرف حساب</th>
                  <th style={th}>موضوع</th>
                  <th style={th}>مجموع (ریال)</th>
                  <th style={th}>مالیات</th>
                  <th style={th}>وضعیت</th>
                  <th style={th}>تاریخ صدور</th>
                  <th style={th}>روش تسویه</th>
                  <th style={th}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    style={{
                      background: selected.has(inv.id!) ? '#1e1b3a' : idx % 2 === 0 ? '#161625' : '#1a1a2e',
                      borderBottom: '1px solid #2d2d44',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={td}>
                      <input type="checkbox" checked={selected.has(inv.id!)} onChange={() => toggleSelect(inv.id!)} />
                    </td>
                    <td style={{ ...td, color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ ...td, color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>
                      {inv.tax_number}
                    </td>
                    <td style={{ ...td, fontWeight: 600, color: '#e2e8f0' }}>{inv.counterparty_name || '—'}</td>
                    <td style={td}>{inv.subject}</td>
                    <td style={{ ...td, color: '#22c55e', fontWeight: 600 }}>{fmt(inv.total)}</td>
                    <td style={{ ...td, color: '#f59e0b' }}>{fmt(inv.vat)}</td>
                    <td style={td}>
                      <span style={{
                        background: (STATUS_COLORS[inv.status] || '#6b7280') + '22',
                        color: STATUS_COLORS[inv.status] || '#6b7280',
                        borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ ...td, color: '#64748b', fontSize: 12 }}>{inv.issue_date?.split(' ')[0]}</td>
                    <td style={td}>{inv.settlement_method}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModalInv(inv)} style={actBtn('#7c3aed')}>ویرایش</button>
                        <button onClick={() => handleDelete(inv.id!)} style={actBtn('#dc2626')}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalInv !== false && (
          <InvoiceModal
            inv={modalInv === null ? null : modalInv}
            onSave={handleSave}
            onClose={() => setModalInv(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const th: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'right', color: '#94a3b8',
  fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12,
}
const td: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap',
}
const actBtn = (color: string): React.CSSProperties => ({
  background: color + '22', border: `1px solid ${color}44`, color,
  borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
})
