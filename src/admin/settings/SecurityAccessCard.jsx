function SecurityAccessCard({ security, onChange }) {
  return (
    <section className="admin-settings-card">
      <h2 className="admin-settings-card-title">Security and Access</h2>
      <div className="admin-settings-form-grid admin-settings-grid-3">
        <div>
          <label htmlFor="lockoutMinutes" className="form-label">
            Admin Account Lockout (minutes)
          </label>
          <input
            id="lockoutMinutes"
            type="number"
            min={1}
            max={120}
            className="form-control"
            value={security.lockoutMinutes}
            onChange={(event) => onChange('lockoutMinutes', Number(event.target.value))}
          />
        </div>
        <div>
          <p className="form-label mb-2">Enable Two-Factor Authentication</p>
          <label className="admin-settings-switch">
            <input
              type="checkbox"
              checked={security.twoFactorEnabled}
              onChange={(event) => onChange('twoFactorEnabled', event.target.checked)}
            />
            <span>{security.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        <div>
          <label htmlFor="maxLoginAttempts" className="form-label">
            Max Login Attempts
          </label>
          <input
            id="maxLoginAttempts"
            type="number"
            min={1}
            max={15}
            className="form-control"
            value={security.maxLoginAttempts}
            onChange={(event) => onChange('maxLoginAttempts', Number(event.target.value))}
          />
        </div>
      </div>
    </section>
  )
}

export default SecurityAccessCard
