const TILE_SIZE = 256
const DEFAULT_ZOOM = 16
const MAP_TILE_RADIUS = 1
const MAPTILER_API_KEY = String(import.meta.env.VITE_MAPTILER_API_KEY || '').trim()

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const longitudeToTileX = (longitude, zoom) => ((longitude + 180) / 360) * 2 ** zoom

const latitudeToTileY = (latitude, zoom) => {
  const safeLatitude = clamp(latitude, -85.05112878, 85.05112878)
  const radians = (safeLatitude * Math.PI) / 180

  return ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * 2 ** zoom
}

const parseGpsCoordinates = (gpsLocation) => {
  const rawValue = String(gpsLocation || '').trim()
  if (!rawValue || rawValue.toLowerCase() === 'n/a') {
    return null
  }

  const match = rawValue.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
  if (!match) {
    return null
  }

  const latitude = Number(match[1])
  const longitude = Number(match[2])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null
  }

  return { latitude, longitude }
}

const buildTiles = ({ latitude, longitude }) => {
  const centerTileX = longitudeToTileX(longitude, DEFAULT_ZOOM)
  const centerTileY = latitudeToTileY(latitude, DEFAULT_ZOOM)
  const baseTileX = Math.floor(centerTileX)
  const baseTileY = Math.floor(centerTileY)
  const offsetX = (centerTileX - baseTileX) * TILE_SIZE
  const offsetY = (centerTileY - baseTileY) * TILE_SIZE
  const worldTiles = 2 ** DEFAULT_ZOOM
  const tiles = []

  for (let xOffset = -MAP_TILE_RADIUS; xOffset <= MAP_TILE_RADIUS; xOffset += 1) {
    for (let yOffset = -MAP_TILE_RADIUS; yOffset <= MAP_TILE_RADIUS; yOffset += 1) {
      const tileX = baseTileX + xOffset
      const tileY = baseTileY + yOffset

      if (tileY < 0 || tileY >= worldTiles) {
        continue
      }

      const wrappedTileX = ((tileX % worldTiles) + worldTiles) % worldTiles
      tiles.push({
        key: `${DEFAULT_ZOOM}-${tileX}-${tileY}`,
        left: `calc(50% + ${(xOffset * TILE_SIZE - offsetX).toFixed(2)}px)`,
        top: `calc(50% + ${(yOffset * TILE_SIZE - offsetY).toFixed(2)}px)`,
        uri: `https://api.maptiler.com/tiles/satellite-v2/${DEFAULT_ZOOM}/${wrappedTileX}/${tileY}.jpg?key=${encodeURIComponent(MAPTILER_API_KEY)}`,
      })
    }
  }

  return tiles
}

function AdminReportGpsMap({ gpsLocation }) {
  const coordinate = parseGpsCoordinates(gpsLocation)

  if (!coordinate) {
    return <p className="admin-report-map-fallback mb-0">No GPS coordinates available.</p>
  }

  if (!MAPTILER_API_KEY) {
    return <p className="admin-report-map-fallback mb-0">Map unavailable: missing MapTiler key.</p>
  }

  const tiles = buildTiles(coordinate)
  const coordinateLabel = `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`

  return (
    <div className="admin-report-map" aria-label={`GPS map centered at ${coordinateLabel}`} role="img">
      <div className="admin-report-map-tiles" aria-hidden="true">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            alt=""
            className="admin-report-map-tile"
            src={tile.uri}
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
      </div>
      <div className="admin-report-map-pin" aria-hidden="true" />
      <div className="admin-report-map-label">{coordinateLabel}</div>
      <div className="admin-report-map-attribution">MapTiler</div>
    </div>
  )
}

export default AdminReportGpsMap
