const REPORT_EMAIL_TYPES = [
  { key: 'noWater', label: 'No Water' },
  { key: 'dirtyWater', label: 'Dirty Water' },
  { key: 'waterLeaking', label: 'Water Leaking' },
  { key: 'infrastructure', label: 'Infrastructure' },
]

function NotificationsCard({
  notifications,
  fieldErrors = {},
  onToggleReportEmailType,
  onSystemHealthAlertsChange,
  onWeeklySummaryEmailChange,
}) {
  return (
    <section className="admin-settings-card">
      <h2 className="admin-settings-card-title">Notifications</h2>
      <div className="admin-settings-form-grid admin-settings-grid-3">
        <div>
          <p className="form-label mb-2">Email Notifications for New Reports</p>
          <div className="admin-settings-checkbox-grid">
            {REPORT_EMAIL_TYPES.map((item) => (
              <label key={item.key} className="admin-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notifications.reportEmailTypes[item.key]}
                  onChange={() => onToggleReportEmailType(item.key)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="form-label mb-2">System Health Alerts</p>
          <div className="admin-settings-inline-options">
            <label className="admin-settings-checkbox">
              <input
                type="radio"
                name="systemHealthAlerts"
                checked={notifications.systemHealthAlerts === 'enable'}
                onChange={() => onSystemHealthAlertsChange('enable')}
              />
              <span>Enable</span>
            </label>
            <label className="admin-settings-checkbox">
              <input
                type="radio"
                name="systemHealthAlerts"
                checked={notifications.systemHealthAlerts === 'disable'}
                onChange={() => onSystemHealthAlertsChange('disable')}
              />
              <span>Disable</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="weeklySummaryEmail" className="form-label">
            Weekly Summary Report Email
          </label>
          <input
            id="weeklySummaryEmail"
            className={`form-control${fieldErrors.weeklySummaryEmail ? ' is-invalid' : ''}`}
            value={notifications.weeklySummaryEmail}
            onChange={(event) => onWeeklySummaryEmailChange(event.target.value)}
          />
          {fieldErrors.weeklySummaryEmail && <div className="invalid-feedback d-block">{fieldErrors.weeklySummaryEmail}</div>}
        </div>
      </div>
    </section>
  )
}

export default NotificationsCard
