/**
 * Solar Fusion Card v2
 * Lovelace Custom Card for the Solar Fusion integration.
 *
 * Installation:
 *   1. Copy solar-fusion-card.js and the locales/ folder to /config/www/
 *   2. Settings → Dashboards → Resources:
 *      URL: /local/solar-fusion-card.js   Type: JavaScript module
 *
 * Card YAML – only one entity required:
 *   type: custom:solar-fusion-card
 *   entity: sensor.solar_fusion_dach_fused_today
 *   title: Solar Fusion Roof   # optional
 */

const QUALITY_COLORS = {
  "Exzellent": "#4ade80", "Excellent": "#4ade80",
  "Gut":       "#86efac", "Good":      "#86efac",
  "Mittel":    "#facc15", "Fair":      "#facc15",
  "Schlecht":  "#f87171", "Poor":      "#f87171",
};

const SOURCE_SHORT = {
  "Forecast.Solar":            "Forecast.Solar",
  "Open-Meteo Solar Forecast": "Open-Meteo",
  "Solcast PV Forecast":       "Solcast",
};

// Maps source display name → entity ID suffix for quality sensors
const SOURCE_ENTITY_SUFFIX = {
  "Forecast.Solar":            "forecast_solar_rmse",
  "Open-Meteo Solar Forecast": "open_meteo_solar_forecast_rmse",
  "Solcast PV Forecast":       "solcast_pv_forecast_rmse",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

  :host {
    --sf-bg:      #0f1117;
    --sf-surface: #181c27;
    --sf-border:  #252a38;
    --sf-accent:  #f59e0b;
    --sf-accent2: #38bdf8;
    --sf-text:    #e2e8f0;
    --sf-muted:   #64748b;
    --sf-radius:  12px;
    --sf-font:    'Syne', sans-serif;
    --sf-mono:    'DM Mono', monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .card {
    background: var(--sf-bg);
    border: 1px solid var(--sf-border);
    border-radius: var(--sf-radius);
    padding: 20px;
    font-family: var(--sf-font);
    color: var(--sf-text);
    overflow: hidden;
    position: relative;
  }
  .card::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Clickable base style */
  [data-entity] {
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  [data-entity]:hover { opacity: 0.75; }
  [data-entity]:active { opacity: 0.5; }

  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 20px;
  }
  .title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sf-muted); }
  .updated { font-family: var(--sf-mono); font-size: 10px; color: var(--sf-muted); text-align: right; }

  /* Hero */
  .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .hero-card {
    background: var(--sf-surface); border: 1px solid var(--sf-border);
    border-radius: 10px; padding: 14px 16px; position: relative; overflow: hidden;
  }
  .hero-card:hover { border-color: #3a4255; }
  .hero-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
  .hero-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sf-muted); margin-bottom: 6px; }
  .hero-value { font-size: 28px; font-weight: 800; line-height: 1; }
  .hero-unit { font-size: 13px; font-weight: 400; color: var(--sf-muted); margin-left: 3px; }
  .hero-unc { font-family: var(--sf-mono); font-size: 10px; color: var(--sf-muted); margin-top: 6px; }

  /* Section */
  .section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--sf-muted); margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--sf-border);
  }

  /* Sources */
  .sources { margin-bottom: 20px; }
  .source-row {
    display: grid; grid-template-columns: 100px 1fr 70px 68px;
    align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1e2330;
    border-radius: 4px;
  }
  .source-row:last-child { border-bottom: none; }
  .source-name { font-size: 12px; font-weight: 600; }
  .bar-wrap { height: 6px; background: var(--sf-border); border-radius: 3px; overflow: hidden; }
  .bar { height: 100%; border-radius: 3px; background: var(--sf-accent); transition: width 0.7s cubic-bezier(.4,0,.2,1); }
  .source-kwh { font-family: var(--sf-mono); font-size: 11px; text-align: right; }
  .source-weight { font-family: var(--sf-mono); font-size: 10px; color: var(--sf-muted); text-align: right; }

  /* Quality table */
  .q-section { margin-bottom: 20px; }
  .q-header, .q-row {
    display: grid; grid-template-columns: 100px 68px 52px 52px 1fr;
    align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #1e2330;
    border-radius: 4px;
  }
  .q-row:last-child { border-bottom: none; }
  .q-header { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--sf-muted); padding-bottom: 4px; }
  .q-name { font-size: 12px; font-weight: 600; }
  .q-val { font-family: var(--sf-mono); font-size: 11px; }
  .q-days { font-family: var(--sf-mono); font-size: 10px; color: var(--sf-muted); }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-family: var(--sf-font); }

  /* Sparkline */
  .spark-wrap {
    background: var(--sf-surface); border: 1px solid var(--sf-border);
    border-radius: 10px; padding: 14px;
  }
  .spark-wrap svg { width: 100%; height: 60px; display: block; }
  .legend { display: flex; gap: 20px; margin-top: 12px; align-items: center; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--sf-muted); font-family: var(--sf-mono); white-space: nowrap; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
`;

class SolarFusionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._prefix = "";
    this._locale = {};
    this._localeLang = null;
  }

  // Load locale JSON from locales/<lang>.json next to the card file.
  // Falls back to English if the requested language is unavailable.
  async _loadLocale(lang) {
    const base = new URL(".", import.meta.url).href;
    for (const l of [lang.split("-")[0], "en"]) {
      try {
        const res = await fetch(`${base}locales/${l}.json`);
        if (res.ok) return await res.json();
      } catch (_) { /* try next */ }
    }
    return {};
  }

  // Returns a translated string, falling back to the key itself.
  _t(key) {
    return this._locale[key] ?? key;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("'entity' is required");
    this._config = config;
    // Derive prefix: "sensor.solar_fusion_dach_fused_today" → "sensor.solar_fusion_dach"
    this._prefix = config.entity.replace(/_fused_today$/, "");
    this._render();
  }

  set hass(hass) {
    const lang = hass.language || "en";
    this._hass = hass;

    if (lang !== this._localeLang) {
      this._localeLang = lang;
      this._loadLocale(lang).then(locale => {
        this._locale = locale;
        this._render();
      });
    } else {
      this._render();
    }
  }

  // Fire HA more-info dialog for the given entity_id
  _moreInfo(entityId) {
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }

  // Attach click listeners to all [data-entity] elements after render
  _attachListeners() {
    this.shadowRoot.querySelectorAll("[data-entity]").forEach(el => {
      el.addEventListener("click", () => this._moreInfo(el.dataset.entity));
    });
  }

  _qualityEntity(sourceName) {
    const suffix = SOURCE_ENTITY_SUFFIX[sourceName];
    return suffix ? `${this._prefix}_${suffix}` : null;
  }

  _fmt(v, decimals = 2) {
    if (v === null || v === undefined) return "—";
    return Number(v).toFixed(decimals);
  }

  _sparkline(history) {
    const byDate = {};
    for (const r of history) {
      if (!byDate[r.date]) byDate[r.date] = { forecasts: [], actual: r.actual_kwh };
      byDate[r.date].forecasts.push(r.forecast_kwh);
    }
    const points = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([, v]) => ({
        forecast: v.forecasts.reduce((a, b) => a + b, 0) / (v.forecasts.length || 1),
        actual: v.actual,
      }));

    if (points.length < 2) {
      return `<text x="50%" y="50%" text-anchor="middle" fill="#64748b"
        font-size="11" font-family="DM Mono,monospace">${this._t("no_history")}</text>`;
    }

    const W = 400, H = 60, P = 8;
    const maxV = Math.max(...points.map(p => Math.max(p.forecast, p.actual)), 0.1);
    const sx = i => P + (i / (points.length - 1)) * (W - P * 2);
    const sy = v => H - P - (v / maxV) * (H - P * 2);
    const fPath = points.map((p, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(p.forecast).toFixed(1)}`).join(" ");
    const aPath = points.map((p, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(p.actual).toFixed(1)}`).join(" ");
    const dots  = points.map((p, i) =>
      `<circle cx="${sx(i).toFixed(1)}" cy="${sy(p.actual).toFixed(1)}" r="2.5" fill="#4ade80"/>`
    ).join("");
    return `
      <path d="${fPath}" stroke="#f59e0b" stroke-width="1.5" fill="none" stroke-dasharray="4 2" opacity="0.7"/>
      <path d="${aPath}" stroke="#4ade80" stroke-width="2" fill="none"/>
      ${dots}`;
  }

  _render() {
    if (!this._config || !this._hass) return;

    const entityId   = this._config.entity;
    const tomorrowId = `${this._prefix}_fused_tomorrow`;
    const snapshotId = `${this._prefix}_morning_snapshot`;

    const mainState = this._hass.states[entityId];
    if (!mainState) {
      this.shadowRoot.innerHTML = `<style>${STYLES}</style>
        <div class="card"><div style="color:#64748b;padding:20px;text-align:center">
          ${this._t("entity_not_found")} ${entityId}</div></div>`;
      return;
    }

    const attrs       = mainState.attributes;
    const todayKwh    = parseFloat(mainState.state) || 0;
    const tomorrowKwh = attrs.fused_tomorrow_kwh;
    const uncertainty = attrs.uncertainty_pct;
    const sources     = attrs.sources || {};
    const history     = attrs.history || [];
    const title       = this._config.title || this._t("default_title");
    const lang        = this._hass.language || "en";

    let updatedStr = "—";
    try {
      if (attrs.last_updated)
        updatedStr = new Date(attrs.last_updated)
          .toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
    } catch (_) {}

    const sourceList = Object.entries(sources); // [[id, data], ...]
    const maxKwh = Math.max(...sourceList.map(([, s]) => s.today_kwh || 0), 0.1);

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="card">

        <div class="header">
          <div class="title">${title}</div>
          <div class="updated">${this._t("updated")}<br>${updatedStr}${this._t("time_suffix")}</div>
        </div>

        <!-- Hero: today + tomorrow -->
        <div class="hero">
          <div class="hero-card" data-entity="${entityId}">
            <div class="hero-bar" style="background:var(--sf-accent)"></div>
            <div class="hero-label">${this._t("today")}</div>
            <div class="hero-value">${this._fmt(todayKwh, 1)}<span class="hero-unit">kWh</span></div>
            ${uncertainty != null
              ? `<div class="hero-unc">±${this._fmt(uncertainty, 1)} ${this._t("uncertainty")}</div>`
              : ""}
          </div>
          <div class="hero-card" data-entity="${tomorrowId}">
            <div class="hero-bar" style="background:var(--sf-accent2)"></div>
            <div class="hero-label">${this._t("tomorrow")}</div>
            <div class="hero-value">${this._fmt(tomorrowKwh, 1)}<span class="hero-unit">kWh</span></div>
          </div>
        </div>

        <!-- Source bars -->
        ${sourceList.length ? `
        <div class="sources">
          <div class="section-title">${this._t("sources_today")}</div>
          ${sourceList.map(([, s]) => {
            const qEntity = this._qualityEntity(s.name);
            return `
            <div class="source-row"${qEntity ? ` data-entity="${qEntity}"` : ""}>
              <div class="source-name">${SOURCE_SHORT[s.name] || s.name}</div>
              <div class="bar-wrap">
                <div class="bar" style="width:${((s.today_kwh || 0) / maxKwh * 100).toFixed(1)}%"></div>
              </div>
              <div class="source-kwh">${this._fmt(s.today_kwh, 2)} kWh</div>
              <div class="source-weight">${s.weight != null ? this._t("weight") + " " + this._fmt(s.weight * 100, 0) + " %" : "—"}</div>
            </div>`;
          }).join("")}
        </div>` : ""}

        <!-- Quality table -->
        ${sourceList.length ? `
        <div class="q-section">
          <div class="section-title">${this._t("quality_accuracy")}</div>
          <div class="q-header">
            <span>${this._t("col_source")}</span><span>${this._t("col_label")}</span><span>${this._t("col_rmse")}</span><span>${this._t("col_bias")}</span><span>${this._t("col_days")}</span>
          </div>
          ${sourceList.map(([, s]) => {
            const color   = QUALITY_COLORS[s.quality_label] || "#94a3b8";
            const bias    = s.bias_kwh != null
              ? (s.bias_kwh > 0 ? "+" : "") + this._fmt(s.bias_kwh, 2) : "—";
            const qEntity = this._qualityEntity(s.name);
            return `
            <div class="q-row"${qEntity ? ` data-entity="${qEntity}"` : ""}>
              <span class="q-name">${SOURCE_SHORT[s.name] || s.name}</span>
              <span>${s.quality_label
                ? `<span class="badge" style="background:${color}22;color:${color}">${s.quality_label}</span>`
                : "—"}</span>
              <span class="q-val">${this._fmt(s.rmse_kwh, 2)}</span>
              <span class="q-val">${bias}</span>
              <span class="q-days">${s.days_evaluated ?? "—"} ${this._t("days_short")}</span>
            </div>`;
          }).join("")}
        </div>` : ""}

        <!-- Sparkline / history -->
        <div>
          <div class="section-title">${this._t("history_title")}</div>
          <div class="spark-wrap" data-entity="${snapshotId}">
            <svg viewBox="0 0 400 60" preserveAspectRatio="none">
              ${this._sparkline(history)}
            </svg>
            <div class="legend">
              <div class="legend-item">
                <div class="legend-dot" style="background:#4ade80"></div>${this._t("legend_actual")}
              </div>
              <div class="legend-item">
                <svg width="16" height="8">
                  <line x1="0" y1="4" x2="16" y2="4" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 2"/>
                </svg>
                ${this._t("legend_forecast")}
              </div>
            </div>
          </div>
        </div>

      </div>`;

    this._attachListeners();
  }

  static getStubConfig() {
    return { entity: "sensor.solar_fusion_dach_fused_today" };
  }
}

customElements.define("solar-fusion-card", SolarFusionCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "solar-fusion-card",
  name: "Solar Fusion Card",
  description: "Fused PV forecast with source comparison, quality metrics, and history.",
});
