import { createTheme } from "@mui/material/styles";

// A modern, sophisticated, "warm cream" inspired palette
const colors = {
  primary: {
    main: "#0F1724", // Deep charcoal for CTAs
    contrastText: "#FFFFFF",
  },
  accent: {
    main: "#E16A2B", // Terracotta for highlights
  },
  background: {
    default: "#FBF8F6", // Warm cream page background
    paper: "#FFFFFF",   // Pure white for cards/surfaces
  },
  text: {
    primary: "#0F1724",   // Deep charcoal for primary text
    secondary: "#6B7280", // Cool gray for muted text
  },
  divider: "#F1EEEB", // Warm-tinted gray for hairlines/borders
  action: {
    hover: "rgba(0, 0, 0, 0.04)",
  }
};

export const theme = createTheme({
  palette: {
    primary: colors.primary,
    background: colors.background,
    text: colors.text,
    divider: colors.divider,
    action: colors.action,
    // Add custom accent color to the palette
    accent: {
      main: colors.accent.main,
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h5: {
      fontWeight: 600,
      fontSize: "20px",
      color: colors.text.primary,
    },
    h6: {
      fontWeight: 600,
      fontSize: "18px",
      color: colors.text.primary,
    },
    body1: {
      fontSize: "15px",
      color: colors.text.primary,
    },
    body2: {
      fontSize: "14px",
      color: colors.text.secondary,
    },
    button: {
      fontWeight: 500,
      fontSize: "14px",
    },
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "transparent",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          textTransform: "none",
          borderRadius: ownerState.variant === 'contained' ? '999px' : '8px', // Pill for primary
          boxShadow: ownerState.variant === 'contained' ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
          transition: "all 200ms ease-in-out",
          "&:hover": {
            boxShadow: ownerState.variant === 'contained' ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
            transform: "translateY(-1px)",
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          border: `1px solid ${colors.divider}`,
          borderRadius: "16px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(251, 248, 246, 0.8)', // Semi-transparent warm cream
          backdropFilter: 'blur(8px)',
          boxShadow: "none",
          borderBottom: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.default,
          borderRight: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiDataGrid: {
        styleOverrides: {
            root: {
                border: 'none',
            },
            cell: {
                borderBottom: `1px solid ${colors.divider}`,
                display: 'flex',
                alignItems: 'center', // Vertical centering for cell content
            },
            columnHeader: {
                 // This ensures vertical centering for headers
                display: 'flex',
                alignItems: 'center',
            },
            columnHeaderTitle: {
                fontWeight: 500,
                color: colors.text.secondary,
                fontSize: '13px',
                letterSpacing: '0.5px',
            },
            columnHeaders: {
                borderBottom: `1px solid ${colors.divider}`,
            },
            row: {
                transition: 'background-color 150ms ease-in-out, transform 150ms ease-in-out, box-shadow 150ms ease-in-out',
                '&:hover': {
                    backgroundColor: colors.background.default,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                },
            },
        }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: `1px solid ${colors.divider}`,
        }
      }
    }
  },
});