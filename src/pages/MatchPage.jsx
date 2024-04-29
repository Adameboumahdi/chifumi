import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Typography, Paper, Box, CircularProgress } from '@mui/material';
import EventSource from 'event-source-polyfill';

const MatchPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState('');
  const [eventSource, setEventSource] = useState(null);

  const setupEventSource = () => {
    if (eventSource) {
      eventSource.close(); // Close the existing event source if open
    }

    const es = new EventSource(`${import.meta.env.VITE_API_URL}/matches/${id}/subscribe`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleEvent(data);
      setLoading(false); // Stop loading when the first event is received
    };

    es.onerror = (error) => {
      console.error('SSE connection error:', error);
      es.close();
      setTimeout(setupEventSource, 5000); // Retry connection after 5 seconds
    };

    setEventSource(es);
  };

  useEffect(() => {
    setupEventSource();
    return () => eventSource && eventSource.close(); // Cleanup event source on unmount
  }, []);

  const handleEvent = (data) => {
    console.log('Event Received:', data);
    switch (data.type) {
      case 'NEW_TURN':
      case 'PLAYER_MOVED':
      case 'TURN_ENDED':
      case 'MATCH_ENDED':
        setResult(`Latest Update: ${data.type} - Details: ${JSON.stringify(data.payload)}`);
        break;
      default:
        console.log('Unhandled event type:', data.type);
    }
  };

  const playTurn = async (move) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${id}/turns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ move })
    });

    if (!response.ok) {
      console.error('Failed to play turn');
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 2, margin: 'auto', maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Match ID: {id}
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography>{result}</Typography>
          <Button variant="contained" onClick={() => playTurn('rock')}>Rock</Button>
          <Button variant="contained" onClick={() => playTurn('paper')}>Paper</Button>
          <Button variant="contained" onClick={() => playTurn('scissors')}>Scissors</Button>
        </Box>
      )}
    </Paper>
  );
};

export default MatchPage;
