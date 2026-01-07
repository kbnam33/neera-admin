import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton, DeleteButton } from "@refinedev/mui";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton, Stack, Box, FormControl, InputLabel, Select, Button } from "@mui/material";
import { MoreVert, Edit, Delete, Add } from "@mui/icons-material";
import { supabaseAdminClient } from "../../supabase";
import { ProductReorderDialog } from "../../components/ProductReorderDialog";
import { useList } from "@refinedev/core";

export const ProductList = () => {
  const FABRIC_FILTER_STORAGE_KEY = "productFabricFilter";
  const ORDER_MODE_STORAGE_KEY = "productOrderMode";
  const DEFAULT_ORDER_MODE = "id_desc"; // "custom" | "name_asc" | "id_desc"
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  
  const { dataGridProps, setSorters, tableQueryResult } = useDataGrid({
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
      permanent: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
    pagination: { mode: "off" },
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
  const open = Boolean(anchorEl);
  const normalizeOrderMode = (value) => {
    if (!value) return DEFAULT_ORDER_MODE;
    if (value === "created_desc") return DEFAULT_ORDER_MODE; // backward compat
    const allowed = ["custom", "name_asc", "id_desc"];
    return allowed.includes(value) ? value : DEFAULT_ORDER_MODE;
  };

  const persistOrderMode = (value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ORDER_MODE_STORAGE_KEY, value);
    const nextParams = new URLSearchParams(window.location.search);
    if (value && value !== DEFAULT_ORDER_MODE) {
      nextParams.set("order", value);
    } else {
      nextParams.delete("order");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const [orderMode, setOrderMode] = useState(() => {
    const paramValue = normalizeOrderMode(searchParams.get("order"));
    if (paramValue) return paramValue;
    if (typeof window !== "undefined") {
      return normalizeOrderMode(window.localStorage.getItem(ORDER_MODE_STORAGE_KEY));
    }
    return DEFAULT_ORDER_MODE;
  });
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState(() => {
    const paramValue = searchParams.get("fabric");
    if (paramValue !== null) return paramValue;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(FABRIC_FILTER_STORAGE_KEY) || "";
    }
    return "";
  });

  // Controlled sort model for DataGrid to prevent sort reset on data refetch
  const sortModel = useMemo(() => {
    let effectiveMode = orderMode;
    if (orderMode === "custom" && !hasCustomOrder) {
      effectiveMode = DEFAULT_ORDER_MODE;
    }

    if (effectiveMode === "custom") {
      return [
        { field: "sort_order", sort: "asc" },
        { field: "id", sort: "desc" },
      ];
    } else if (effectiveMode === "name_asc") {
      return [{ field: "name", sort: "asc" }];
    } else {
      return [{ field: "id", sort: "desc" }];
    }
  }, [orderMode, hasCustomOrder]);

  // Load fabrics for filter dropdown
  const { data: fabricsResponse } = useList({
    resource: "fabrics",
    pagination: { mode: "off" },
    sorters: [{ field: "name", order: "asc" }],
    meta: { select: "id,name" },
  });
  const fabrics = fabricsResponse?.data || [];

  // If URL contains legacy filters query (from earlier version), clean it once to prevent DataGrid warnings
  useEffect(() => {
    if (location.search && location.search.includes("filters[")) {
      navigate("/products", { replace: true });
    }
  }, [location.search, navigate]);

  // Keep selected fabric in sync with URL changes (e.g., browser back)
  useEffect(() => {
    const fabricParam = searchParams.get("fabric");
    if (fabricParam !== null && fabricParam !== selectedFabric) {
      setSelectedFabric(fabricParam);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(FABRIC_FILTER_STORAGE_KEY, fabricParam);
      }
    }
  }, [searchParams, selectedFabric]);

  // Keep order mode in sync with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const orderParamRaw = searchParams.get("order");
    const normalized = normalizeOrderMode(orderParamRaw);
    if (normalized !== orderMode) {
      setOrderMode(normalized);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ORDER_MODE_STORAGE_KEY, normalized);
      }
    }
  }, [searchParams, orderMode]);

  // Apply sorting based on order mode and persist it - runs on mount and when order changes
  useEffect(() => {
    let effectiveMode = orderMode;
    if (orderMode === "custom" && !hasCustomOrder) {
      effectiveMode = DEFAULT_ORDER_MODE;
      setOrderMode(effectiveMode);
      return;
    }

    const sortersConfig = sortModel.map(s => ({ field: s.field, order: s.sort }));
    setSorters(sortersConfig);
    persistOrderMode(effectiveMode);
  }, [orderMode, hasCustomOrder, setSorters, sortModel]);

  // Force re-apply sorting after data refetch to maintain order consistency
  useEffect(() => {
    if (tableQueryResult?.isFetching === false && tableQueryResult?.data) {
      const sortersConfig = sortModel.map(s => ({ field: s.field, order: s.sort }));
      setSorters(sortersConfig);
    }
  }, [tableQueryResult?.isFetching, tableQueryResult?.data, setSorters, sortModel]);

  // Ensure exact-match filtering on the rendered rows to avoid partial matches like "Mul Mul Cotton"
  const exactFilteredRows = useMemo(() => {
    const rows = dataGridProps?.rows ?? [];
    if (!selectedFabric) return rows;
    return rows.filter((r) => r?.fabric_type === selectedFabric);
  }, [dataGridProps?.rows, selectedFabric]);

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
        }
      } catch {
        if (isMounted) setHasCustomOrder(false);
      }
    };
    checkCustomOrder();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOrderModeChange = (e) => {
    const value = normalizeOrderMode(e.target.value);
    setOrderMode(value);
    persistOrderMode(value);
  };

  const handleFabricFilterChange = (e) => {
    const value = e.target.value;
    setSelectedFabric(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FABRIC_FILTER_STORAGE_KEY, value);
    }
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set("fabric", value);
    } else {
      nextParams.delete("fabric");
    }
    setSearchParams(nextParams, { replace: true });
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
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="fabric-filter-label">Fabric</InputLabel>
              <Select
                labelId="fabric-filter-label"
                value={selectedFabric}
                label="Fabric"
                onChange={handleFabricFilterChange}
              >
                <MenuItem value="">
                  <em>All fabrics</em>
                </MenuItem>
                {fabrics.map((f) => (
                  <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {hasCustomOrder && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="order-mode-label">Order By</InputLabel>
                <Select
                  labelId="order-mode-label"
                  value={orderMode}
                  label="Order By"
                  onChange={handleOrderModeChange}
                >
                  <MenuItem value="id_desc">Product ID (newest)</MenuItem>
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
              rows={exactFilteredRows}
              sortModel={sortModel}
              sortingMode="server"
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