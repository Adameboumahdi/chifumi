import React, { useState, useEffect } from 'react';
import { Button, List, ListItem, ListItemText, Typography, CircularProgress, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/matches`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, 
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMatches(data);
        } else {
          setError('Failed to load matches.');
        }
      } catch (error) {
        setError('Network error or server is down.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleCreateMatch = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, 
        },
      });
      if (response.ok) {
        const newMatch = await response.json();
        setMatches([...matches, newMatch]);
      } else {
        setError('Failed to create a new match.');
      }
    } catch (error) {
      setError('Network error or server is down.');
    }
  };

  const handleJoinMatch = (matchId) => {
    navigate(`/partie/${matchId}`);
  };

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard - Chi Fou Mi Game
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <div>
          <Button variant="contained" color="primary" onClick={handleCreateMatch} sx={{ mb: 2 }}>
            Create Match
          </Button>
          <List>
            {matches.map((match) => (
              <ListItem key={match._id} button onClick={() => handleJoinMatch(match._id)}>
                <ListItemText
                  primary={`Match ID: ${match._id}`}
                  secondary={match.user2 ? `Player 2: ${match.user2.username}` : 'Waiting for Player 2'}
                />
              </ListItem>
            ))}
          </List>
          {error && <Typography color="error">{error}</Typography>}
        </div>
      )}
    </Paper>
  );
};

export default DashboardPage;
