import React, { useState } from 'react';
import { REGIONAL_FARMS } from './utils/nasaEarthData';
import { evaluateRotationStrategies } from './utils/rotationScoringEngine';

import { Header } from './components/Header';
import { FieldMapVisualizer } from './components/FieldMapVisualizer';
import { FarmerPrioritySliders } from './components/FarmerPrioritySliders';
import { ClimateStressTester } from './components/ClimateStressTester';
import { RotationComparisonMatrix } from './components/RotationComparisonMatrix';
import { StrategyEvidenceModal } from './components/StrategyEvidenceModal';
import { FarmerGlossaryModal } from './components/FarmerGlossaryModal';
import { SensorsInfoModal } from './components/SensorsInfoModal';

import './App.css';

export default function App() {
  const [selectedRegionKey, setSelectedRegionKey] = useState('nevada');
  const [farmerPriorities, setFarmerPriorities] = useState({
    waterConservation: 85,
    soilHealth: 80,
    supplementalRevenue: 60,
    lowEquipmentOverhead: 70
  });

  const [climateScenario, setClimateScenario] = useState({
    tempDelta: 0,
    rainDelta: 0
  });

  // Modals state
  const [selectedStrategyForDetails, setSelectedStrategyForDetails] = useState(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [sensorsModalOpen, setSensorsModalOpen] = useState(false);

  // Active Regional Farm Data
  const regionData = REGIONAL_FARMS[selectedRegionKey] || REGIONAL_FARMS.nevada;

  // Evaluate candidate rotation strategies based on current priorities and climate scenario
  const evaluatedStrategies = evaluateRotationStrategies(
    regionData,
    farmerPriorities,
    climateScenario
  );

  const handleUpdatePriority = (key, val) => {
    setFarmerPriorities((prev) => ({ ...prev, [key]: val }));
  };

  const handleUpdateClimate = (tDelta, rDelta) => {
    setClimateScenario({ tempDelta: tDelta, rainDelta: rDelta });
  };

  return (
    <div className="field-shift-app">
      {/* 1. TOP HEADER & REGION PICKER */}
      <Header
        selectedRegion={selectedRegionKey}
        onSelectRegion={setSelectedRegionKey}
        onOpenGlossary={() => setGlossaryOpen(true)}
        onOpenSensorsModal={() => setSensorsModalOpen(true)}
      />

      <main className="main-content-layout">
        {/* 2. SATELLITE GIS FIELD VISUALIZER & PARCEL INSPECTOR */}
        <FieldMapVisualizer regionData={regionData} />

        {/* 3. CONTROLS GRID: PRIORITIES + CLIMATE STRESS TESTER */}
        <div className="controls-two-col-grid">
          <FarmerPrioritySliders
            priorities={farmerPriorities}
            onUpdatePriority={handleUpdatePriority}
          />

          <ClimateStressTester
            climateScenario={climateScenario}
            onUpdateClimate={handleUpdateClimate}
          />
        </div>

        {/* 4. ROTATION STRATEGY COMPARISON ENGINE (At least 3 strategies) */}
        <RotationComparisonMatrix
          evaluatedStrategies={evaluatedStrategies}
          onSelectStrategyForDetails={(strat) => setSelectedStrategyForDetails(strat)}
        />
      </main>

      {/* 5. FOOTER & CITATIONS */}
      <footer className="field-shift-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <strong>FIELD SHIFT</strong> — 2026 NASA Space Apps Challenge
            <p>
              Decision-support tool for climate-resilient crop rotations using NASA Earth observations.
            </p>
          </div>
          <div className="footer-partners">
            <span>Funded by NASA's <strong>Science Mission Directorate</strong> via Booz Allen Hamilton, Mindgrub, and SecondMuse.</span>
            <div className="footer-links">
              <a href="https://github.com/nasa/spaceapps" target="_blank" rel="noreferrer">Space Apps Connect</a>
              <span>·</span>
              <a href="https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/" target="_blank" rel="noreferrer">Official Challenge Page</a>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <StrategyEvidenceModal
        strategy={selectedStrategyForDetails}
        onClose={() => setSelectedStrategyForDetails(null)}
        onOpenGlossary={() => {
          setSelectedStrategyForDetails(null);
          setGlossaryOpen(true);
        }}
      />

      <FarmerGlossaryModal
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />

      <SensorsInfoModal
        isOpen={sensorsModalOpen}
        onClose={() => setSensorsModalOpen(false)}
      />
    </div>
  );
}
