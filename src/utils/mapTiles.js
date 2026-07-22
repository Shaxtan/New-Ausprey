/**
 * mapTiles.js — shared tile-layer config for every Leaflet map in the app.
 *
 * Three modes available everywhere a map is used: Standard, Satellite, Dark.
 * "Standard" still respects VITE_MAP_TILE_URL so existing branding/config
 * is unaffected; Satellite and Dark use free, no-API-key tile providers
 * (Esri World Imagery, CARTO Dark Matter).
 */

export const MAP_MODES = {
  standard: {
    label: "Standard",
    url:
      import.meta.env.VITE_MAP_TILE_URL ||
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
};

export const MAP_MODE_ORDER = ["standard", "satellite", "dark"];

export const DEFAULT_MAP_MODE = "standard";
