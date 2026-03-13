import { useState, useEffect } from "react";
import { List } from "@refinedev/mui";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Typography, Box, Chip, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabaseAdminClient } from "../../supabase";
import { useNotification } from "@refinedev/core";

export const ProductsByFabricList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { open: openNotification } = useNotification();

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      setLoading(true);
      try {
        const { data: fabrics, error: fabricsError } = await supabaseAdminClient
          .from("fabrics")
          .select("id, name")
          .order("name", { ascending: true });

        if (fabricsError) throw fabricsError;

        const counts = await Promise.all(
          (fabrics || []).map(async (fabric) => {
            const { count, error } = await supabaseAdminClient
              .from("products")
              .select("id", { count: "exact", head: true })
              .eq("fabric_type", fabric.name);

            if (error) return { fabric, count: 0 };
            return { fabric, count: count ?? 0 };
          })
        );

        if (isMounted) {
          setRows(
            counts.map(({ fabric, count }) => ({
              id: fabric.id,
              fabric_name: fabric.name,
              product_count: count,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching products by fabric:", err);
        if (isMounted) {
          openNotification?.({
            type: "error",
            message: "Failed to load data",
            description: err.message,
          });
          setRows([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetch();
    return () => {
      isMounted = false;
    };
  }, [openNotification]);

  const columns = [
    {
      field: "fabric_name",
      headerName: "Fabric Type",
      minWidth: 220,
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body1" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "product_count",
      headerName: "Total Products",
      minWidth: 160,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value > 0 ? "primary" : "default"}
          variant="outlined"
          size="medium"
        />
      ),
    },
    {
      field: "view_products",
      headerName: " ",
      sortable: false,
      minWidth: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.row.product_count > 0 ? (
          <Typography
            component="button"
            variant="body2"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products?fabric=${encodeURIComponent(params.row.fabric_name)}`);
            }}
            sx={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "primary.main",
              textDecoration: "underline",
              "&:hover": { color: "primary.dark" },
            }}
          >
            View products
          </Typography>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <List
      title={<Typography variant="h5">Products by Fabric</Typography>}
      breadcrumb={null}
    >
      <Paper sx={{ height: "75vh", width: "100%" }}>
        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            minHeight={320}
          >
            <CircularProgress size={48} />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            rowHeight={64}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
              sorting: { sortModel: [{ field: "product_count", sort: "desc" }] },
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        )}
      </Paper>
    </List>
  );
};
