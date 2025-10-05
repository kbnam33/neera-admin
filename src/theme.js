import { createTheme } from "@mui/material/styles";

// A sophisticated, neutral color palette
const colors = {
  primary: {
    main: "#1A202C", // A deep charcoal for primary elements
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#F9FAFB", // A very light, neutral grey for secondary backgrounds
  },
  text: {
    primary: "#1A202C",
    secondary: "#6B7280", // A standard neutral grey for secondary text
  },
  background: {
    default: "#F9FAFB",
    paper: "#FFFFFF",
  },
  grey: {
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
  },
};

export const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    text: colors.text,
    background: colors.background,
    grey: colors.grey,
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h5: {
      fontWeight: 700,
      color: colors.text.primary,
    },
    h6: {
      fontWeight: 600,
      color: colors.text.primary,
    },
    body1: {
      color: colors.text.primary,
    },
    body2: {
      color: colors.text.secondary,
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          backgroundColor: colors.primary.main,
          "&:hover": {
            backgroundColor: "#2D3748",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.06)",
          borderRadius: "12px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          borderBottom: `1px solid ${colors.grey[200]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.paper,
          borderRight: "none",
        },
      },
    },
    MuiDataGrid: {
        styleOverrides: {
            columnHeaderTitle: {
                fontWeight: 600,
                color: colors.text.secondary,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
            },
            columnHeaders: {
                backgroundColor: colors.background.default,
                borderBottom: `1px solid ${colors.grey[200]}`,
            }
        }
    }
  },
});