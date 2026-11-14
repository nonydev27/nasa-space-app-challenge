import { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Zap,
  X,
  Compass,
  Moon,
  ChevronRight
} from 'lucide-react';
import { MISSION_GUIDELINES, type MissionGuideline } from '../game/missionGuidelines';
import { soundFx } from '../utils/soundEffects';

interface Props {
  isOpen: boolean;
  initialMissionId?: string;
  onClose: () => void;
}

const MISSION_TABS = [
  { id: 'mission-1', label: 'Mission 1' },
  { id: 'mission-2', label: 'Mission 2' },
  { id: 'mission-3', label: 'Mission 3' },
  { id: 'mission-4', label: 'Mission 4' },
  { id: 'mission-5', label: 'Mission 5' },
  { id: 'sandbox', label: 'Sandbox' }
];

export function MissionGuidelinesModal({ isOpen, initialMissionId = 'mission-1', onClose }: Props) {
  const [selectedId, setSelectedId] = useState(initialMissionId);
  const guide: MissionGuideline = MISSION_GUIDELINES[selectedId] || MISSION_GUIDELINES['mission-1'];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay guidelines-modal-overlay" onClick={onClose}>
      <div
        className="modal-container guidelines-modal glass"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="guidelines-title"
      >
        <header className="guidelines-header">
          <div className="title-cluster">
            <span className="icon-wrapper">
              <ClipboardList size={22} className="accent-icon" />
            </span>
            <div>
              <h2 id="guidelines-title">Flight Director Mission Guidelines</h2>
              <p className="subtitle">Standard Operating Procedures & NASA Open Data Protocols</p>
            </div>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            aria-label="Close guidelines"
          >
            <X size={20} />
          </button>
        </header>

        {/* Mission selector tabs */}
        <nav className="mission-selector-tabs">
          {MISSION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`m-tab ${selectedId === tab.id ? 'active' : ''}`}
              onClick={() => {
                soundFx.playClick();
                setSelectedId(tab.id);
              }}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content body */}
        <div className="guidelines-body">
          {/* Mission Meta Banner */}
          <div className="guide-meta-banner">
            <div className="banner-top">
              <span className="loc-pill">
                {guide.location === 'moon' ? <Moon size={14} /> : <Compass size={14} />}
                {guide.location === 'moon' ? 'LUNAR SOUTH POLE' : 'MARTIAN JEZERO CRATER'}
              </span>
              <span className="diff-pill">{guide.difficulty}</span>
            </div>
            <h3>{guide.title}</h3>
            <p className="guide-summary">{guide.summary}</p>
          </div>

          <div className="guide-sections-grid">
            {/* Primary Objectives */}
            <div className="guide-card objectives-card">
              <h4>
                <CheckCircle2 size={18} className="sec-icon text-green" />
                Primary Mission Objectives
              </h4>
              <ul className="checklist">
                {guide.primaryObjectives.map((obj, i) => (
                  <li key={i}>
                    <span className="check-bullet">✓</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Power Matrix */}
            <div className="guide-card power-card">
              <h4>
                <Zap size={18} className="sec-icon text-cyan" />
                Target Power Allocation
              </h4>
              <div className="alloc-pill-grid">
                <div className="alloc-item"><span>ECLSS</span><b>{guide.suggestedAllocations.eclss} kW</b></div>
                <div className="alloc-item"><span>Shields</span><b>{guide.suggestedAllocations.shields} kW</b></div>
                <div className="alloc-item"><span>Greenhouse</span><b>{guide.suggestedAllocations.greenhouse} kW</b></div>
                <div className="alloc-item"><span>Science</span><b>{guide.suggestedAllocations.scienceLab} kW</b></div>
                <div className="alloc-item"><span>Comms/Rover</span><b>{guide.suggestedAllocations.commsRover} kW</b></div>
              </div>
              <p className="alloc-notes">{guide.suggestedAllocations.notes}</p>
            </div>
          </div>

          {/* Step-by-Step Walkthrough */}
          <div className="guide-card walkthrough-card">
            <h4>
              <Lightbulb size={18} className="sec-icon text-amber" />
              Step-by-Step Mission Walkthrough
            </h4>
            <div className="walkthrough-steps">
              {guide.stepByStepWalkthrough.map((step) => (
                <div key={step.step} className="step-row">
                  <div className="step-num">
                    <span>{step.step}</span>
                  </div>
                  <div className="step-content">
                    <div className="step-phase">
                      <b>{step.phase}</b>
                    </div>
                    <p className="step-action">{step.action}</p>
                    <div className="step-protip">
                      <ChevronRight size={14} />
                      <small><b>Pro-Tip:</b> {step.proTip}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="guide-sections-grid">
            {/* Critical Survival Rules */}
            <div className="guide-card rules-card">
              <h4>
                <AlertTriangle size={18} className="sec-icon text-red" />
                Critical Flight Rules
              </h4>
              <ul className="bullet-list">
                {guide.criticalRules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* NASA Open Data grounding */}
            <div className="guide-card science-card">
              <h4>
                <BookOpen size={18} className="sec-icon text-violet" />
                NASA Science & Mission Data
              </h4>
              <ul className="bullet-list">
                {guide.nasaScienceFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <footer className="guidelines-footer">
          <button
            type="button"
            className="cta-close"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
          >
            Acknowledge Guidelines & Return to Mission
          </button>
        </footer>
      </div>
    </div>
  );
}
