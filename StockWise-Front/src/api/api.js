import axios from 'axios';
import { useToast } from "vue-toastification";
const toast = useToast();

const api = axios.create({
  baseURL: 'http://127.0.0.1:3000/', // URL do servidor back-end
});

export async function post(endpoint, data, token = null, contentType = 'application/json') {
  try {
    const headers = {
      "Content-Type": contentType,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    console.log('POST request to', endpoint, 'with data', data);
    const response = await api.post(endpoint, data, { headers: headers });
    toast.success("Registration successful!");
    return handleResponse(response);
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    toast.error(`Registration failed: ${error.response.data.msg}`);
    return error.response.data;
  }
}


async function handleResponse(response) {
  console.log('response.', response.status)
  if (response.status === 200 || response.status === 201) {
    return response.data;
  } else {
    const errorBody = await response.json();
    console.error(`Error with status: ${response.status}, body: ${JSON.stringify(errorBody)}, full response: ${JSON.stringify(response)}`);
    throw new Error(`Error with status: ${response.status}, body: ${JSON.stringify(errorBody)}`);
  }
}

export default api;