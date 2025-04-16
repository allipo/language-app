import React, { useState } from 'react';
import { addGroup, addWordsToGroup } from '../services/api';
import { AVAILABLE_TAGS } from '../constants/tags';
import './Input.css';

function Input() {
  const [groupData, setGroupData] = useState({
    name: '',
    translatedName: '',
    groupPicture: '',
    color: '#000000',
    backgroundSound: '',
    language: '',
    tags: [],
    languageExplanation: ''
  });

  const [words, setWords] = useState(Array(10).fill().map(() => ({
    word: '',
    translation: '',
    definition: '',
    translatedDefinition: '',
    article: '',
    plural: '',
    sentence: '',
    translatedSentence: '',
    picture: '',
    romajiPinyin: '',
    kana: '',
    sentenceRomajiPinyin: '',
    sentenceKana: ''
  })));

  const languages = [
    { code: 'zh', name: 'Chinese' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'es', name: 'Spanish' }
  ];

  const availableTags = AVAILABLE_TAGS;

  const handleGroupChange = (e) => {
    setGroupData({ ...groupData, [e.target.name]: e.target.value });
  };

  const handleWordChange = (index, field, value) => {
    const newWords = [...words];
    newWords[index] = { ...newWords[index], [field]: value };
    setWords(newWords);
  };

  const uploadImages = async (files) => {
    const formData = new FormData();
    Object.entries(files).forEach(([fieldName, file]) => {
      formData.append(fieldName, file);
    });

    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error uploading files');
    }

    return response.json();
  };

  const handleImageUpload = async (e, type, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB max for images, 10MB for audio)
    const maxSize = type === 'sound' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File must be less than ${maxSize / (1024 * 1024)}MB`);
      e.target.value = ''; // Clear the input
      return;
    }

    try {
      const files = {};
      const fieldName = type === 'group' ? 'groupPicture' : 
                       type === 'sound' ? 'backgroundSound' : 
                       `wordPicture_${index}`;
      files[fieldName] = file;

      const results = await uploadImages(files);
      const fileUrl = results[fieldName];

      if (type === 'group') {
        setGroupData({ ...groupData, groupPicture: fileUrl });
      } else if (type === 'sound') {
        setGroupData({ ...groupData, backgroundSound: fileUrl });
      } else {
        const newWords = [...words];
        newWords[index] = { ...newWords[index], picture: fileUrl };
        setWords(newWords);
      }
    } catch (err) {
      alert(err.message || 'Error uploading file');
      e.target.value = ''; // Clear the input on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const group = await addGroup(groupData);
      await addWordsToGroup(group._id, words);
      alert('Group and words added successfully!');
      setGroupData({ name: '', translatedName: '', groupPicture: '', color: '#000000', backgroundSound: '', language: '', tags: [], languageExplanation: '' });
      setWords(Array(10).fill().map(() => ({
        word: '',
        translation: '',
        definition: '',
        translatedDefinition: '',
        article: '',
        plural: '',
        sentence: '',
        translatedSentence: '',
        picture: '',
        romajiPinyin: '',
        kana: '',
        sentenceRomajiPinyin: '',
        sentenceKana: ''
      })));
    } catch (err) {
      alert('Error adding group and words');
    }
  };

  return (
    <div className="input-page">
      <h1>Add New Word Group</h1>
      <form onSubmit={handleSubmit}>
        <div className="group-info">
          <h2>Group Information</h2>
          <div>
            <label>Language:</label>
            <select
              name="language"
              value={groupData.language}
              onChange={handleGroupChange}
              required
            >
              <option value="">Select a language</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
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
            <label>Group Picture:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'group')}
              required
            />
            {groupData.groupPicture && (
              <img src={groupData.groupPicture} alt="Group preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
            )}
          </div>
          <div>
            <label>Color (optional):</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={groupData.color}
                onChange={handleGroupChange}
                name="color"
                style={{ width: '50px', height: '30px', padding: 0 }}
              />
              <span style={{ color: groupData.color }}>Selected Color</span>
            </div>
          </div>
          <div>
            <label>Background Sound (optional):</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleImageUpload(e, 'sound')}
              name="backgroundSound"
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
              {availableTags.map(tag => (
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
          <h2>Words (10 words required)</h2>
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
                <label>Picture:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'word', index)}
                  required
                />
                {word.picture && (
                  <img src={word.picture} alt="Word preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="submit">Add Group and Words</button>
      </form>
    </div>
  );
}

export default Input; 