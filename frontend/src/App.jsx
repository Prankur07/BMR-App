import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Save,
  Printer, 
  Plus,
  Minus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Calculator,
  User,
  Wifi,
  Zap,
  Settings
} from 'lucide-react'

const API_BASE = '/api'

function App() {
  const [formData, setFormData] = useState({
    mandi_name: 'Raisen Mandi',
    variety: 'PUSA',
    firm_name: 'Babu Lal Manoj Kumar',
    frtc_number: '',
    full_name: '',
    village: '',
    no_of_bages: '',
    tag_color: 'Red'
  })
  const [config, setConfig] = useState(null)
  const [printers, setPrinters] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printCopies, setPrintCopies] = useState(1)
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [useSilentPrint, setUseSilentPrint] = useState(false)
  const [silentPrintSupported, setSilentPrintSupported] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load config on mount
  useEffect(() => {
    fetch(`${API_BASE}/document/config`)
      .then(res => res.json())
      .then(data => {
        setConfig(data)
        setFormData(prev => ({
          ...prev,
          mandi_name: data.default_mandi,
          variety: data.default_variety,
          firm_name: data.default_firm,
          tag_color: data.default_tag_color
        }))
      })
      .catch(err => console.error('Failed to load config:', err))

    // Check silent print support and load printers
    fetch(`${API_BASE}/print/printers`)
      .then(res => res.json())
      .then(data => {
        setPrinters(data.printers || [])
        setSilentPrintSupported(data.printers && data.printers.length > 0)
        if (data.printers && data.printers.length > 0) {
          const defaultPrinter = data.printers.find(p => p.is_default)
          setSelectedPrinter(defaultPrinter ? defaultPrinter.name : data.printers[0].name)
        }
      })
      .catch(err => console.error('Failed to load printers:', err))
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Combine FRTC number with full name
  const combinedFrtc = formData.full_name.trim() 
    ? `${formData.frtc_number.trim()}(${formData.full_name.trim()})`
    : formData.frtc_number.trim()

  const validateForm = () => {
    if (!formData.mandi_name.trim()) return 'Please select Mandi Name'
    if (!formData.variety.trim()) return 'Please select Variety'
    if (!formData.firm_name.trim()) return 'Please select Firm Name'
    if (!formData.frtc_number.trim()) return 'Please enter FRTC Number'
    if (!formData.village.trim()) return 'Please enter Village'
    if (!formData.no_of_bages || parseInt(formData.no_of_bages) < 0) return 'Please enter valid number of bages'
    return null
  }

  // Calculate prints required
  const bagesPerPrint = config?.bages_per_print || 21
  const noOfBages = parseInt(formData.no_of_bages) || 0
  const printsRequired = Math.floor(noOfBages / bagesPerPrint)
  const remainder = noOfBages % bagesPerPrint

  const getSubmitData = () => ({
    ...formData,
    frtc_number: combinedFrtc
  })

  const generateDocument = async (format) => {
    const error = validateForm()
    if (error) {
      showToast(error, 'error')
      return
    }

    setLoading(true)
    try {
      const endpoint = format === 'docx' ? '/document/generate-docx' : '/document/generate-pdf'
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getSubmitData())
      })

      if (!response.ok) throw new Error('Document generation failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = format === 'docx' ? 'docx' : 'pdf'
      a.download = `Mandi_Gate_Pass_${formData.mandi_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${ext}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast(`${format.toUpperCase()} downloaded successfully!`, 'success')
    } catch (err) {
      showToast(`Failed to generate ${format.toUpperCase()}. Please try again.`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const openPrintModal = () => {
    const error = validateForm()
    if (error) {
      showToast(error, 'error')
      return
    }
    setPrintCopies(1)
    setShowPrintModal(true)
  }

  const handlePrint = async () => {
    setLoading(true)
    try {
      const endpoint = useSilentPrint ? '/print/silent-print' : '/print/pdf'
      const body = useSilentPrint 
        ? { data: getSubmitData(), copies: printCopies, printer_name: selectedPrinter }
        : { data: getSubmitData(), copies: printCopies }
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Print preparation failed')
      }

      if (useSilentPrint) {
        const result = await response.json()
        showToast(result.message || `Sent ${printCopies} copy(ies) to printer`, 'success')
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const printWindow = window.open(url, '_blank')
        if (printWindow) {
          printWindow.onload = () => {
            for (let i = 0; i < printCopies; i++) {
              printWindow.print()
            }
          }
        } else {
          showToast('Please allow popups for printing', 'error')
        }
        showToast(`Print dialog opened for ${printCopies} copies`, 'success')
      }

      setShowPrintModal(false)
    } catch (err) {
      showToast(err.message || 'Failed to prepare print. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (config) {
      setFormData({
        mandi_name: config.default_mandi,
        variety: config.default_variety,
        firm_name: config.default_firm,
        frtc_number: '',
        full_name: '',
        village: '',
        no_of_bages: '',
        tag_color: config.default_tag_color
      })
    }
  }

  if (!config) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1><Building2 className="icon" size={24} /> Mandi Gate Pass</h1>
          </div>
        </header>
        <main className="main">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={32} className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p>Loading configuration...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1><Building2 className="icon" size={24} /> Mandi Gate Pass</h1>
          {silentPrintSupported && (
            <span className="status-badge" style={{ 
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 8px', background: 'var(--success)', color: 'white',
              borderRadius: '12px', fontSize: '0.625rem', fontWeight: 600
            }}>
              <Zap size={10} /> Local Printer Ready
            </span>
          )}
        </div>
      </header>

      <main className="main">
        <form onSubmit={(e) => { e.preventDefault(); }}>
          <div className="card">
            <div className="card-title">
              <FileText size={20} /> Gate Pass Details
            </div>

            <div className="form-group">
              <label className="form-label">Mandi Name</label>
              <select
                name="mandi_name"
                className="form-input"
                value={formData.mandi_name}
                onChange={handleInputChange}
                required
              >
                {config.mandi_names.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Variety</label>
              <select
                name="variety"
                className="form-input"
                value={formData.variety}
                onChange={handleInputChange}
                required
              >
                {config.varieties.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Firm Name</label>
              <select
                name="firm_name"
                className="form-input"
                value={formData.firm_name}
                onChange={handleInputChange}
                required
              >
                {config.firm_names.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">FRTC Number</label>
              <input
                type="text"
                name="frtc_number"
                className="form-input"
                placeholder="Enter FRTC Number (e.g., 9004)"
                value={formData.frtc_number}
                onChange={handleInputChange}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                className="form-input"
                placeholder="Enter Full Name (e.g., Naved Khan)"
                value={formData.full_name}
                onChange={handleInputChange}
                autoComplete="off"
              />
              {formData.frtc_number && formData.full_name && (
                <p className="form-hint" style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Will appear as: FRTC-{formData.frtc_number}({formData.full_name})
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Village</label>
              <input
                type="text"
                name="village"
                className="form-input"
                placeholder="Enter Village Name"
                value={formData.village}
                onChange={handleInputChange}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label">No. of Bages</label>
              <input
                type="number"
                name="no_of_bages"
                className="form-input"
                placeholder="Enter number of bages"
                value={formData.no_of_bages}
                onChange={handleInputChange}
                min="0"
                required
              />
              {noOfBages > 0 && (
                <div className="print-calculation" style={{ marginTop: '8px', padding: '10px', background: 'var(--background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Calculator size={16} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Print Calculation:</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                    <div>Total Bages: <strong>{noOfBages}</strong></div>
                    <div>Bages per Print: <strong>{bagesPerPrint}</strong></div>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                      Min Prints Required: <strong>{printsRequired}</strong>
                    </div>
                    <div style={{ color: 'var(--warning)', fontWeight: 600 }}>
                      Labels Left: <strong>{remainder}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Tag Color</label>
              <div className="color-options">
                {config.tag_colors.map(colorValue => {
                  const colorMap = {
                    'Red': '#E74C3C', 'Green': '#27AE60', 'Blue': '#3498DB',
                    'Yellow': '#F39C12', 'Orange': '#E67E22', 'Purple': '#8E44AD',
                    'Black': '#2C3E50', 'White': '#ECF0F1'
                  }
                  const color = colorMap[colorValue] || '#E74C3C'
                  return (
                    <button
                      key={colorValue}
                      type="button"
                      className={`color-option ${formData.tag_color === colorValue ? 'active' : ''}`}
                      onClick={() => handleSelectChange('tag_color', colorValue)}
                      style={{ backgroundColor: color }}
                      title={colorValue}
                    >
                      {formData.tag_color === colorValue && <CheckCircle size={20} style={{ color: colorValue === 'White' || colorValue === 'Yellow' ? '#2C3E50' : 'white' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => generateDocument('docx')}
              disabled={loading}
            >
              <FileText size={18} /> Word (.docx)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => generateDocument('pdf')}
              disabled={loading}
            >
              <Save size={18} /> PDF
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={openPrintModal}
              disabled={loading}
            >
              <Printer size={18} /> Print
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClear}
              disabled={loading}
            >
              <X size={18} /> Clear
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          Mandi Gate Pass Generator &copy; 2024
        </div>
      </main>

      {showPrintModal && (
        <div className="print-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="print-modal" onClick={(e) => e.stopPropagation()}>
            <h3><Printer size={20} /> Print Gate Pass</h3>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={useSilentPrint}
                  onChange={(e) => setUseSilentPrint(e.target.checked)}
                  disabled={!silentPrintSupported}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                />
                <span>
                  {useSilentPrint ? (
                    <>
                      <Zap size={16} style={{ color: 'var(--success)' }} />
                      Silent Print (Direct to Printer)
                    </>
                  ) : (
                    <>
                      <Wifi size={16} style={{ color: 'var(--accent)' }} />
                      Browser Print Dialog
                    </>
                  )}
                </span>
              </label>
              {silentPrintSupported && useSilentPrint && (
                <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--success)' }}>
                  <strong>Note:</strong> Requires backend running on the same PC as the printer. 
                  Prints directly without opening dialog.
                </p>
              )}
              {!silentPrintSupported && (
                <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--warning)' }}>
                  Silent print not available. Install pywin32 on backend server and connect a physical printer.
                </p>
              )}
            </div>

            {useSilentPrint && silentPrintSupported && (
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Select Printer</label>
                <select
                  className="form-input"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  disabled={printers.length === 0}
                >
                  {printers.map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.is_default && '(Default)'}
                    </option>
                  ))}
                </select>
                {printers.length === 0 && (
                  <p style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    No printers detected on server
                  </p>
                )}
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
              Select number of copies to print
            </p>
            <div className="copies-control">
              <button
                className="copies-btn"
                onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                disabled={printCopies <= 1}
                aria-label="Decrease copies"
              >
                <Minus size={20} />
              </button>
              <span className="copies-value">{printCopies}</span>
              <button
                className="copies-btn"
                onClick={() => setPrintCopies(Math.min(100, printCopies + 1))}
                disabled={printCopies >= 100}
                aria-label="Increase copies"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="print-modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowPrintModal(false)}
              >
                <X size={18} /> Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePrint}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="loading-spinner" /> : <> <Printer size={18} /> Print ({printCopies} copies) </>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App