import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Typography, Paper, Box, CircularProgress, Select, MenuItem } from '@mui/material';
import EventSource from 'event-source-polyfill';

const MatchPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState('');
  const [eventSource, setEventSource] = useState(null);
  const [selectedMove, setSelectedMove] = useState('');

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

  const playTurn = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${id}/turns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move: selectedMove }),
      });
      if (response.ok) {
        console.log('Turn created successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to create turn:', errorData);
      }
    } catch (error) {
      console.error('Network error:', error);
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
          <Select
            value={selectedMove}
            onChange={(e) => setSelectedMove(e.target.value)}
            sx={{ minWidth: 120, mt: 2 }}
          >
            <MenuItem value="rock">Rock</MenuItem>
            <MenuItem value="paper">Paper</MenuItem>
            <MenuItem value="scissors">Scissors</MenuItem>
          </Select>
          <Button variant="contained" onClick={playTurn} sx={{ mt: 2 }}>
            Play Turn
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default MatchPage;
