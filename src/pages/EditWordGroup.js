import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCompleteGroup, updateGroup, updateWordsForGroup, addGroup, addWordsToGroup } from '../services/api';
import { useGroup } from '../context/GroupContext';
import { AVAILABLE_TAGS } from '../constants/tags';
import Papa from 'papaparse';
import './EditWordGroup.css';

function EditWordGroup() {
  const { groupId } = useParams();
  const { selectGroup } = useGroup();
  const [groupData, setGroupData] = useState({
    name: '',
    translatedName: '',
    groupPicture: '',
    language: '',
    color: '#000000',
    backgroundSound: '',
    tags: [],
    languageExplanation: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [words, setWords] = useState([]);
  const [csvData, setCsvData] = useState(null);
  const [csvError, setCsvError] = useState('');
  const [showCsvInstructions, setShowCsvInstructions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const completeGroupData = await getCompleteGroup(groupId);
        setOriginalData(completeGroupData);
        setGroupData({
          name: completeGroupData.name,
          translatedName: completeGroupData.translatedName,
          groupPicture: completeGroupData.groupPicture,
          language: completeGroupData.language || '',
          color: completeGroupData.color || '',
          backgroundSound: completeGroupData.backgroundSound || '',
          tags: completeGroupData.tags || [],
          languageExplanation: completeGroupData.languageExplanation || ''
        });
        setWords(completeGroupData.words);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, [groupId]);

  const handleGroupChange = (e) => {
    setGroupData({ ...groupData, [e.target.name]: e.target.value });
  };

  const handleWordChange = (index, field, value) => {
    const newWords = [...words];
    newWords[index] = { ...newWords[index], [field]: value };
    setWords(newWords);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Uploading file:', file.name, file.size);

    const response = await fetch('https://allisons-language-app.de.r.appspot.com/api/upload', {
      method: 'POST',
      body: formData
    });

    console.log('Upload response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Upload response data:', data);
    
    if (!data.file) {
      throw new Error('No file URL in response');
    }
    
    return data.file;
  };

  const handleImageUpload = async (e, type, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File must be less than 5MB');
      e.target.value = '';
      return;
    }

    try {
      const fileUrl = await uploadImage(file);
      if (type === 'group') {
        setGroupData({ ...groupData, groupPicture: fileUrl });
      } else {
        const newWords = [...words];
        newWords[index] = { ...newWords[index], picture: fileUrl };
        setWords(newWords);
        
        // Debug logging
        console.log(`Picture uploaded for word ${index}:`, {
          fileUrl,
          updatedWord: newWords[index],
          allWords: newWords
        });
      }
    } catch (err) {
      alert('Error uploading file');
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Audio file must be less than 10MB');
      e.target.value = '';
      return;
    }

    try {
      const audioUrl = await uploadImage(file);
      setGroupData({ ...groupData, backgroundSound: audioUrl });
    } catch (err) {
      alert('Error uploading audio file');
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvError('Please select a valid CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setCsvError('Error parsing CSV file: ' + results.errors[0].message);
          return;
        }

        if (results.data.length === 0) {
          setCsvError('CSV file is empty');
          return;
        }

        setCsvData(results.data);
        setCsvError('');
        
        // Auto-populate words
        const wordRows = results.data.filter(row => row.word || row.translation);
        if (wordRows.length > 0) {
          const newWords = wordRows.map((row, index) => {
            // Preserve existing picture and _id if available
            const existingWord = words[index] || {};
            const existingPicture = existingWord.picture || '';
            const existingId = existingWord._id || '';
            
            return {
              _id: existingId, // Preserve the _id for existing words
              word: row.word || '',
              translation: row.translation || '',
              definition: row.definition || '',
              translatedDefinition: row.translatedDefinition || '',
              article: row.article || '',
              plural: row.plural || '',
              sentence: row.sentence || '',
              translatedSentence: row.translatedSentence || '',
              romajiPinyin: row.romajiPinyin || '',
              kana: row.kana || '',
              sentenceRomajiPinyin: row.sentenceRomajiPinyin || '',
              sentenceKana: row.sentenceKana || '',
              picture: existingPicture // Keep existing picture instead of clearing it
            };
          });

          setWords(newWords);
        }
      },
      error: (error) => {
        setCsvError('Error reading CSV file: ' + error.message);
      }
    });
  };

  const downloadCsvTemplate = () => {
    const template = [
      {
        // Word Information (REQUIRED for each word)
        word: 'hola (TARGET LANGUAGE)',
        translation: 'hello (ENGLISH)',
        definition: 'Un saludo (TARGET LANGUAGE)',
        translatedDefinition: 'A greeting (ENGLISH)',
        article: 'la (optional)',
        plural: 'holas (optional)',
        sentence: 'Hola, ¿cómo estás? (TARGET LANGUAGE)',
        translatedSentence: 'Hello, how are you? (ENGLISH)',
        romajiPinyin: '(optional - for Japanese/Chinese pronunciation)',
        kana: '(optional - for Japanese kanji pronunciation)',
        sentenceRomajiPinyin: '(optional - sentence pronunciation)',
        sentenceKana: '(optional - sentence kanji pronunciation)'
      },
      {
        // Second word
        word: 'adios (TARGET LANGUAGE)',
        translation: 'goodbye (ENGLISH)',
        definition: 'Una despedida (TARGET LANGUAGE)',
        translatedDefinition: 'A farewell (ENGLISH)',
        article: '',
        plural: '',
        sentence: 'Adios, hasta luego (TARGET LANGUAGE)',
        translatedSentence: 'Goodbye, see you later (ENGLISH)',
        romajiPinyin: '',
        kana: '',
        sentenceRomajiPinyin: '',
        sentenceKana: ''
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word_group_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only send changed group fields
      const changedGroupFields = {};
      Object.keys(groupData).forEach(key => {
        if (groupData[key] !== originalData[key]) {
          changedGroupFields[key] = groupData[key];
        }
      });

      // Always include language if it's set
      if (groupData.language) {
        changedGroupFields.language = groupData.language;
      }

      console.log('Original data:', originalData);
      console.log('Current group data:', groupData);
      console.log('Changed fields:', changedGroupFields);

      // Only send changed word fields
      const changedWords = words.map((word, index) => {
        const originalWord = originalData.words[index];
        const changedFields = {
          _id: word._id
        };
        Object.keys(word).forEach(key => {
          if (key !== 'group' && key !== '_id' && word[key] !== originalWord[key]) {
            changedFields[key] = word[key];
          }
        });
        
        // Debug logging for picture changes
        if (word.picture !== originalWord.picture) {
          console.log(`Picture changed for word ${index}:`, {
            original: originalWord.picture,
            new: word.picture,
            willSave: changedFields.picture
          });
        }
        
        return changedFields;
      }).filter(word => Object.keys(word).length > 1);

      console.log('Changed words to save:', changedWords);

      if (Object.keys(changedGroupFields).length > 0) {
        await updateGroup(groupId, changedGroupFields);
      }
      if (changedWords.length > 0) {
        await updateWordsForGroup(groupId, changedWords);
      }
      
      // Refresh the group context with updated data
      const updatedGroup = await getCompleteGroup(groupId);
      selectGroup(updatedGroup);
      
      alert('Group and words updated successfully!');
    } catch (err) {
      console.error('Error updating:', err);
      alert('Error updating group and words');
    }
  };

  const handleCopyGroup = async () => {
    try {
      // Create new group data with "Copy" appended to name
      const newGroupData = {
        ...groupData,
        name: `${groupData.name} Copy`,
        translatedName: `${groupData.translatedName} Copy`
      };

      // Create the new group
      const newGroup = await addGroup(newGroupData);

      // Copy all words to the new group
      const newWords = words.map(word => ({
        ...word,
        group: newGroup._id,
        _id: undefined // Remove the old _id so new ones will be created
      }));

      await addWordsToGroup(newGroup._id, newWords);

      // Refresh the group context with the new group
      const updatedGroup = await getCompleteGroup(newGroup._id);
      selectGroup(updatedGroup);

      alert('Group copied successfully!');
    } catch (err) {
      console.error('Error copying group:', err);
      alert('Error copying group');
    }
  };

  if (!words.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-word-group">
      <h1>Edit Word Group</h1>
      <button className="copy-button" onClick={handleCopyGroup}>Copy Word Group</button>
      
      <div className="csv-upload-section">
        <h2>CSV Upload (Optional)</h2>
        <p>Upload a CSV file to update the word fields. You can still edit the data after upload.</p>
        
        <div className="csv-instructions">
          <button 
            type="button" 
            onClick={() => setShowCsvInstructions(!showCsvInstructions)}
            className="instructions-toggle-btn"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#007bff', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              padding: '0',
              marginBottom: '10px'
            }}
          >
            {showCsvInstructions ? 'Hide' : 'Show'} CSV Format Instructions
          </button>
          
          {showCsvInstructions && (
            <div>
              <h3>CSV Format Instructions:</h3>
              <ul>
                <li><strong>Required Fields:</strong> word, translation, definition, translatedDefinition, sentence, translatedSentence</li>
                <li><strong>Language Guidelines:</strong>
                  <ul>
                    <li><strong>Target Language:</strong> word, definition, sentence (in the language you're learning)</li>
                    <li><strong>English:</strong> translation, translatedDefinition, translatedSentence (English translations)</li>
                  </ul>
                </li>
                <li><strong>Optional Fields:</strong> article, plural, romajiPinyin, kana, sentenceRomajiPinyin, sentenceKana</li>
                <li><strong>Note:</strong> Pictures must be uploaded manually in the form below</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="csv-controls">
          <button 
            type="button" 
            onClick={downloadCsvTemplate}
            className="template-btn"
          >
            Download CSV Template
          </button>
          
          <div className="file-upload">
            <label>Upload CSV File:</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
            />
          </div>
        </div>
        
        {csvError && (
          <div className="csv-error">
            {csvError}
          </div>
        )}
        
        {csvData && (
          <div className="csv-success">
            ✓ CSV uploaded successfully! {csvData.length} rows loaded.
            <button 
              type="button" 
              onClick={() => {
                setCsvData(null);
                setCsvError('');
              }}
              className="clear-csv-btn"
            >
              Clear CSV Data
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="group-info">
          <h2>Group Information</h2>
          <div>
            <label>Group Name:</label>
            <input
              type="text"
              name="name"
              value={groupData.name}
              onChange={handleGroupChange}
              required
            />
          </div>
          <div>
            <label>Translated Name:</label>
            <input
              type="text"
              name="translatedName"
              value={groupData.translatedName}
              onChange={handleGroupChange}
              required
            />
          </div>
          <div>
            <label>Group Picture:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'group')}
            />
            {groupData.groupPicture && (
              <img src={groupData.groupPicture} alt="Group preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
            )}
          </div>
          <div>
            <label>Language:</label>
            <select
              name="language"
              value={groupData.language}
              onChange={handleGroupChange}
              required
            >
              <option value="">Select a language</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="it">Italian</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div>
            <label>Color (optional):</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                name="color"
                value={groupData.color}
                onChange={handleGroupChange}
                style={{ width: '50px', height: '30px', padding: 0 }}
              />
              <span style={{ color: groupData.color }}>Selected Color</span>
            </div>
          </div>
          <div>
            <label>Background Sound (optional):</label>
            <input
              type="file"
              name="backgroundSound"
              accept="audio/*"
              onChange={handleAudioUpload}
            />
            {groupData.backgroundSound && (
              <audio controls style={{ marginTop: '10px' }}>
                <source src={groupData.backgroundSound} type="audio/mpeg" />
              </audio>
            )}
          </div>
          <div>
            <label>Language Explanation (optional):</label>
            <textarea
              name="languageExplanation"
              value={groupData.languageExplanation}
              onChange={handleGroupChange}
              rows="4"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Tags (optional):</label>
            <select
              multiple
              value={groupData.tags}
              onChange={(e) => {
                const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
                setGroupData({ ...groupData, tags: selectedTags });
              }}
              style={{ height: '100px' }}
            >
              {AVAILABLE_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <div style={{ marginTop: '5px' }}>
              <button 
                onClick={() => setGroupData({ ...groupData, tags: [] })}
                style={{ padding: '2px 6px', fontSize: '12px', width: '50px' }}
              >
                Clear Tags
              </button>
            </div>
            <small>Hold Ctrl/Cmd to select multiple tags</small>
          </div>
        </div>

        <div className="words-section">
          <h2>Words</h2>
          {words.map((word, index) => (
            <div key={index} className="word-entry">
              <h3>Word {index + 1}</h3>
              <div>
                <label>Word:</label>
                <input
                  type="text"
                  value={word.word}
                  onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Translation:</label>
                <input
                  type="text"
                  value={word.translation}
                  onChange={(e) => handleWordChange(index, 'translation', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Definition:</label>
                <input
                  type="text"
                  value={word.definition}
                  onChange={(e) => handleWordChange(index, 'definition', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Translated Definition:</label>
                <input
                  type="text"
                  value={word.translatedDefinition}
                  onChange={(e) => handleWordChange(index, 'translatedDefinition', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Article (optional):</label>
                <input
                  type="text"
                  value={word.article}
                  onChange={(e) => handleWordChange(index, 'article', e.target.value)}
                />
              </div>
              <div>
                <label>Plural (optional):</label>
                <input
                  type="text"
                  value={word.plural}
                  onChange={(e) => handleWordChange(index, 'plural', e.target.value)}
                />
              </div>
              <div>
                <label>Sentence:</label>
                <input
                  type="text"
                  value={word.sentence}
                  onChange={(e) => handleWordChange(index, 'sentence', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Translated Sentence:</label>
                <input
                  type="text"
                  value={word.translatedSentence}
                  onChange={(e) => handleWordChange(index, 'translatedSentence', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Romaji/Pinyin (optional):</label>
                <input
                  type="text"
                  value={word.romajiPinyin}
                  onChange={(e) => handleWordChange(index, 'romajiPinyin', e.target.value)}
                />
              </div>
              <div>
                <label>Kana (optional -- use if app mispronounces kanji):</label>
                <input
                  type="text"
                  value={word.kana}
                  onChange={(e) => handleWordChange(index, 'kana', e.target.value)}
                />
              </div>
              <div>
                <label>Sentence Romaji/Pinyin (optional):</label>
                <input
                  type="text"
                  value={word.sentenceRomajiPinyin}
                  onChange={(e) => handleWordChange(index, 'sentenceRomajiPinyin', e.target.value)}
                />
              </div>
              <div>
                <label>Sentence Kana (optional):</label>
                <input
                  type="text"
                  value={word.sentenceKana}
                  onChange={(e) => handleWordChange(index, 'sentenceKana', e.target.value)}
                />
              </div>
              <div>
                <label>Word in Sentence (optional):</label>
                <input
                  type="text"
                  value={word.wordInSentence}
                  onChange={(e) => handleWordChange(index, 'wordInSentence', e.target.value)}
                />
              </div>
              <div>
                <label>Word in Sentence Kana (optional):</label>
                <input
                  type="text"
                  value={word.wordInSentenceKana}
                  onChange={(e) => handleWordChange(index, 'wordInSentenceKana', e.target.value)}
                />
              </div>
              <div>
                <label>Word in Sentence Romaji/Pinyin (optional):</label>
                <input
                  type="text"
                  value={word.wordInSentenceRomajiPinyin}
                  onChange={(e) => handleWordChange(index, 'wordInSentenceRomajiPinyin', e.target.value)}
                />
              </div>
              <div>
                <label>Picture:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'word', index)}
                />
                {word.picture && (
                  <img src={word.picture} alt="Word preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="submit">Update Group and Words</button>
      </form>
    </div>
  );
}

export default EditWordGroup; 