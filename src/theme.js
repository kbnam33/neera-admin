import { createTheme } from "@mui/material/styles";

// A sophisticated neutral theme with a warm cream background
const colors = {
  primary: {
    main: "#2D3748",       // Charcoal for primary actions
    light: "#4A5568",      // A slightly lighter charcoal for hover
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#718096",       // Medium-light grey for secondary button borders/text
    light: "#EDF2F7",      // Very light grey for hover backgrounds
    contrastText: "#2D3748",
  },
  text: {
    primary: "#1A202C",
    secondary: "#718096",
  },
  background: {
    default: "#FBF8F6",    // Warm cream background
    paper: "#FFFFFF",
  },
  divider: "#E2E8F0",
  action: {
    hover: "rgba(237, 242, 247, 0.8)", // Slightly more opaque hover for list items etc.
  },
  success: {
    main: '#38A169',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#E53E3E',
    contrastText: '#FFFFFF',
  },
  destructive: {
    main: '#E53E3E',
    light: 'rgba(229, 62, 62, 0.08)',
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
    button: { fontWeight: 500, fontSize: "14px", letterSpacing: "0.2px", padding: '8px 20px' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          boxShadow: 'none',
          transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          '&:hover': {
            transform: "translateY(-2px)",
            boxShadow: 'none',
          },
          '&:active': {
            transform: "translateY(0)",
          }
        },
        // Outlined primary buttons (Save)
        containedPrimary: {
           backgroundColor: 'transparent',
           color: colors.primary.main,
           border: `1.5px solid ${colors.primary.main}`,
           '&:hover': {
             backgroundColor: colors.secondary.light,
             borderColor: colors.primary.light,
             color: colors.primary.light,
           }
        },
        // Contained primary buttons (Login)
        contained: {
          backgroundColor: colors.primary.main,
          '&:hover': {
             backgroundColor: colors.primary.light,
          }
        },
        // Outlined secondary buttons (Upload, Add)
        outlinedSecondary: {
            backgroundColor: colors.primary.main,
            borderColor: colors.primary.main,
            color: colors.primary.contrastText,
           '&:hover': {
              backgroundColor: colors.primary.light,
              borderColor: colors.primary.light,
           },
        },
        // Delete Button
        outlinedError: {
           borderColor: colors.destructive.main,
           color: colors.destructive.main,
           '&:hover': {
             backgroundColor: colors.destructive.light,
             borderColor: colors.destructive.main,
           }
        }
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
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
          boxShadow: 'none',
        },
        standardError: {
          backgroundColor: colors.background.paper,
          color: colors.error.main,
          borderColor: 'rgba(229, 62, 62, 0.5)',
          '& .MuiAlert-icon': {
            color: colors.error.main,
          }
        },
        standardSuccess: {
          backgroundColor: colors.background.paper,
          color: colors.success.main,
          borderColor: 'rgba(56, 161, 105, 0.5)',
          '& .MuiAlert-icon': {
            color: colors.success.main,
          }
        }
      }
    }
  },
});

