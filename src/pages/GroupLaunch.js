import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';
import FadeTransition from '../components/FadeTransition';
import './GroupLaunch.css';

function GroupLaunch() {
  const { selectedGroup, groupImageUrl } = useGroup();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!selectedGroup) {
    navigate('/learn');
    return null;
  }

  return (
    <FadeTransition isActive={isTransitioning} targetPath="/listen">
      <div className="group-launch">
        <div 
          className="group-container" 
          style={{ 
            backgroundColor: selectedGroup.color,
            '--selected-group-color': selectedGroup.color 
          }}
        >
          <div className="white-section">
            <div className="group-header">
              <h1>{selectedGroup.name}</h1>
              <p>{selectedGroup.translatedName}</p>
            </div>
            <div className="launch-options">
              <div className="nav-item" onClick={() => navigate('/listen')}>1. Listen</div>
              <div className="nav-item" onClick={() => navigate('/guess')}>2. Guess</div>
              <div className="nav-item" onClick={() => navigate('/reinforce')}>3. Reinforce</div>
              <div className="nav-item" onClick={() => navigate('/sentence')}>4. Sentence</div>
              <div className="nav-item" onClick={() => navigate('/speak')}>5. Speak</div>
              <div className="nav-item" onClick={() => navigate('/definition')}>6. Definition</div>
              <div className="nav-item" onClick={() => navigate('/translate')}>7. Translate</div>
            </div>
          </div>
          <div className="white-section">
            {groupImageUrl && (
              <div className="group-image-container">
                <img 
                  src={groupImageUrl} 
                  alt={selectedGroup.name}
                  className="group-image-in-book"
                />
                <div className="book-play-button-overlay" onClick={() => setIsTransitioning(true)}>
                  <img src="/icons/play-icon.svg" alt="Play" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FadeTransition>
  );
}

export default GroupLaunch; 