import { useEffect, useMemo, useState } from 'react'

const CITY_SUFFIX = ', Balamban, Cebu'

const BARANGAYS = [
  'Abucayan',
  'Aliwanay',
  'Arpili',
  'Baliwagan',
  'Bayong',
  'Biasong',
  'Buanoy',
  'Cabagdalan',
  'Cabasiangan',
  'Cambuhawe',
  'Cansomoroy',
  'Cantibas',
  'Cantuod',
  'Duangan',
  'Gaas',
  'Ginatilan',
  'Hingatmonan',
  'Lamesa',
  'Liki',
  'Luca',
  'Matun-og',
  'Nangka',
  'Pondol',
  'Prenza',
  'Singsing',
  'Sung-an',
  'Sunog',
  'Vito',
]

const normalizeAddress = (value) => {
  const trimmed = String(value || '').trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.toLowerCase().endsWith(CITY_SUFFIX.toLowerCase())) {
    return trimmed
  }

  if (trimmed.toLowerCase().endsWith(', balamban')) {
    return trimmed
  }

  return `${trimmed}${CITY_SUFFIX}`
}

function AddressSelectBlbn({ id, value, onChange, onBlur, hasError, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filteredBarangays = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return BARANGAYS
    }

    return BARANGAYS.filter((item) => item.toLowerCase().includes(normalized))
  }, [query])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const selectBarangay = (barangay) => {
    onChange(normalizeAddress(barangay))
    setIsOpen(false)
    setQuery('')
    if (onBlur) {
      onBlur()
    }
  }

  const cancelSelection = () => {
    setIsOpen(false)
    setQuery('')
    if (onBlur) {
      onBlur()
    }
  }

  return (
    <>
      <input
        id={id}
        className={hasError ? 'form-control is-invalid' : 'form-control'}
        value={value}
        readOnly
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        aria-describedby={hasError ? `${id}-error` : undefined}
        required
      />

      {isOpen && (
        <div className="admin-users-address-layer" role="presentation">
          <button
            type="button"
            className="admin-users-address-backdrop"
            aria-label="Close barangay selector"
            onClick={cancelSelection}
          />
          <div
            className="admin-users-address-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Select barangay"
          >
            <div className="admin-users-address-sheet-head">
              <h3 className="admin-users-address-sheet-title">Select Barangay</h3>
              <p className="admin-users-address-sheet-subtitle mb-0">Balamban only</p>
            </div>

            <input
              type="text"
              className="admin-users-address-search"
              placeholder="Search barangay"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />

            <div className="admin-users-address-list">
              {filteredBarangays.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="admin-users-address-item"
                  onClick={() => selectBarangay(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="admin-users-address-cancel"
              onClick={cancelSelection}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default AddressSelectBlbn
