import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getCompleteGroup } from '../services/api';
import { scrambleWords as scrambleWordList } from '../utils/wordUtils';

const GroupContext = createContext();

export function GroupProvider({ children }) {
  const [selectedGroup, setSelectedGroup] = useState(() => {
    const saved = localStorage.getItem('selectedGroup');
    return saved ? JSON.parse(saved) : null;
  });
  const [groupWords, setGroupWords] = useState([]);
  const [groupImageUrl, setGroupImageUrl] = useState('');
  const [wordImageUrls, setWordImageUrls] = useState({});

  useEffect(() => {
    if (selectedGroup) {
      localStorage.setItem('selectedGroup', JSON.stringify(selectedGroup));
    } else {
      localStorage.removeItem('selectedGroup');
    }
  }, [selectedGroup]);

  useEffect(() => {
    const loadSavedGroup = async () => {
      if (selectedGroup?._id) {
        try {
          const completeGroup = await getCompleteGroup(selectedGroup._id);
          const imageUrls = {};
          completeGroup.words.forEach(word => {
            imageUrls[word._id] = word.picture;
          });
          
          // Ensure color is in correct format
          if (completeGroup.color && !completeGroup.color.startsWith('#')) {
            completeGroup.color = `#${completeGroup.color}`;
          }
          
          setGroupWords(completeGroup.words);
          setGroupImageUrl(completeGroup.groupPicture || '');
          setWordImageUrls(imageUrls);
          // Only update selectedGroup if the data is different
          if (JSON.stringify(selectedGroup) !== JSON.stringify(completeGroup)) {
            setSelectedGroup(completeGroup);
          }
        } catch (error) {
          console.error('Error loading saved group:', error);
        }
      }
    };
    loadSavedGroup();
  }, [selectedGroup]);

  const selectGroup = useCallback(async (group) => {
    if (!group) {
      setSelectedGroup(null);
      setGroupWords([]);
      setGroupImageUrl('');
      setWordImageUrls({});
      return;
    }

    try {
      const completeGroup = await getCompleteGroup(group._id);
      
      // Ensure color is in correct format
      if (completeGroup.color && !completeGroup.color.startsWith('#')) {
        completeGroup.color = `#${completeGroup.color}`;
      }
      
      // Batch state updates
      const imageUrls = {};
      completeGroup.words.forEach(word => {
        imageUrls[word._id] = word.picture;
      });

      // Update all state at once
      setSelectedGroup(completeGroup);
      setGroupWords(completeGroup.words);
      setGroupImageUrl(completeGroup.groupPicture || '');
      setWordImageUrls(imageUrls);
    } catch (error) {
      console.error('Error fetching group words:', error);
    }
  }, []);

  return (
    <GroupContext.Provider value={{ 
      selectedGroup, 
      groupWords,
      groupImageUrl,
      wordImageUrls,
      selectGroup,
      scrambleWordList
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  return useContext(GroupContext);
} 