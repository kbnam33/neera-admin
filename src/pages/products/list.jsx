import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton, DeleteButton } from "@refinedev/mui";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton, Stack, Box, FormControl, InputLabel, Select, Button } from "@mui/material";
import { MoreVert, Edit, Delete, Add } from "@mui/icons-material";
import { supabaseAdminClient } from "../../supabase";
import { ProductReorderDialog } from "../../components/ProductReorderDialog";

export const ProductList = () => {
  const { dataGridProps, setSorters, tableQueryResult } = useDataGrid({
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
    pagination: { mode: "off" },
  });

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
  const open = Boolean(anchorEl);
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  const [orderMode, setOrderMode] = useState("created_desc"); // "custom" | "created_desc" | "name_asc"
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  // Detect if `sort_order` column exists to enable custom ordering
  useEffect(() => {
    let isMounted = true;
    const checkCustomOrder = async () => {
      try {
        const { error } = await supabaseAdminClient
          .from("products")
          .select("sort_order")
          .limit(1);
        if (isMounted) {
          setHasCustomOrder(!error);
          if (!error) {
            // Prefer custom order if available
            setOrderMode("custom");
            setSorters([
              { field: "sort_order", order: "asc" },
              { field: "created_at", order: "desc" },
            ]);
          }
        }
      } catch {
        if (isMounted) setHasCustomOrder(false);
      }
    };
    checkCustomOrder();
    return () => {
      isMounted = false;
    };
  }, [setSorters]);

  const handleOrderModeChange = (e) => {
    const value = e.target.value;
    setOrderMode(value);
    if (value === "custom" && hasCustomOrder) {
      setSorters([
        { field: "sort_order", order: "asc" },
        { field: "created_at", order: "desc" },
      ]);
    } else if (value === "name_asc") {
      setSorters([{ field: "name", order: "asc" }]);
    } else {
      setSorters([{ field: "created_at", order: "desc" }]);
    }
  };

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
          <Stack direction="row" spacing={2} alignItems="center">
            {hasCustomOrder && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="order-mode-label">Order By</InputLabel>
                <Select
                  labelId="order-mode-label"
                  value={orderMode}
                  label="Order By"
                  onChange={handleOrderModeChange}
                >
                  <MenuItem value="created_desc">Newest first</MenuItem>
                  <MenuItem value="name_asc">Name (A–Z)</MenuItem>
                  <MenuItem value="custom">Custom order</MenuItem>
                </Select>
              </FormControl>
            )}
            {hasCustomOrder && orderMode === "custom" && (
              <Button variant="contained" color="primary" onClick={() => setIsReorderOpen(true)}>
                Reorder
              </Button>
            )}
            <CreateButton
              variant="outlined"
              color="secondary"
              startIcon={<Add />}
            >
              Add Product
            </CreateButton>
          </Stack>
        }
    >
        {/* --- Search Bar Paper component removed --- */}

        {/* --- Data Grid --- */}
        <Paper sx={{
            height: '75vh',
            width: '100%',
        }}>
            <DataGrid
              {...dataGridProps}
              columns={columns}
              rowHeight={72} 
              disableRowSelectionOnClick
              onRowClick={(params) => navigate(`/products/edit/${params.id}`)}
            />
        </Paper>
        {hasCustomOrder && (
          <ProductReorderDialog
            open={isReorderOpen}
            onClose={async (changed) => {
              setIsReorderOpen(false);
              if (changed) {
                await tableQueryResult?.refetch?.();
              }
            }}
          />
        )}
    </List>
  );
};