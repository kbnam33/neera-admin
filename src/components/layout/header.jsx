import React, { useState } from "react";
import { useGetIdentity, useLogout, useBreadcrumb } from "@refinedev/core";
import {
  AppBar,
  Avatar,
  Stack,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Box,
} from "@mui/material";
import { SignOut } from "phosphor-react";

export const Header = () => {
  const { data: user } = useGetIdentity();
  const { mutate: logout } = useLogout();
  const { breadcrumbs } = useBreadcrumb();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar color="transparent" position="sticky" elevation={0}>
      <Toolbar>
        <Stack
          direction="row"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
        >
          <Breadcrumbs aria-label="breadcrumb" sx={{ color: "text.secondary" }}>
            {breadcrumbs.map((breadcrumb, index) => (
              <Link
                key={index}
                underline="hover"
                color={index === breadcrumbs.length - 1 ? "text.primary" : "inherit"}
                href={breadcrumb.href}
                aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
                sx={{
                  textDecoration: 'none',
                  fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {breadcrumb.icon}
                  {breadcrumb.label}
                </Box>
              </Link>
            ))}
          </Breadcrumbs>

          <Stack direction="row" gap="16px" alignItems="center">
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.name}
            </Typography>
            <IconButton onClick={handleClick} size="small">
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "basic-button",
              }}
            >
              <MenuItem onClick={() => logout()} sx={{ gap: 1, color: 'text.secondary' }}>
                <SignOut size={16} /> Logout
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};