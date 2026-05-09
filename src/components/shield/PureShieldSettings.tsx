import React, { useState } from 'react';
import { usePureShield } from '../../hooks/usePureShield';
import type { BlurGender, BlurStyle, InstalledApp } from '../../lib/capacitor/pureShieldPlugin';

// ─────────────────────────────────────────────────────────────────────────────
// PureShieldSettings — Main settings page for the Vision Blur feature
// Plugs into your existing Shield settings panel.
// ─────────────────────────────────────────────────────────────────────────────

export const PureShieldSettings: React.FC = () => {
  const {
    isRunning, isLoading, hasOverlayPerm,
    config, targetApps, installedApps,
    adaptiveStatus, error,
    toggle, updateConfig, toggleTargetApp, requestPermissions,
  } = usePureShield();

  const [appSearch, setAppSearch] = useState('');
  const [tab, setTab] = useState<'main' | 'apps' | 'advanced'>('main');

  const filteredApps = installedApps.filter(app =>
    app.appName.toLowerCase().includes(appSearch.toLowerCase()) ||
    app.packageName.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div style={styles.container}>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconWrap}>
            <span style={{ fontSize: 28 }}>🛡️</span>
          </div>
          <div>
            <h2 style={styles.title}>PureShield</h2>
            <p style={styles.subtitle}>Blur faces by gender in selected apps</p>
          </div>
        </div>

        {/* Master toggle */}
        <button
          onClick={toggle}
          disabled={isLoading}
          style={{
            ...styles.masterToggle,
            background: isRunning
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          }}
        >
          {isLoading ? '...' : isRunning ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* ── Permission warning ── */}
      {!hasOverlayPerm && (
        <div style={styles.warning}>
          <span>⚠️</span>
          <span style={{ flex: 1 }}>Overlay permission needed to draw blur over other apps</span>
          <button onClick={requestPermissions} style={styles.grantBtn}>Grant</button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={styles.errorBanner}>
          <span>❌ {error}</span>
        </div>
      )}

      {/* ── Status pill ── */}
      {isRunning && adaptiveStatus && (
        <div style={styles.statusRow}>
          <StatusPill label="Device" value={adaptiveStatus.deviceTier} color="#3b82f6" />
          <StatusPill label="Interval" value={`${adaptiveStatus.sampleIntervalMs}ms`} color="#8b5cf6" />
          <StatusPill label="Inference" value={`${adaptiveStatus.lastInferenceMs}ms`} color="#10b981" />
          <StatusPill label="Battery" value={`${adaptiveStatus.batteryLevel}%`}
            color={adaptiveStatus.batteryLevel < 20 ? '#ef4444' : '#10b981'} />
          <StatusPill label="Thermal" value={adaptiveStatus.thermalLabel}
            color={adaptiveStatus.thermalStatus > 1 ? '#f59e0b' : '#10b981'} />
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={styles.tabs}>
        {(['main', 'apps', 'advanced'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
            {t === 'main' ? '⚙️ Settings' : t === 'apps' ? '📱 Apps' : '🔬 Advanced'}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={styles.content}>

        {tab === 'main' && (
          <>
            {/* Gender selection */}
            <Section title="Filter Gender">
              <p style={styles.hint}>Choose which gender faces to blur</p>
              <div style={styles.genderGrid}>
                {(['FEMALE', 'MALE', 'BOTH'] as BlurGender[]).map(g => (
                  <GenderCard
                    key={g} gender={g}
                    selected={config.blurGender === g}
                    onSelect={() => updateConfig({ blurGender: g })}
                  />
                ))}
              </div>
            </Section>

            {/* Blur style */}
            <Section title="Blur Style">
              <div style={styles.styleGrid}>
                {([
                  { value: 'PIXELATE', label: 'Pixelate', icon: '▦', desc: 'Classic mosaic' },
                  { value: 'FROSTED',  label: 'Frosted',  icon: '❄️', desc: 'Frosted glass' },
                  { value: 'SOLID',    label: 'Solid',    icon: '■',  desc: 'Fast & simple' },
                ] as { value: BlurStyle; label: string; icon: string; desc: string }[]).map(s => (
                  <StyleCard
                    key={s.value}
                    {...s}
                    selected={config.blurStyle === s.value}
                    onSelect={() => updateConfig({ blurStyle: s.value })}
                  />
                ))}
              </div>
            </Section>

            {/* Quick toggles */}
            <Section title="Options">
              <ToggleRow
                label="Pause when battery < 20%"
                sublabel="Saves battery on low charge"
                value={config.pauseOnBatteryBelow20}
                onChange={v => updateConfig({ pauseOnBatteryBelow20: v })}
              />
            </Section>
          </>
        )}

        {tab === 'apps' && (
          <>
            <Section title={`Target Apps (${targetApps.length} selected)`}>
              <p style={styles.hint}>PureShield only activates when these apps are in foreground</p>
              <input
                placeholder="Search apps..."
                value={appSearch}
                onChange={e => setAppSearch(e.target.value)}
                style={styles.searchInput}
              />
              <div style={styles.appList}>
                {filteredApps.length === 0 && (
                  <p style={styles.emptyText}>No apps found</p>
                )}
                {filteredApps.map(app => (
                  <AppRow
                    key={app.packageName}
                    app={app}
                    selected={targetApps.includes(app.packageName)}
                    onToggle={() => toggleTargetApp(app.packageName)}
                  />
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === 'advanced' && (
          <>
            <Section title="Detection Sensitivity">
              <p style={styles.hint}>
                Confidence threshold: <strong>{Math.round(config.confidenceThreshold * 100)}%</strong>
              </p>
              <p style={{ ...styles.hint, color: '#94a3b8', marginTop: 4 }}>
                Higher = fewer false positives. Lower = catches more faces.
              </p>
              <input
                type="range"
                min={0.5} max={0.95} step={0.01}
                value={config.confidenceThreshold}
                onChange={e => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                style={styles.slider}
              />
              <div style={styles.sliderLabels}>
                <span>50% (sensitive)</span>
                <span>95% (strict)</span>
              </div>
            </Section>

            {adaptiveStatus && (
              <Section title="Performance Debug">
                <DebugRow label="Device Tier"    value={adaptiveStatus.deviceTier} />
                <DebugRow label="Sample Interval" value={`${adaptiveStatus.sampleIntervalMs}ms`} />
                <DebugRow label="Last Inference"  value={`${adaptiveStatus.lastInferenceMs}ms`} />
                <DebugRow label="Battery"         value={`${adaptiveStatus.batteryLevel}%`} />
                <DebugRow label="Thermal State"   value={adaptiveStatus.thermalLabel} />
              </Section>
            )}

            <Section title="How It Works">
              <div style={styles.infoCard}>
                <p style={styles.infoText}>
                  🔒 <strong>100% On-Device</strong> — No photos leave your phone. All processing
                  happens locally using TensorFlow Lite.
                </p>
                <p style={styles.infoText}>
                  ⚡ <strong>Adaptive Performance</strong> — Automatically adjusts processing speed
                  based on your device's thermal state and battery level.
                </p>
                <p style={styles.infoText}>
                  🧠 <strong>Models Used</strong> — BlazeFace (face detection, ~400KB) +
                  MobileNetV3-Small (gender classification, ~2MB).
                </p>
                <p style={styles.infoText}>
                  📸 <strong>Screen Capture</strong> — Uses Android MediaProjection to read screen
                  frames at 1–2 fps (much less than normal video).
                </p>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={styles.section}>
    <h3 style={styles.sectionTitle}>{title}</h3>
    {children}
  </div>
);

const GenderCard: React.FC<{
  gender: BlurGender; selected: boolean; onSelect: () => void;
}> = ({ gender, selected, onSelect }) => {
  const info = {
    FEMALE: { icon: '👩', label: 'Female', desc: 'Blur female faces' },
    MALE:   { icon: '👨', label: 'Male',   desc: 'Blur male faces' },
    BOTH:   { icon: '👥', label: 'Both',   desc: 'Blur all faces' },
  }[gender];

  return (
    <button onClick={onSelect} style={{
      ...styles.genderCard,
      borderColor: selected ? '#3b82f6' : '#1e293b',
      background:  selected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
    }}>
      <span style={{ fontSize: 28 }}>{info.icon}</span>
      <span style={styles.genderLabel}>{info.label}</span>
      <span style={styles.genderDesc}>{info.desc}</span>
      {selected && <div style={styles.selectedDot} />}
    </button>
  );
};

const StyleCard: React.FC<{
  value: BlurStyle; label: string; icon: string; desc: string;
  selected: boolean; onSelect: () => void;
}> = ({ label, icon, desc, selected, onSelect }) => (
  <button onClick={onSelect} style={{
    ...styles.styleCard,
    borderColor: selected ? '#8b5cf6' : '#1e293b',
    background:  selected ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
  }}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <span style={styles.styleLabel}>{label}</span>
    <span style={styles.styleDesc}>{desc}</span>
  </button>
);

const AppRow: React.FC<{
  app: InstalledApp; selected: boolean; onToggle: () => void;
}> = ({ app, selected, onToggle }) => (
  <div onClick={onToggle} style={{
    ...styles.appRow,
    background: selected ? 'rgba(59,130,246,0.08)' : 'transparent',
  }}>
    <div style={styles.appIcon}>
      {app.appName.charAt(0).toUpperCase()}
    </div>
    <div style={styles.appInfo}>
      <span style={styles.appName}>{app.appName}</span>
      <span style={styles.appPackage}>{app.packageName}</span>
    </div>
    <div style={{
      ...styles.checkbox,
      background:   selected ? '#3b82f6' : 'transparent',
      borderColor:  selected ? '#3b82f6' : '#334155',
    }}>
      {selected && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
    </div>
  </div>
);

const ToggleRow: React.FC<{
  label: string; sublabel: string; value: boolean; onChange: (v: boolean) => void;
}> = ({ label, sublabel, value, onChange }) => (
  <div style={styles.toggleRow}>
    <div>
      <p style={styles.toggleLabel}>{label}</p>
      <p style={styles.toggleSub}>{sublabel}</p>
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{
        ...styles.toggle,
        background: value ? '#3b82f6' : '#1e293b',
      }}
    >
      <div style={{
        ...styles.toggleThumb,
        transform: value ? 'translateX(20px)' : 'translateX(2px)',
      }} />
    </button>
  </div>
);

const StatusPill: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ ...styles.pill, borderColor: color + '44' }}>
    <span style={{ color: color, fontSize: 10, fontWeight: 600 }}>{label}</span>
    <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700 }}>{value}</span>
  </div>
);

const DebugRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={styles.debugRow}>
    <span style={styles.debugLabel}>{label}</span>
    <span style={styles.debugValue}>{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container:    { background: '#0f172a', minHeight: '100%', padding: '0 0 80px' },
  header:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 12px' },
  headerLeft:   { display: 'flex', alignItems: 'center', gap: 12 },
  iconWrap:     { width: 52, height: 52, borderRadius: 14, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:        { margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' },
  subtitle:     { margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 },
  masterToggle: { padding: '10px 20px', borderRadius: 12, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', minWidth: 72 },
  warning:      { margin: '0 16px 8px', padding: '10px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fbbf24' },
  grantBtn:     { padding: '4px 10px', borderRadius: 6, background: '#fbbf24', color: '#1e1e1e', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' },
  errorBanner:  { margin: '0 16px 8px', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 12, color: '#ef4444' },
  statusRow:    { display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' },
  pill:         { display: 'flex', flexDirection: 'column', gap: 1, padding: '5px 8px', borderRadius: 8, border: '1px solid', background: 'rgba(255,255,255,0.03)', minWidth: 64 },
  tabs:         { display: 'flex', borderBottom: '1px solid #1e293b', margin: '0 16px' },
  tab:          { flex: 1, padding: '10px 4px', background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  tabActive:    { color: '#3b82f6', borderBottom: '2px solid #3b82f6' },
  content:      { padding: '16px' },
  section:      { marginBottom: 24 },
  sectionTitle: { margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  hint:         { margin: '0 0 12px', fontSize: 13, color: '#64748b' },
  genderGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 },
  genderCard:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 8px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', position: 'relative', transition: 'all 0.15s' },
  genderLabel:  { fontSize: 13, fontWeight: 700, color: '#e2e8f0' },
  genderDesc:   { fontSize: 10, color: '#64748b', textAlign: 'center' },
  selectedDot:  { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' },
  styleGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 },
  styleCard:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 8px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s' },
  styleLabel:   { fontSize: 13, fontWeight: 700, color: '#e2e8f0' },
  styleDesc:    { fontSize: 10, color: '#64748b', textAlign: 'center' },
  searchInput:  { width: '100%', padding: '10px 12px', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box', outline: 'none' },
  appList:      { maxHeight: 420, overflowY: 'auto' },
  appRow:       { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.1s' },
  appIcon:      { width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  appInfo:      { flex: 1, minWidth: 0 },
  appName:      { display: 'block', fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  appPackage:   { display: 'block', fontSize: 11, color: '#475569', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  checkbox:     { width: 22, height: 22, borderRadius: 6, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' },
  toggleRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' },
  toggleLabel:  { margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 500 },
  toggleSub:    { margin: '2px 0 0', fontSize: 11, color: '#475569' },
  toggle:       { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb:  { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s' },
  slider:       { width: '100%', accentColor: '#8b5cf6', margin: '8px 0' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' },
  infoCard:     { background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, border: '1px solid #1e293b' },
  infoText:     { margin: '0 0 10px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  emptyText:    { textAlign: 'center', color: '#475569', fontSize: 13, padding: '20px 0' },
  debugRow:     { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1e293b' },
  debugLabel:   { fontSize: 12, color: '#64748b' },
  debugValue:   { fontSize: 12, color: '#e2e8f0', fontWeight: 600 },
};

export default PureShieldSettings;
