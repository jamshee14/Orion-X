import axios from 'axios';
const API = axios.create({ baseURL: 'http://127.0.0.1:8000', withCredentials: true });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
export const loginUser = (d) => API.post('/login', d);
export const registerUser = (d) => API.post('/users', d);
export const fetchNotes = () => API.get('/notes');
export const postNote = (d) => API.post('/notes', d);
export const logoutUser = () => API.post('/logout');
export const deleteNote = (id) => API.delete(`/notes/${id}`);

// Quiz APIs
export const fetchQuizzes = () => API.get('/quizzes');
export const fetchQuizDetails = (id) => API.get(`/quizzes/${id}`);
export const createQuiz = (d) => API.post('/quizzes', d);
export const deleteQuiz = (id) => API.delete(`/quizzes/${id}`);
export const generateQuizAI = (params) => {
  const formData = new FormData();
  if (params.topic) formData.append("topic", params.topic);
  if (params.noteId) formData.append("note_id", params.noteId);
  if (params.numQuestions) formData.append("num_questions", params.numQuestions);
  if (params.timerMinutes) formData.append("timer_minutes", params.timerMinutes);
  return API.post('/quizzes/generate', formData);
};

// Study Path APIs
export const generateStudyPath = (noteId) => API.post(`/notes/${noteId}/study-path`);
export const fetchStudyPath = (noteId) => API.get(`/notes/${noteId}/study-path`);

// Analytics & Submission
export const submitQuiz = (data) => API.post('/quizzes/submit', data);
export const fetchQuizAnalytics = (quizId) => API.get(`/analytics/quizzes/${quizId}`);

// AI Tutor API
export const postChatMessage = (data) => API.post('/tutor/chat', data);

// Meetings
export const startMeeting = () => API.post('/meetings/start');
export const endMeeting = (id) => API.post(`/meetings/${id}/end`);
export const fetchMeetings = () => API.get('/meetings');
