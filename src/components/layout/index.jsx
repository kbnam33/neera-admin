import React from "react";
import { Box } from "@mui/material";
import { Header } from "./header";
import { Sider } from "./sider";

const SIDER_WIDTH = 220; // Adjusted sidebar width

export const Layout = ({ children }) => {
  return (
    <Box display="flex" minHeight="100vh">
      <Sider drawerWidth={SIDER_WIDTH} />
      <Box
        display="flex"
        flexDirection="column"
        sx={{
          flex: 1,
          ml: `${SIDER_WIDTH}px`,
          width: `calc(100% - ${SIDER_WIDTH}px)`,
        }}
      >
        <Header />
        <Box
          component="main"
          sx={{
            p: 4,
            flexGrow: 1,
            backgroundColor: 'background.default',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};