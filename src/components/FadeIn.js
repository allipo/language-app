import React, { useEffect, useState } from 'react';
import './FadeIn.css';

const FadeIn = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add a small delay before starting the fade
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      <div className={`fade-in ${isVisible ? 'fade-in-visible' : ''}`} />
    </>
  );
};

export default FadeIn; 