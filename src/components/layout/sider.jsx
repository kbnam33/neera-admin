import { useLink, useLogout, useMenu } from "@refinedev/core";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { List as ListIcon, SignOut } from "phosphor-react";

export const Sider = ({ drawerWidth = 220 }) => {
  const { menuItems, selectedKey } = useMenu();
  const { mutate: logout } = useLogout();
  const Link = useLink();

  return (
    <Drawer
      variant="permanent"
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "'Playfair Display', serif"}}>
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
                  '& .MuiListItemIcon-root': {
                    color: 'text.secondary',
                  },
                  '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 600,
                      },
                      '&:hover': {
                        backgroundColor: '#2D3748',
                      }
                  },
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>{icon || <ListIcon />}</ListItemIcon>
              <ListItemText 
                primary={label || name} 
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 2 }}>
        <ListItemButton
            onClick={() => logout()}
            sx={{ borderRadius: '8px' }}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <SignOut />
            </ListItemIcon>
            <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};