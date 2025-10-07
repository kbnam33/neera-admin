import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton } from "@refinedev/mui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton } from "@mui/material";
import { MoreVert, Edit, Add } from "@mui/icons-material";

export const FabricList = () => {
  const { dataGridProps } = useDataGrid({
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
          <div>
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
                <Edit sx={{ mr: 1, fontSize: '1rem' }} />
                Edit
              </MenuItem>
            </Menu>
          </div>
        ),
      },
    ],
    [navigate, anchorEl, open, currentRowId]
  );

  return (
    <List
      title=""
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
            <DataGrid {...dataGridProps} columns={columns} autoHeight />
        </Paper>
    </List>
  );
};