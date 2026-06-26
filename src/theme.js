import { createTheme } from '@mui/material/styles';

// Utilitarian, minimalist palette: white surfaces, gray structure, near-black for
// actions/text. No decorative color — this is a working tool, not a storefront.
const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#F7F7F5',
      paper: '#FFFFFF',
    },
    primary: {
      main: '#1F1F1F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B6B6B',
    },
    error: {
      main: '#B3261E',
    },
    divider: '#E3E3E0',
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h6: { fontWeight: 600, letterSpacing: 0.2 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
          borderBottom: '1px solid #E3E3E0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#6B6B6B',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          backgroundColor: '#FAFAF9',
        },
      },
    },
  },
});

export default theme;
