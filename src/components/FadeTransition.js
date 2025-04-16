import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FadeTransition.css';

const FadeTransition = ({ isActive, targetPath, children }) => {
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive && !isFading) {
      setIsFading(true);
      setTimeout(() => {
        navigate(targetPath);
      }, 2000);
    }
  }, [isActive, isFading, navigate, targetPath]);

  return (
    <>
      {children}
      <div className={`fade-transition ${isFading ? 'fade-out' : ''}`} />
    </>
  );
};

export default FadeTransition; 