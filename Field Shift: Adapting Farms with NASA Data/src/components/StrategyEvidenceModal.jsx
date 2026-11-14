import React from 'react';

export function StrategyEvidenceModal({ strategy, onClose, onOpenGlossary }) {
  if (!strategy) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-badge">
            <span className="nasa-pill">NASA EO DECISION SUPPORT</span>
            <h3>{strategy.title}</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Executive Overview */}
          <div className="evidence-overview-box">
            <div className="overview-metric">
              <span className="lbl">Composite Priority Match</span>
              <span className="val">{strategy.compositeScore}/100</span>
            </div>
            <div className="overview-metric">
              <span className="lbl">Water Footprint</span>
              <span className="val">{strategy.waterUseMm} mm</span>
            </div>
            <div className="overview-metric">
              <span className="lbl">Bio-Nitrogen Fixation</span>
              <span className="val">+{strategy.nitrogenFixKgHa} kg/ha</span>
            </div>
            <div className="overview-metric">
              <span className="lbl">Bare Soil Reduced</span>
              <span className="val">{strategy.bareDaysEliminated} Days</span>
            </div>
          </div>

          {/* Section 1: Why Was This Suggested? */}
          <div className="evidence-section">
            <h4>💡 Why Was This Rotation Suggested?</h4>
            <p className="section-text">{strategy.whySuggested}</p>
          </div>

          {/* Section 2: NASA Earth Observations Evidence Base */}
          <div className="evidence-section">
            <h4>🛰️ NASA Satellite Evidence Base</h4>
            <div className="evidence-data-card">
              <p>{strategy.nasaEvidence}</p>
            </div>
          </div>

          {/* Section 3: Information Gaps & Sensor Uncertainties */}
          <div className="evidence-section">
            <h4>🔍 Information Gaps & Satellite Resolution Limitations</h4>
            <div className="uncertainty-card">
              <p>
                <strong>Data Limitations:</strong> {strategy.informationGaps}
              </p>
              <span className="disclaimer-note">
                Note: Satellite observations provide macroscopic field trends (30m to 9km), but cannot detect micro-scale tile line blockages, seed-depth variations, or localized soil pH variations. Ground truth soil sampling remains essential.
              </span>
            </div>
          </div>

          {/* Section 4: Local Agronomist & Extension Review Checklist */}
          <div className="evidence-section highlight-agronomist">
            <h4>🚜 Local Agronomist & Farmer Review Checklist</h4>
            <p className="agronomist-intro">
              Before planting this rotation, review these specific operational questions with your county extension agent, seed dealer, or agronomist:
            </p>
            <ul className="agronomist-checklist">
              <li>
                <strong>Local Pest & Disease Review:</strong> {strategy.localRisksRequiringReview}
              </li>
              <li>
                <strong>Herbicide Carryover Check:</strong> Verify that residual herbicides from the previous cash crop do not restrict the establishment of legume or cover crop species.
              </li>
              <li>
                <strong>Termination Strategy:</strong> Confirm whether spring cover termination will be accomplished via roller-crimper, glyphosate spray, or grazing, and verify timing based on local spring soil moisture.
              </li>
              <li>
                <strong>Market & Delivery Contracts:</strong> Confirm nearby delivery elevators, processing contracts, or on-farm livestock feed use before seeding alternative pulse or small grain crops.
              </li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn" onClick={onClose}>
            Back to Comparison Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
