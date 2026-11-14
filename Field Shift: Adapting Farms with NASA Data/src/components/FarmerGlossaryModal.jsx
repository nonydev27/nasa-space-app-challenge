import React, { useState } from 'react';
import { FARMER_GLOSSARY } from '../utils/nasaEarthData';

export function FarmerGlossaryModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState('Evapotranspiration');

  if (!isOpen) return null;

  const filteredKeys = Object.keys(FARMER_GLOSSARY).filter((k) =>
    FARMER_GLOSSARY[k].term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    FARMER_GLOSSARY[k].simpleDefinition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEntry = FARMER_GLOSSARY[selectedKey] || FARMER_GLOSSARY['Evapotranspiration'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-badge">
            <span className="nasa-pill">FARMER KNOWLEDGE BASE</span>
            <h3>Plain-Language Satellite & Agronomy Glossary</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="glossary-search-box">
          <input
            type="text"
            placeholder="Search terms (e.g. Evapotranspiration, NDVI, GDD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="glossary-split-grid">
          <div className="terms-sidebar">
            {filteredKeys.map((k) => (
              <button
                key={k}
                type="button"
                className={`term-btn ${selectedKey === k ? 'active' : ''}`}
                onClick={() => setSelectedKey(k)}
              >
                {FARMER_GLOSSARY[k].term.split('(')[0].trim()}
              </button>
            ))}
          </div>

          <div className="term-content-view">
            <h4>{activeEntry.term}</h4>
            <div className="definition-box">
              <strong>What It Means in Plain English:</strong>
              <p>{activeEntry.simpleDefinition}</p>
            </div>

            <div className="takeaway-box">
              <span className="icon">🌾</span>
              <div>
                <strong>Why It Matters in Your Tractor Cab:</strong>
                <p>{activeEntry.farmerTakeaway}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn" onClick={onClose}>
            Close Glossary
          </button>
        </div>
      </div>
    </div>
  );
}
