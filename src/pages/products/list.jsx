import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton, DeleteButton } from "@refinedev/mui";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton, Stack, Box, FormControl, InputLabel, Select } from "@mui/material";
import { MoreVert, Edit, Delete, Add, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { supabaseAdminClient } from "../../supabase";

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
      ...(hasCustomOrder && orderMode === "custom"
        ? [
            {
              field: "order_controls",
              headerName: "Order",
              minWidth: 120,
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              renderCell: (params) => {
                const rows = tableQueryResult?.data?.data || dataGridProps?.rows || [];
                const index = rows.findIndex((r) => r.id === params.row.id);
                const canMoveUp = index > 0;
                const canMoveDown = index >= 0 && index < rows.length - 1;

                const swapWith = async (targetIndex) => {
                  const current = rows[index];
                  const target = rows[targetIndex];
                  if (!current || !target) return;
                  const currentOrder = current.sort_order ?? 0;
                  const targetOrder = target.sort_order ?? 0;
                  // Swap sort_order values
                  await Promise.all([
                    supabaseAdminClient
                      .from("products")
                      .update({ sort_order: targetOrder })
                      .eq("id", current.id),
                    supabaseAdminClient
                      .from("products")
                      .update({ sort_order: currentOrder })
                      .eq("id", target.id),
                  ]);
                  // Refetch to reflect updates
                  await tableQueryResult?.refetch?.();
                };

                return (
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      disabled={!canMoveUp}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canMoveUp) swapWith(index - 1);
                      }}
                      aria-label="Move up"
                    >
                      <ArrowUpward fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={!canMoveDown}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canMoveDown) swapWith(index + 1);
                      }}
                      aria-label="Move down"
                    >
                      <ArrowDownward fontSize="inherit" />
                    </IconButton>
                  </Stack>
                );
              },
            },
          ]
        : []),
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
    </List>
  );
};