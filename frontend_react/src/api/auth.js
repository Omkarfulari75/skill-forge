import client from './client';

export const loginUser = async (role, email, password) => {
  const response = await client.post('/login', { role, email, password });
  return response.data;
};

export const registerUser = async (name, email, password, role) => {
  const response = await client.post('/register', { name, email, password, role });
  return response.data;
};
