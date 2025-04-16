import React, { useState, useEffect } from 'react';
import { getGroupNames } from '../services/api';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import { getContrastColor, getRandomDarkColor } from '../utils/colorUtils';
import { useNavigate } from 'react-router-dom';
import './Learn.css';

function Learn() {
  const [groups, setGroups] = useState([]);
  const { selectedGroup, selectGroup } = useGroup();
  const { selectedLanguage } = useLanguage();
  const navigate = useNavigate();

  const getRandomTexture = () => {
    const textureNumber = Math.floor(Math.random() * 6) + 1;
    return `url(${require(`../assets/book-cover-${textureNumber}.png`)})`;
  };

  const getRandomHeight = (isVertical) => {
    const heights = [200, 210, 220, 230, 240, 250];
    const baseHeight = heights[Math.floor(Math.random() * heights.length)];
    return isVertical ? baseHeight + 80 : baseHeight;
  };

  const getRandomTextStyle = (group) => {
    const isLongText = group.name.length > 24 || group.translatedName.length > 24;
    return isLongText ? 'vertical' : '';
  };

  useEffect(() => {
    fetchGroups();
  }, [selectedLanguage]);

  const fetchGroups = async () => {
    try {
      const response = await getGroupNames();
      const data = await response;
      // Filter groups by selected language
      const filteredGroups = data.groups.filter(group => group.language === selectedLanguage.code);
      setGroups(filteredGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleBookClick = (group) => {
    selectGroup(group);
    navigate('/group-launch');
  };

  return (
    <div>
      <div className="bookshelf">
        {groups.map(group => {
          const isVertical = getRandomTextStyle(group) === 'vertical';
          return (
            <div 
              key={group._id} 
              className={`book ${selectedGroup?._id === group._id ? 'selected' : ''}`}
              onClick={() => handleBookClick(group)}
              style={{ 
                backgroundColor: group.color || '#f5f5f5',
                color: getContrastColor(group.color || '#f5f5f5'),
                backgroundImage: `${getRandomTexture()}, linear-gradient(${group.color || '#f5f5f5'}, ${group.color || '#f5f5f5'})`,
                backgroundBlendMode: 'overlay',
                height: `${getRandomHeight(isVertical)}px`
              }}
            >
              <div className={`group-content ${getRandomTextStyle(group)}`}>
                <div className="text-background" style={{ backgroundColor: getRandomDarkColor() }}>
                  <h3>{group.name}</h3>
                  <p>{group.translatedName}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Learn; 