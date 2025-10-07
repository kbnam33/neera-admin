import { useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  useDataGrid,
  List,
  CreateButton,
  EditButton,
  DeleteButton,
} from "@refinedev/mui";

import {
  Box,
  Typography,
  Paper,
} from "@mui/material";

export const FabricList = () => {
  const { dataGridProps } = useDataGrid();

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", minWidth: 50 },
      {
        field: "name",
        headerName: "Fabric Name",
        minWidth: 200,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body1" fontWeight={500}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        minWidth: 250,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => (
          <Box>
            <EditButton recordItemId={params.id} />
            <DeleteButton recordItemId={params.id} />
          </Box>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <List
        headerButtons={
          <CreateButton variant="contained">Add Fabric</CreateButton>
        }
      >
        <Paper
          sx={{
            height: "75vh",
            width: "100%",
          }}
        >
          <DataGrid {...dataGridProps} columns={columns} autoHeight />
        </Paper>
      </List>
    </>
  );
};

