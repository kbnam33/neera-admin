import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton, DeleteButton } from "@refinedev/mui";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton, Stack, Box, Button } from "@mui/material";
import { MoreVert, Edit, Delete, Add, ArrowDropDown } from "@mui/icons-material";
import { useNotification } from "@refinedev/core";
import { supabaseAdminClient } from "../../supabase";

export const FabricList = () => {
  const { dataGridProps, setSorters, tableQueryResult } = useDataGrid({
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
      permanent: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
  });
  const navigate = useNavigate();
  const { open: openNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
  const [fabricVisibilityColumn, setFabricVisibilityColumn] = useState(null); // "is_public" | "visibility" | null
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState(null);
  const [visibilityAnchorEl, setVisibilityAnchorEl] = useState(null);
  const [currentVisibilityRowId, setCurrentVisibilityRowId] = useState(null);
  const open = Boolean(anchorEl);

  // Controlled sort model for DataGrid to prevent sort reset on data refetch
  const sortModel = useMemo(() => {
    return [{ field: "id", sort: "desc" }];
  }, []);

  // Force re-apply sorting after data refetch to maintain order consistency
  useEffect(() => {
    if (tableQueryResult?.isFetching === false && tableQueryResult?.data) {
      setSorters([{ field: "id", order: "desc" }]);
    }
  }, [tableQueryResult?.isFetching, tableQueryResult?.data, setSorters]);

  useEffect(() => {
    let isMounted = true;
    const detectVisibilityColumn = async () => {
      const isPublicCheck = await supabaseAdminClient.from("fabrics").select("is_public").limit(1);
      if (!isPublicCheck.error) {
        if (isMounted) setFabricVisibilityColumn("is_public");
        return;
      }

      const visibilityCheck = await supabaseAdminClient.from("fabrics").select("visibility").limit(1);
      if (!visibilityCheck.error && isMounted) {
        setFabricVisibilityColumn("visibility");
      }
    };

    detectVisibilityColumn();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClick = (event, id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setCurrentRowId(id);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setCurrentRowId(null);
  };

  const handleVisibilityMenuOpen = (event, id) => {
    event.stopPropagation();
    setVisibilityAnchorEl(event.currentTarget);
    setCurrentVisibilityRowId(id);
  };

  const handleVisibilityMenuClose = () => {
    setVisibilityAnchorEl(null);
    setCurrentVisibilityRowId(null);
  };

  const getFabricIsPublic = (row) => {
    if (fabricVisibilityColumn === "is_public") return row?.is_public !== false;
    if (fabricVisibilityColumn === "visibility") return row?.visibility !== "private";
    return true;
  };

  const handleSetFabricVisibility = async (id, isPublic) => {
    if (!fabricVisibilityColumn) return;

    setUpdatingVisibilityId(id);
    try {
      const payload =
        fabricVisibilityColumn === "is_public"
          ? { is_public: isPublic }
          : { visibility: isPublic ? "public" : "private" };

      const { error } = await supabaseAdminClient
        .from("fabrics")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      await tableQueryResult?.refetch?.();
      openNotification?.({
        type: "success",
        message: `Fabric set to ${isPublic ? "Public" : "Private"}`,
      });
    } catch (error) {
      console.error("Failed to update fabric visibility:", error);
      openNotification?.({
        type: "error",
        message: "Fabric visibility update failed",
        description: error?.message,
      });
    } finally {
      setUpdatingVisibilityId(null);
      handleClose();
      handleVisibilityMenuClose();
    }
  };

  const columns = useMemo(
    () => {
      const baseColumns = [
      { field: "id", headerName: "ID", minWidth: 50 },
      {
        field: "name",
        headerName: "Fabric Name",
        minWidth: 200,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body1" fontWeight={500}>{params.value}</Typography>
        )
      },
      ...(fabricVisibilityColumn
        ? [
            {
              field: "fabric_visibility",
              headerName: "Visibility",
              minWidth: 140,
              align: "center",
              headerAlign: "center",
              sortable: false,
              renderCell: (params) => {
                const isPublic = getFabricIsPublic(params.row);
                return (
                  <Box onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant={isPublic ? "contained" : "outlined"}
                      endIcon={<ArrowDropDown sx={{ fontSize: "1rem" }} />}
                      onClick={(e) => handleVisibilityMenuOpen(e, params.row.id)}
                      disabled={updatingVisibilityId === params.row.id}
                      sx={(theme) => ({
                        minWidth: 96,
                        textTransform: "none",
                        borderRadius: 999,
                        px: 1.5,
                        fontWeight: 600,
                        ...(isPublic
                          ? {
                              backgroundColor: theme.palette.success.main,
                              color: theme.palette.success.contrastText,
                              "&:hover": {
                                backgroundColor: theme.palette.success.dark,
                              },
                            }
                          : {
                              color: theme.palette.error.main,
                              borderColor: theme.palette.error.main,
                              backgroundColor: theme.palette.error.lighter,
                              "&:hover": {
                                borderColor: theme.palette.error.dark,
                                backgroundColor: theme.palette.error.light,
                              },
                            }),
                      })}
                    >
                      {isPublic ? "Public" : "Private"}
                    </Button>
                    <Menu
                      anchorEl={visibilityAnchorEl}
                      open={Boolean(visibilityAnchorEl) && currentVisibilityRowId === params.row.id}
                      onClose={handleVisibilityMenuClose}
                    >
                      <MenuItem
                        onClick={() => handleSetFabricVisibility(params.row.id, true)}
                        disabled={isPublic || updatingVisibilityId === params.row.id}
                      >
                        Set Public
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleSetFabricVisibility(params.row.id, false)}
                        disabled={!isPublic || updatingVisibilityId === params.row.id}
                      >
                        Set Private
                      </MenuItem>
                    </Menu>
                  </Box>
                );
              },
            },
          ]
        : []),
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => {
          const { id, row } = params;
          const isPublic = getFabricIsPublic(row);
          return (
          <Box onClick={(e) => e.stopPropagation()}>
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={(e) => handleClick(e, id)}
            >
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open && currentRowId === id}
              onClose={handleClose}
            >
              <MenuItem
                onClick={() => {
                  navigate(`/fabrics/edit/${id}`);
                  handleClose();
                }}
              >
                <Stack direction="row" alignItems="center" gap={1}>
                  <Edit sx={{ fontSize: '1.125rem', color: 'text.secondary' }} />
                  Edit
                </Stack>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  document.getElementById(`delete-button-${id}`)?.click();
                  handleClose();
                }}
                sx={(theme) => ({
                    color: theme.palette.destructive.main,
                    '&:hover': {
                        backgroundColor: 'rgba(229, 115, 115, 0.08)'
                    }
                })}
              >
                 <Stack direction="row" alignItems="center" gap={1}>
                  <Delete sx={{ fontSize: '1.125rem' }} />
                  Delete
                </Stack>
              </MenuItem>
            </Menu>
             <Box sx={{display: 'none'}}>
                <DeleteButton
                    recordItemId={id}
                    id={`delete-button-${id}`}
                />
             </Box>
          </Box>
        );
        },
      },
    ];
      return baseColumns;
    },
    [navigate, anchorEl, open, currentRowId, fabricVisibilityColumn, updatingVisibilityId, tableQueryResult, openNotification]
  );

  return (
    <List
        headerButtons={
          <CreateButton
            variant="contained"
            startIcon={<Add />}
          >
            Add Fabric
          </CreateButton>
        }
    >
        <Paper sx={{
            height: '75vh',
            width: '100%',
        }}>
            <DataGrid
              {...dataGridProps}
              columns={columns}
              sortModel={sortModel}
              sortingMode="server"
              rowHeight={72}
              disableRowSelectionOnClick
              onRowClick={(params) => navigate(`/fabrics/edit/${params.id}`)}
            />
        </Paper>
    </List>
  );
};