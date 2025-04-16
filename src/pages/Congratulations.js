import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import FadeIn from '../components/FadeIn';
import { useGroup } from '../context/GroupContext';
import './Congratulations.css';

function Congratulations() {
  const navigate = useNavigate();
  const { selectedGroup } = useGroup();
  const groupColor = selectedGroup?.color;
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="congratulations">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={true}
        numberOfPieces={400}
        colors={['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', groupColor, groupColor, groupColor, groupColor, groupColor, groupColor, groupColor, groupColor, groupColor, groupColor, groupColor]}
      />
      <FadeIn>
        <h1>Congratulations!</h1>
        <button onClick={() => navigate('/learn')} className="shiny-button">Back to Bookshelf</button>
      </FadeIn>
    </div>
  );
}

export default Congratulations; 