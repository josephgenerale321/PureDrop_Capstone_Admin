const escapeCsv = (value) => {
  const stringValue = String(value ?? '')
  return `"${stringValue.replace(/"/g, '""')}"`
}

export const downloadReportCsv = (reports) => {
  if (!reports.length) {
    return
  }

  const headers = ['Report ID', 'Issue', 'Category', 'Status', 'Reporter', 'User ID', 'Date Submitted', 'Location', 'Water Meter']
  const rows = reports.map((report) => [
    report.reportId,
    report.issue,
    report.category,
    report.status,
    report.reporterName,
    report.userId,
    report.submittedAt,
    report.location,
    report.waterMeter,
  ])
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `puredrop-reports-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
