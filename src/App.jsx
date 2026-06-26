import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Box,
  ThemeProvider,
  CssBaseline,
  Button,
} from '@mui/material';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import theme from './theme';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import Login from './Login';

export default function App() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const handleProductAdded = () => setRefreshSignal((prev) => prev + 1);

  const checkAuth = async () => {
    setCheckingAuth(true);
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const payload = await response.json();
        setAuthenticated(payload?.authenticated === true);
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (checkingAuth) {
    return null;
  }

  if (!authenticated) {
    return <Login onSuccess={checkAuth} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <SpaOutlinedIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dewy Daze — Admin
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Product Management
          </Typography>
          <Button
            color="inherit"
            size="small"
            onClick={async () => {
              await fetch('/api/logout', { method: 'POST' });
              setAuthenticated(false);
            }}
            sx={{ ml: 2 }}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid item xs={12} lg={5}>
              <ProductForm onProductAdded={handleProductAdded} />
            </Grid>
            <Grid item xs={12} lg={7}>
              <ProductList refreshSignal={refreshSignal} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
