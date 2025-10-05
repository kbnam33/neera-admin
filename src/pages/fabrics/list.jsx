import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
} from "@mui/x-data-grid";
import { useDataGrid, List } from "@refinedev/mui";
import { Edit } from "@mui/icons-material";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export const FabricList = () => {
  const { dataGridProps } = useDataGrid();
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", minWidth: 50 },
      { field: "name", headerName: "Fabric Name", minWidth: 200, flex: 1 },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        getActions: ({ id }) => [
          <GridActionsCellItem
            key="edit"
            icon={<Edit />}
            label="Edit"
            onClick={() => navigate(`/fabrics/edit/${id}`)}
          />,
        ],
      },
    ],
    [navigate]
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  );
};