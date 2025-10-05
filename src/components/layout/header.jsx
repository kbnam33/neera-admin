import React from "react";
import { useGetIdentity } from "@refinedev/core";
import { AppBar, Avatar, Stack, Toolbar, Typography } from "@mui/material";

export const Header = () => {
  const { data: user } = useGetIdentity();

  return (
    <AppBar color="transparent" position="sticky" elevation={0}>
      <Toolbar>
        <Stack
          direction="row"
          width="100%"
          justifyContent="flex-end"
          alignItems="center"
        >
          <Stack direction="row" gap="16px" alignItems="center">
            {user?.avatar && <Avatar src={user.avatar} alt={user?.name} />}
            {user?.name && (
                <Typography variant="subtitle2" fontWeight={600}>{user.name}</Typography>
            )}
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};