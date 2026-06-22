function GeneralConfigurationCard({ general, onChange }) {
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
            className="form-control"
            value={general.fullName}
            onChange={(event) => onChange('fullName', event.target.value)}
            placeholder="Enter admin full name"
          />
        </div>
        <div>
          <label htmlFor="adminEmail" className="form-label">
            Email Address
          </label>
          <input
            id="adminEmail"
            type="email"
            className="form-control"
            value={general.email}
            readOnly
          />
        </div>
        <div>
          <label htmlFor="adminAddress" className="form-label">
            Address
          </label>
          <input
            id="adminAddress"
            className="form-control"
            value={general.address}
            onChange={(event) => onChange('address', event.target.value)}
            placeholder="Enter admin address"
          />
        </div>
      </div>
    </section>
  )
}

export default GeneralConfigurationCard
