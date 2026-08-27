import ExcelJS from 'exceljs'
import logoBase64 from '../../assets/logo.png?base64'

const BRAND_BLUE = '1F5DA3'
const BRAND_BLUE_LIGHT = 'DCE8F5'
const ROW_ALT = 'F2F6FA'
const HEADER_FILL = BRAND_BLUE_LIGHT
const BORDER_STYLE = { style: 'thin', color: { argb: 'B8C6D8' } }
const BORDER = {
  top: BORDER_STYLE,
  left: BORDER_STYLE,
  bottom: BORDER_STYLE,
  right: BORDER_STYLE,
}

const pad = (value) => String(value).padStart(2, '0')

const formatExportTimestamp = (date) => {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}${month}${day}_${hours}${minutes}`
}

const COLUMNS = [
  { key: 'reportId', label: 'Report ID', width: 18 },
  { key: 'issue', label: 'Issue', width: 42 },
  { key: 'category', label: 'Category', width: 18 },
  { key: 'status', label: 'Status', width: 16 },
  { key: 'reporterName', label: 'Reporter', width: 24 },
  { key: 'userId', label: 'User ID', width: 14 },
  { key: 'address', label: 'Address', width: 26 },
  { key: 'location', label: 'Location', width: 30 },
  { key: 'locationDetails', label: 'Location Details', width: 30 },
  { key: 'gpsLocation', label: 'GPS Location', width: 32 },
  { key: 'waterMeter', label: 'Water Meter', width: 14 },
  { key: 'attachments', label: 'Attachments', width: 12 },
  { key: 'submittedAt', label: 'Date & Time', width: 22 },
]

const createHeaderCell = (cell) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: HEADER_FILL },
  }
  cell.font = { bold: true, color: { argb: BRAND_BLUE } }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border = BORDER
}

const createBodyCell = (cell, index) => {
  cell.font = { size: 10 }
  cell.alignment = { vertical: 'top', wrapText: true }
  cell.border = BORDER
  if (index % 2 === 1) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: ROW_ALT },
    }
  }
}

export const downloadReportXlsx = async (reports) => {
  if (!reports.length) {
    return { exported: 0 }
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'PureDrop Admin'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Reports', {
    views: [{ state: 'frozen', ySplit: 4 }],
  })

  sheet.columns = COLUMNS.map((column) => ({
    header: column.label,
    key: column.key,
    width: column.width,
  }))

  const lastColumnLetter = sheet.getColumn(COLUMNS.length).letter

  // Row 1: Logo + title + generated timestamp.
  const titleRow = sheet.getRow(1)
  titleRow.height = 60
  sheet.mergeCells(`A1:${lastColumnLetter}1`)
  const titleCell = titleRow.getCell(1)
  titleCell.value = 'PureDrop Reports'
  titleCell.font = { bold: true, size: 20, color: { argb: BRAND_BLUE } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

  const generatedCell = titleRow.getCell(COLUMNS.length)
  generatedCell.value = `Generated: ${formatExportTimestamp(new Date())}`
  generatedCell.font = { size: 10, color: { argb: '6B7280' } }
  generatedCell.alignment = { vertical: 'middle', horizontal: 'right' }

  // Add the logo image to the top-left of the title row.
  try {
    const rawBase64 = String(logoBase64 || '').replace(/^data:[^;]+;base64,/, '')
    if (rawBase64) {
      const logoId = workbook.addImage({ base64: rawBase64, extension: 'png' })
      sheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 50, height: 50 } })
    }
  } catch (error) {
    console.warn('Failed to embed logo in Excel export:', error)
  }

  // Row 2: Brand divider line.
  const dividerRow = sheet.getRow(2)
  dividerRow.height = 4
  sheet.mergeCells(`A2:${lastColumnLetter}2`)
  const dividerCell = dividerRow.getCell(1)
  dividerCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  }

  // Row 3: Blank spacer.
  const spacerRow = sheet.getRow(3)
  spacerRow.height = 8

  // Row 4: Column headers.
  const headerRow = sheet.getRow(4)
  headerRow.height = 24
  headerRow.eachCell((cell) => createHeaderCell(cell))

  // Add data rows with alternating fill + borders.
  reports.forEach((report, index) => {
    const row = sheet.addRow({
      reportId: report.reportId ? `REP-${report.reportId}` : 'N/A',
      issue: report.issue || 'N/A',
      category: report.category || 'N/A',
      status: report.status || 'N/A',
      reporterName: report.reporterName || 'N/A',
      userId: report.userId || 'N/A',
      address: report.address || 'N/A',
      location: report.location || 'N/A',
      locationDetails: report.locationDetails || 'N/A',
      gpsLocation: report.gpsLocation || 'N/A',
      waterMeter: report.waterMeter || 'N/A',
      attachments: report.attachments?.length || 0,
      submittedAt: report.submittedAt || 'N/A',
    })
    row.eachCell((cell) => createBodyCell(cell, index))
  })

  // Force a data write so column widths are honored in Excel.
  const buffer = await workbook.xlsx.writeBuffer()

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `puredrop-reports-${formatExportTimestamp(new Date())}.xlsx`
  link.click()
  URL.revokeObjectURL(link.href)

  return { exported: reports.length }
}