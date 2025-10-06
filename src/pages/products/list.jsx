import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton, DeleteButton } from "@refinedev/mui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton, Stack, Box } from "@mui/material";
import { MoreVert, Edit, Delete } from "@mui/icons-material";
import { Add } from '@mui/icons-material';


export const ProductList = () => {
  const { dataGridProps, deleteButtonProps } = useDataGrid();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
  const open = Boolean(anchorEl);

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
      { field: "id", headerName: "ID", minWidth: 50, align: "left", headerAlign: "left" },
      {
        field: "name",
        headerName: "Name",
        minWidth: 200,
        flex: 1,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Typography variant="body1" fontWeight={500}>{params.value}</Typography>
        )
      },
      {
        field: "price",
        headerName: "Price (in ₹)",
        minWidth: 120,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => {
          const price = params.value;
          if (price == null) {
            return "—";
          }
          return Number(price).toFixed(2);
        },
      },
      { field: "fabric_type", headerName: "Fabric", minWidth: 150, align: "left", headerAlign: "left" },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        width: 80,
        align: "center",
        headerAlign: "center",
        renderCell: ({ id }) => (
          <Box onClick={(e) => e.stopPropagation()}>
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={(e) => handleClick(e, id)}
              sx={{
                borderRadius: '50%',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
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
                  navigate(`/products/edit/${id}`);
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
                  // This allows the DeleteButton's confirmation to work
                  // while keeping the item within the menu structure
                  document.getElementById(`delete-button-${id}`)?.click();
                  handleClose();
                }}
                sx={{color: 'error.main'}}
              >
                 <Stack direction="row" alignItems="center" gap={1}>
                  <Delete sx={{ fontSize: '1.125rem' }} />
                  Delete
                </Stack>
              </MenuItem>
            </Menu>
             {/* Hidden DeleteButton to handle confirmation logic */}
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
    [navigate, anchorEl, open, currentRowId, deleteButtonProps]
  );

  return (
    <List
        title={<Typography variant="h5">Products</Typography>}
        headerButtons={
          <CreateButton
            variant="contained"
            startIcon={<Add />}
          >
            Add Product
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
              autoHeight
              disableRowSelectionOnClick
              onRowClick={(params) => navigate(`/products/edit/${params.id}`)}
              sx={{
                '& .MuiDataGrid-cell': {
                  py: '22px' // Increased vertical padding
                }
              }}
            />
        </Paper>
    </List>
  );
};

