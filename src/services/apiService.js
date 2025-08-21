import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://milgram-experiments.railway.internal:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL
});

export const fetchTTSAudio = async (speaker, text) => {
  const response = await apiClient.post('/api/tts', {
    role: speaker,
    message: text
  }, {
    responseType: 'blob'
  });
  return response.data; // This is the blob
};

export const getGameSequenceEventSource = () => {
  return new EventSource(`${API_BASE_URL}/api/game-sequence-example`);
};

export const getNewContersationEventSource = () => {
  return new EventSource(`${API_BASE_URL}/api/run-experiment`);
};

export const fetchAllConversations = async () => {
  const response = await apiClient.get('/api/load-all-conversations');
  return response.data;
};