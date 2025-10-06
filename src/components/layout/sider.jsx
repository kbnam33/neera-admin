import { useLink, useMenu } from "@refinedev/core";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

export const Sider = ({ drawerWidth = 220 }) => {
  const { menuItems, selectedKey } = useMenu();
  const Link = useLink();

  return (
    <Drawer
      variant="permanent"
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '65px' }}>
        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "'Playfair Display', serif'"}}>
          Neera Admin
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, pt: 2 }}>
        <List sx={{ p: 0 }}>
          {menuItems.map(({ name, label, icon, route }) => (
            <ListItemButton
              key={name}
              component={Link}
              to={route}
              selected={selectedKey === route}
              sx={{
                  margin: '0 16px 8px 16px',
                  borderRadius: '8px',
                  py: 1.25,
                  color: 'text.secondary',
                  position: 'relative',
                  '& .MuiListItemIcon-root': {
                    minWidth: '40px',
                    color: 'text.secondary',
                  },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: selectedKey === route ? '20px' : '0px',
                    width: '3px',
                    backgroundColor: 'primary.main',
                    borderRadius: '0 3px 3px 0',
                    transition: 'height 0.2s ease-in-out',
                  },
                  '&.Mui-selected': {
                      backgroundColor: 'action.hover',
                      color: 'text.primary',
                      '& .MuiListItemIcon-root': {
                          color: 'text.primary',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 600,
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                  },
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText 
                primary={label || name} 
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};