import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './DropdownMenu.css';

function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { label: 'Word Lists', path: '/learn' },
    { label: 'Listen', path: '/listen' },
    { label: 'Guess', path: '/guess' },
    { label: 'Reinforce', path: '/reinforce' },
    { label: 'Sentence', path: '/sentence' },
    { label: 'Speak', path: '/speak' },
    { label: 'Definition', path: '/definition' },
    { label: 'Translate', path: '/translate' }
  ];

  return (
    <div 
      className="dropdown" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        to="#"
        className="nav-link"
      >
        Go To
      </Link>
      {isOpen && (
        <div className="dropdown-content">
          {menuItems.map((item, index) => (
            <Link 
              key={index}
              to={item.path}
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu; 