import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { NASA_GLOSSARY } from '../utils/nasaData';

/** @param {{ isOpen: boolean, onClose: () => void, initialTerm?: string | null }} props */
export function GlossaryModal({ isOpen, onClose, initialTerm = /** @type {string | null} */ (null) }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(initialTerm || 'Sol');

  if (!isOpen) return null;

  const filteredKeys = Object.keys(NASA_GLOSSARY).filter((key) =>
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    NASA_GLOSSARY[key].title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEntry = NASA_GLOSSARY[selectedTerm] || NASA_GLOSSARY['Sol'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-badge">
            <span className="nasa-inline-pill">JUNIOR ASTRONAUT</span>
            <h3>Plain-Language Space Glossary</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="glossary-search-bar">
          <input
            type="text"
            placeholder="Search space terms (e.g. Regolith, DONKI, Sol)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glossary-input"
          />
        </div>

        <div className="glossary-body-grid">
          {/* Term List */}
          <div className="glossary-terms-sidebar">
            {filteredKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={`term-pill-btn ${selectedTerm === key ? 'active' : ''}`}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedTerm(key);
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Term Details View */}
          <div className="glossary-term-content">
            <h4>{activeEntry.title}</h4>
            <p className="glossary-def">{activeEntry.definition}</p>
            <div className="did-you-know-card">
              <span className="star-icon">
                <Sparkles size={16} color="#ffd700" />
              </span>
              <div>
                <strong>Did You Know?</strong>
                <p>{activeEntry.didYouKnow}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-action-btn"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
          >
            Close Glossary
          </button>
        </div>
      </div>
    </div>
  );
}
