import React, { useState } from 'react';

export function TelemetryLog({ logs }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`telemetry-log-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="log-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="log-title-area">
          <span className="live-dot" />
          <span className="log-title">MISSION CONTROL EVENT LOG</span>
          <span className="log-count">({logs.length} entries)</span>
        </div>
        <button type="button" className="collapse-btn">
          {collapsed ? '▲ Expand' : '▼ Minimize'}
        </button>
      </div>

      {!collapsed && (
        <div className="log-scroll-area">
          {logs.map((log) => (
            <div key={log.id} className={`log-entry ${log.type || 'info'}`}>
              <span className="log-timestamp">SOL {log.sol} [{log.hour}]</span>
              <span className="log-text">{log.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
