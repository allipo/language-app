import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './DropdownMenu.css';

function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { beginnerMode, setBeginnerMode, voicePreference, setVoicePreference } = useLanguage();
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

  const toggleSetting = (setting) => {
    if (setting === 'beginnerMode') {
      setBeginnerMode(!beginnerMode);
    } else if (setting === 'voicePreference') {
      setVoicePreference(voicePreference === 'Female' ? 'Male' : 'Female');
    }
  };

  const menuItems = [
    { label: 'Beginner Mode', setting: 'beginnerMode', value: beginnerMode },
    { label: 'Voice', setting: 'voicePreference', value: voicePreference === 'Male' }
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
        Settings
      </Link>
      {isOpen && (
        <div className="dropdown-content">
          {menuItems.map(item => (
            <Link 
              key={item.setting}
              to="#"
              className="dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                toggleSetting(item.setting);
              }}
              style={{ color: 'white' }}
            >
              {item.label}
              {item.setting === 'voicePreference' ? (
                <div className="voice-options">
                  <span className={`voice-option ${voicePreference === 'Male' ? 'selected' : ''}`}>M</span>
                  <span className={`voice-option ${voicePreference === 'Female' ? 'selected' : ''}`}>F</span>
                </div>
              ) : (
                <div className={`toggle ${item.value ? 'on' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SettingsDropdown; 