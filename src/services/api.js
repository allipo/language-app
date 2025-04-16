const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const getGroups = async () => {
  const response = await fetch(`${API_URL}/groups`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const addGroup = async (groupData) => {
  const response = await fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(groupData),
  });
  return response.json();
};

export const addWordsToGroup = async (groupId, wordsData) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/words`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(wordsData),
  });
  return response.json();
};

export const getWords = async () => {
  const response = await fetch(`${API_URL}/words`);
  return response.json();
};

export const addWord = async (wordData) => {
  const response = await fetch(`${API_URL}/words`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(wordData),
  });
  return response.json();
};

export const getGroupNames = async (page = 1, limit = 30, language = 'all', search = '') => {
  const params = new URLSearchParams({
    page,
    limit,
    language,
    search
  });
  const response = await fetch(`${API_URL}/groups/names?${params}`);
  return response.json();
};

export const deleteGroup = async (groupId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const getWordsForGroup = async (groupId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/words`);
  return response.json();
};

export const updateGroup = async (groupId, groupData) => {
  const response = await fetch(`${API_URL}/groups/${groupId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(groupData),
  });
  return response.json();
};

export const updateWordsForGroup = async (groupId, wordsData) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/words`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(wordsData),
  });
  return response.json();
};

export const getGroup = async (groupId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}`);
  return response.json();
};

export const getCompleteGroup = async (groupId) => {
  const response = await fetch(`${API_URL}/groups/${groupId}/complete`);
  return response.json();
}; 