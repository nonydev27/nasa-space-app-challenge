import React from 'react';

export function RotationComparisonMatrix({
  evaluatedStrategies,
  onSelectStrategyForDetails
}) {
  return (
    <div className="rotation-matrix-section">
      <div className="section-title-row">
        <div>
          <h3>ROTATION STRATEGY COMPARISON ENGINE</h3>
          <p className="section-sub">
            Comparing multi-year rotation alternatives side-by-side using NASA Earth Observations and your operational priorities.
          </p>
        </div>
        <span className="comparison-count-badge">
          {evaluatedStrategies.length} Strategies Evaluated
        </span>
      </div>

      <div className="strategies-cards-grid">
        {evaluatedStrategies.map((strat, idx) => {
          const isTopMatch = idx === 0 && !strat.isBaseline;
          const isBaseline = strat.isBaseline;

          return (
            <div
              key={strat.id}
              className={`strategy-card ${isTopMatch ? 'top-match' : isBaseline ? 'baseline-card' : ''}`}
            >
              {/* Card Header Badge */}
              <div className="card-top-badge-row">
                <span className={`rank-badge ${isBaseline ? 'baseline' : isTopMatch ? 'gold' : 'standard'}`}>
                  {isBaseline ? 'CURRENT BASELINE' : `#${idx + 1} RECOMMENDED`}
                </span>
                <span className="category-pill">{strat.category}</span>
                <div className="composite-score-circle" title="Weighted Match Score based on your priorities">
                  <span className="score-number">{strat.compositeScore}</span>
                  <span className="score-denom">/100</span>
                </div>
              </div>

              {/* Title & Sequence */}
              <h4 className="strat-title">{strat.title}</h4>

              {/* Visual Crop Sequence Chips */}
              <div className="crop-sequence-chain">
                <span className="chain-label">SEQUENCE:</span>
                <div className="sequence-pills">
                  {strat.cropSequence.map((crop, cIdx) => (
                    <React.Fragment key={cIdx}>
                      <span className="sequence-step">{crop}</span>
                      {cIdx < strat.cropSequence.length - 1 && <span className="chain-arrow">➔</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* TANGIBLE METRICS 4-GRID */}
              <div className="tangible-metrics-grid">
                <div className="t-metric-box">
                  <span className="t-lbl">💧 Water Use</span>
                  <span className="t-val">{strat.waterUseMm} mm</span>
                  <span className={`t-sub ${strat.waterSavedMm > 0 ? 'green' : 'neutral'}`}>
                    {strat.waterSavedMm > 0 ? `-${strat.waterSavedMm} mm saved` : 'Standard draw'}
                  </span>
                </div>

                <div className="t-metric-box">
                  <span className="t-lbl">🧪 Bio Nitrogen</span>
                  <span className="t-val">+{strat.nitrogenFixKgHa} kg/ha</span>
                  <span className={`t-sub ${strat.fertilizerSavedDollarPerAcre > 0 ? 'green' : 'neutral'}`}>
                    {strat.fertilizerSavedDollarPerAcre > 0 ? `~$${strat.fertilizerSavedDollarPerAcre}/ac saved` : '0 N credit'}
                  </span>
                </div>

                <div className="t-metric-box">
                  <span className="t-lbl">🛡️ Soil Armor</span>
                  <span className="t-val">{strat.erosionReductionPct}% less</span>
                  <span className="t-sub green">
                    {strat.bareDaysReduced > 0 ? `-${strat.bareDaysReduced} bare days` : 'Exposed in winter'}
                  </span>
                </div>

                <div className="t-metric-box">
                  <span className="t-lbl">💰 Net Return</span>
                  <span className="t-val-sm">{strat.netReturnEstimate.split(' ')[0]}</span>
                  <span className="t-sub">{strat.netReturnEstimate}</span>
                </div>
              </div>

              {/* Why Suggested Prose */}
              <div className="why-suggested-snippet">
                <strong>Why Suggested:</strong> {strat.whySuggested}
              </div>

              {/* NASA EO Evidence Summary */}
              <div className="nasa-evidence-snippet">
                <span className="sat-icon">🛰️</span>
                <span><strong>NASA Evidence:</strong> {strat.nasaEvidence}</span>
              </div>

              {/* Trade-off Warning */}
              <div className="trade-off-alert-box">
                <span className="warn-icon">⚠️</span>
                <span><strong>Key Local Consideration:</strong> {strat.localRisksRequiringReview}</span>
              </div>

              {/* CTA Details Button */}
              <button
                type="button"
                className="view-evidence-btn"
                onClick={() => onSelectStrategyForDetails(strat)}
              >
                <span>Inspect Evidence & Agronomist Checklist</span>
                <span className="arrow">↗</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
