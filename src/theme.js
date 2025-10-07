import { createTheme } from "@mui/material/styles";

// A new, sophisticated theme inspired by natural, earthy greens
const colors = {
  primary: {
    main: "#344E41",       // A deep, muted green for primary actions
    light: "#3A5A40",      // A slightly lighter, more vibrant green for hover
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#588157",       // A softer, earthy green for secondary button borders/text
    light: "rgba(88, 129, 87, 0.05)", // A very light tint for hover backgrounds
    contrastText: "#344E41",
  },
  text: {
    primary: "#1A202C",
    secondary: "#4A5568",
  },
  background: {
    default: "#FBF8F6",
    paper: "#FFFFFF",
  },
  divider: "#E2E8F0",
  action: {
    hover: "rgba(52, 78, 65, 0.04)",
  },
  success: {
    main: '#2F855A',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#C53030',
    contrastText: '#FFFFFF',
  },
  destructive: {
    main: '#C53030',
    light: 'rgba(197, 48, 48, 0.08)',
  }
};

export const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    divider: colors.divider,
    action: colors.action,
    success: colors.success,
    error: colors.error,
    destructive: colors.destructive,
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h5: { fontWeight: 600, fontSize: "20px", color: colors.text.primary },
    h6: { fontWeight: 600, fontSize: "18px", color: colors.text.primary },
    body1: { fontSize: "15px", color: colors.text.primary },
    body2: { fontSize: "14px", color: colors.text.secondary },
    button: { fontWeight: 500, fontSize: "14px", letterSpacing: "0.2px" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "10px",
          transition: "all 200ms ease-in-out",
          boxShadow: 'none',
        },
        // Primary Button: Dark green, tactile, with an inset shadow
        containedPrimary: {
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
            '&:hover': {
                transform: "translateY(-2px)",
                backgroundColor: colors.primary.light,
                boxShadow: '0 10px 20px rgba(52, 78, 65, 0.2)',
            },
            '&:active': {
                transform: "translateY(0)",
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            }
        },
        // Secondary Button: Outlined with green tones, fills on hover
        outlined: {
            '&.MuiButton-outlinedSecondary': {
                borderColor: colors.secondary.main,
                color: colors.secondary.main,
                '&:hover': {
                    backgroundColor: colors.secondary.light,
                    borderColor: colors.primary.main,
                },
            }
        },
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
          backgroundColor: 'rgba(251, 248, 246, 0.8)',
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
                alignItems: 'center',
                color: colors.text.primary,
            },
            columnHeader: {
                display: 'flex',
                alignItems: 'center',
            },
            columnHeaderTitle: {
                fontWeight: 600,
                color: colors.text.secondary,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
            },
            columnHeaders: {
                borderBottom: `2px solid ${colors.divider}`,
            },
            row: {
                transition: 'background-color 150ms ease-in-out, transform 150ms ease-in-out, box-shadow 150ms ease-in-out',
                '&:hover': {
                    backgroundColor: colors.background.default,
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
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          border: '1px solid',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        },
        standardError: {
          backgroundColor: colors.background.paper,
          color: colors.error.main,
          borderColor: colors.error.main,
          '& .MuiAlert-icon': {
            color: colors.error.main,
          }
        },
        standardSuccess: {
          backgroundColor: colors.background.paper,
          color: colors.success.main,
          borderColor: colors.success.main,
          '& .MuiAlert-icon': {
            color: colors.success.main,
          }
        }
      }
    }
  },
});