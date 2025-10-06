import { useDataGrid, List, ShowButton } from "@refinedev/mui";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Typography, IconButton, Menu, MenuItem, Box, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { MoreVert, Visibility } from "@mui/icons-material";

export const CustomerList = () => {
  const { dataGridProps } = useDataGrid({ 
    resource: "customers",
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
   });
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
      { field: "email", headerName: "Email", minWidth: 250, flex: 1 },
      { field: "name", headerName: "Name", minWidth: 180, flex: 1 },
      { 
        field: "total_orders", 
        headerName: "Total Orders", 
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: "total_spent",
        headerName: "Total Spent (₹)",
        minWidth: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => Number(params.value || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2, maximumFractionDigits: 2,
        }),
      },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box>
            <IconButton onClick={(e) => handleClick(e, row.id)}>
              <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open && currentRowId === row.id} onClose={handleClose}>
              <MenuItem onClick={() => { navigate(`/customers/show/${row.id}`); handleClose(); }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Visibility sx={{ fontSize: '1.125rem', color: 'text.secondary' }} />
                  View Details
                </Stack>
              </MenuItem>
            </Menu>
          </Box>
        ),
      },
    ],
    [navigate, anchorEl, open, currentRowId]
  );

  return (
    <List title={<Typography variant="h5">Customers</Typography>} breadcrumb={null}>
      <Paper sx={{ height: '75vh', width: '100%' }}>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/customers/show/${params.id}`)}
          sx={{ '& .MuiDataGrid-cell': { py: '16px' } }}
        />
      </Paper>
    </List>
  );
};