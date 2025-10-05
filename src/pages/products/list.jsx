import {
  DataGrid,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton } from "@refinedev/mui";
import { Edit } from "@mui/icons-material";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography } from "@mui/material";

export const ProductList = () => {
  const { dataGridProps } = useDataGrid();
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", minWidth: 50 },
      { field: "name", headerName: "Name", minWidth: 200, flex: 1 },
      {
        field: "price",
        headerName: "Price (in ₹)",
        minWidth: 120,
        renderCell: (params) => {
          const price = params.value;
          if (price == null) {
            return "—"; 
          }
          return Number(price).toFixed(2);
        },
      },
      { field: "fabric_type", headerName: "Fabric", minWidth: 150 },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        width: 80,
        getActions: ({ id }) => [
          <GridActionsCellItem
            key="edit"
            icon={<Edit />}
            label="Edit"
            onClick={() => navigate(`/products/edit/${id}`)}
          />,
        ],
      },
    ],
    [navigate]
  );

  return (
    <List 
        title={<Typography variant="h5">Products</Typography>}
        headerButtons={<CreateButton sx={{ textTransform: 'none', borderRadius: '8px' }} />}
    >
        <Paper sx={{
            height: '75vh',
            width: '100%',
        }}>
            <DataGrid
            {...dataGridProps}
            columns={columns}
            slots={{}}
            initialState={{
                pagination: {
                paginationModel: {
                    pageSize: 10,
                },
                },
            }}
            pageSizeOptions={[10, 25, 50]}
            sx={{
                border: 'none',
            }}
            />
        </Paper>
    </List>
  );
};