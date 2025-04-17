import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGroupNames, deleteGroup } from '../services/api';
import { useGroup } from '../context/GroupContext';
import './Edit.css';

function Edit() {
  const [groups, setGroups] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('zh');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const groupsPerPage = 30;
  const { selectedGroup } = useGroup();

  const languageNames = {
    zh: 'Chinese',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    es: 'Spanish'
  };

  useEffect(() => {
    fetchGroups();
  }, [currentPage, selectedLanguage]);

  const fetchGroups = async () => {
    try {
      const data = await getGroupNames(currentPage, groupsPerPage, selectedLanguage);
      setGroups(data.groups);
      setTotalPages(data.totalPages);
      setTotalGroups(data.total);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleDeleteClick = (e, group) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupToDelete(group);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteInput === 'delete') {
      try {
        await deleteGroup(groupToDelete._id);
        fetchGroups();
        setShowDeleteModal(false);
        setDeleteInput('');
      } catch (err) {
        console.error('Error deleting group:', err);
      }
    }
  };

  return (
    <div className="edit-page">
      <h1>Edit Word Lists</h1>
      <div className="filters">
        <div className="language-filter">
          <label htmlFor="language-select">Filter by Language: </label>
          <select 
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setCurrentPage(1);
            }}
          >
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
            <option value="all">All Languages</option>
          </select>
        </div>
      </div>
      <div className="groups-list">
        {Object.entries(groups.reduce((acc, group) => {
          if (!acc[group.language]) {
            acc[group.language] = [];
          }
          acc[group.language].push(group);
          return acc;
        }, {}))
          .map(([language, languageGroups]) => (
            <div key={language} className="language-section">
              <h2 className="language-header">{languageNames[language]}</h2>
              {languageGroups.map(group => (
                <Link 
                  to={`/edit/group/${group._id}`}
                  key={group._id} 
                  className={`group-item ${selectedGroup?._id === group._id ? 'selected' : ''}`}
                >
                  <div className="group-content">
                    <h3>{group.name}</h3>
                    <p>{group.translatedName}</p>
                    {group.tags && group.tags.length > 0 && (
                      <div className="tags">
                        {group.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={(e) => handleDeleteClick(e, group)}
                  >
                    Delete
                  </button>
                </Link>
              ))}
            </div>
          ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages} ({totalGroups} total groups)</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
      {showDeleteModal && (
        <div className="delete-modal">
          <div className="modal-content">
            <h2>Delete Word List</h2>
            <p>Are you sure you want to delete "{groupToDelete?.name}"?</p>
            <p>Type "delete" to confirm:</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleDeleteConfirm}>Confirm</button>
              <button onClick={() => {
                setShowDeleteModal(false);
                setDeleteInput('');
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Edit; 