// src/hooks/useBackendMessage.js
import { useEffect, useState } from 'react';
import axios from 'axios';

const useBackendMessage = (endpoint = '/') => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`${endpoint}`)
      .then(res => setMessage(res.data))
      .catch(err => {
        console.error(err);
        setMessage('Failed to connect');
      });
  }, [endpoint]);

  return message;
};

export default useBackendMessage;
