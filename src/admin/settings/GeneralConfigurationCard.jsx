function GeneralConfigurationCard({ general, fieldErrors = {}, onChange }) {
  return (
    <section className="admin-settings-card">
      <h2 className="admin-settings-card-title">General Configuration</h2>
      <div className="admin-settings-form-grid admin-settings-grid-3">
        <div>
          <label htmlFor="adminFullName" className="form-label">
            Full Name
          </label>
          <input
            id="adminFullName"
            className={`form-control${fieldErrors.fullName ? ' is-invalid' : ''}`}
            value={general.fullName}
            onChange={(event) => onChange('fullName', event.target.value)}
            placeholder="Enter admin full name"
          />
          {fieldErrors.fullName && <div className="invalid-feedback d-block">{fieldErrors.fullName}</div>}
        </div>
        <div>
          <label htmlFor="adminEmail" className="form-label">
            Email Address
          </label>
          <input
            id="adminEmail"
            type="email"
            className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`}
            value={general.email}
            readOnly
          />
          <small className="text-muted">Email is tied to your admin account.</small>
          {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
        </div>
        <div>
          <label htmlFor="adminAddress" className="form-label">
            Address
          </label>
          <input
            id="adminAddress"
            className={`form-control${fieldErrors.address ? ' is-invalid' : ''}`}
            value={general.address}
            onChange={(event) => onChange('address', event.target.value)}
            placeholder="Enter admin address"
          />
          {fieldErrors.address && <div className="invalid-feedback d-block">{fieldErrors.address}</div>}
        </div>
      </div>
    </section>
  )
}

export default GeneralConfigurationCard
