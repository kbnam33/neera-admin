import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
} from "@mui/x-data-grid";
import { useDataGrid, List } from "@refinedev/mui";
import { Edit } from "@mui/icons-material";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

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
        minWidth: 100,
        renderCell: (params) => {
          const price = params.value;
          if (price == null) {
            return ""; 
          }
          // Format the number to two decimal places, which is standard for currency
          return Number(price).toFixed(2);
        },
      },
      { field: "fabric_type", headerName: "Fabric", minWidth: 150 },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
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
    <List>
      <DataGrid
        {...dataGridProps}
        columns={columns}
        autoHeight
        slots={{
          toolbar: GridToolbar,
        }}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
      />
    </List>
  );
};