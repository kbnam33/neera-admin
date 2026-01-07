import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton, DeleteButton } from "@refinedev/mui";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton, Stack, Box } from "@mui/material";
import { MoreVert, Edit, Delete, Add } from "@mui/icons-material";

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
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
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

  const handleClick = (event, id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setCurrentRowId(id);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setCurrentRowId(null);
  };

  const columns = useMemo(
    () => [
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
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ id }) => (
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
        ),
      },
    ],
    [navigate, anchorEl, open, currentRowId]
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