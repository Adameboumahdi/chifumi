import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Typography, Paper, Box, CircularProgress, Select, MenuItem, Alert } from '@mui/material';
import { EventSourcePolyfill } from 'event-source-polyfill';

const MatchPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [matchDetails, setMatchDetails] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [selectedMove, setSelectedMove] = useState('');
  const [gameStatus, setGameStatus] = useState('Waiting for match updates...');
  const [error, setError] = useState('');

  const fetchMatchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMatchDetails(data);
        setLoading(false);
      } else {
        setError('Failed to load match details.');
        setLoading(false);
      }
    } catch (error) {
      setError('Network error or server is down.');
      setLoading(false);
    }
  };

  const setupEventSource = () => {
    if (eventSource) {
      eventSource.close(); 
    }

    const es = new EventSourcePolyfill(`${import.meta.env.VITE_API_URL}/matches/${id}/subscribe`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleEvent(data);
    };

    es.onerror = () => {
      setError('SSE connection error, will retry...');
      es.close();
      setTimeout(setupEventSource, 5000); 
    };

    setEventSource(es);
  };

  useEffect(() => {
    fetchMatchDetails();
    setupEventSource();
    return () => eventSource && eventSource.close(); 
  }, [id]); 

  const handleEvent = (data) => {
    console.log('Event Received:', data);
    switch (data.type) {
      case 'NEW_TURN':
        setGameStatus(`It's your turn!`);
        break;
      case 'PLAYER_MOVED':
        setGameStatus(`Waiting for opponent's move...`);
        break;
      case 'TURN_ENDED':
        setGameStatus(`Turn ended. Winner: ${data.payload.winner}`);
        break;
      case 'MATCH_ENDED':
        setGameStatus(`Match ended. Winner: ${data.payload.winner}`);
        setLoading(false); // Stop loading when match ends
        break;
      default:
        setGameStatus('Update received from game.');
    }
  };

  const playTurn = async () => {
    if (!matchDetails || !matchDetails.turns.length) {
      setError("It's not currently your turn to play.");
      return;
    }

    try {
      const lastTurnId = matchDetails.turns[matchDetails.turns.length - 1]._id;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${id}/turns/${lastTurnId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move: selectedMove }),
      });
      if (!response.ok) {
        const responseData = await response.json();
        setError(responseData.message || "Failed to play turn.");
      } else {
        setGameStatus('Move submitted, waiting for next event...');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error when trying to play turn.');
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
          {error && <Alert severity="error">{error}</Alert>}
          <Typography>{gameStatus}</Typography>
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