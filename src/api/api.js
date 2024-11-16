import axios from 'axios';
import { useToast } from "vue-toastification";
const toast = useToast();

const api = axios.create({
  baseURL: 'http://127.0.0.1:3000/', 
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
    toast.success(response.data.message || response.data.msg, {
      timeout: 1994,
      pauseOnHover: false
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    toast.error(`Registration failed: ${error.response.data.msg}`, {timeout: 1994,pauseOnHover: false});
    return error.response.data;
  }
}

export async function get(endpoint, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    console.log('GET request to', endpoint);
    const response = await api.get(endpoint, { headers: headers });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error getting from ${endpoint}:`, error);
    return error.response.data;
  }
}

export async function patch(endpoint, data, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    console.log('PATCH request to', endpoint, 'with data', data);
    const response = await api.patch(endpoint, data, { headers: headers });
    toast.success("House updated successfully!", {timeout: 1994,pauseOnHover: false});
    return handleResponse(response);
  } catch (error) {
    console.error(`Error patching to ${endpoint}:`, error);
    return error.response.data;
  }
}

async function handleResponse(response) {
  console.log('response.', response.status)
  if (response.status === 200 || response.status === 201) {
    console.log('Response:', response.data);
    return response.data;
  } else {
    const errorBody = await response.json();
    console.error(`Error with status: ${response.status}, body: ${JSON.stringify(errorBody)}, full response: ${JSON.stringify(response)}`);
    throw new Error(`Error with status: ${response.status}, body: ${JSON.stringify(errorBody)}`);
  }
}

export default api;