import { useDataGrid, List } from "@refinedev/mui";
import { DataGrid } from "@mui/x-data-grid";
import { Chip, Paper, Typography, Box, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Menu, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useUpdate } from "@refinedev/core";
import { MoreVert, Visibility } from "@mui/icons-material";

// --- Status Chip Component ---
const OrderStatus = ({ status }) => {
  let color;
  switch (status) {
    case "Pending": color = "info"; break;
    case "Processing": color = "secondary"; break;
    case "Shipped": color = "primary"; break;
    case "Delivered": color = "success"; break;
    case "Cancelled": color = "error"; break;
    default: color = "default";
  }
  return <Chip label={status || 'N/A'} color={color} size="small" sx={{ minWidth: '80px' }} />;
};

// --- Inline Status Select Component ---
const StatusSelect = ({ orderId, currentStatus }) => {
    const { mutate } = useUpdate();
    const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    const handleStatusChange = (newStatus) => {
        mutate({
            resource: "orders",
            id: orderId,
            values: { order_status: newStatus },
            successNotification: () => ({
                message: `Order #${orderId} status updated to ${newStatus}`,
                type: "success",
            }),
        });
    };

    return (
        <Select
            value={currentStatus || 'Pending'}
            onChange={(e) => handleStatusChange(e.target.value)}
            onClick={(e) => e.stopPropagation()} // Prevents row click
            size="small"
            fullWidth
            variant="outlined"
            sx={{
                "& .MuiSelect-select": {
                    padding: '6px 10px',
                },
                "& .MuiOutlinedInput-notchedOutline": {
                    border: 'none',
                }
            }}
        >
            {orderStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                    <OrderStatus status={status} />
                </MenuItem>
            ))}
        </Select>
    );
};


export const OrderList = () => {
  const { dataGridProps, setFilters, setSorters, tableQueryResult } = useDataGrid({
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
  });

  const [customerName, setCustomerName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Controlled sort model for DataGrid to prevent sort reset on data refetch
  const sortModel = useMemo(() => {
    return [{ field: "id", sort: "desc" }];
  }, []);

  // Force re-apply sorting after data refetch to maintain order consistency
  useEffect(() => {
    if (tableQueryResult?.isFetching === false && tableQueryResult?.data) {
      setSorters([{ field: "id", order: "desc" }]);
    }
  }, [tableQueryResult?.isFetching, tableQueryResult?.data, setSorters]);

  useEffect(() => {
    const filters = [];
    if (customerName) {
      filters.push({
        field: "shipping_address->>name",
        operator: "contains",
        value: customerName,
      });
    }
    if (statusFilter !== "all") {
      filters.push({
        field: "order_status",
        operator: "eq",
        value: statusFilter,
      });
    }
    setFilters(filters);
  }, [customerName, statusFilter, setFilters]);
  
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
      { field: "id", headerName: "Order ID", minWidth: 80 },
      {
        field: "created_at",
        headerName: "Date",
        minWidth: 180,
        renderCell: (params) => new Date(params.value).toLocaleString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
      },
      {
        field: "customer",
        headerName: "Customer",
        minWidth: 200,
        flex: 1,
        renderCell: (params) => <Typography variant="body2">{params.row.shipping_address?.name || "N/A"}</Typography>,
      },
      {
        field: "total_price",
        headerName: "Total (₹)",
        minWidth: 120,
        renderCell: (params) => Number(params.value).toLocaleString('en-IN', {
            minimumFractionDigits: 2, maximumFractionDigits: 2,
        }),
      },
      {
        field: "order_status",
        headerName: "Status",
        minWidth: 150,
        renderCell: (params) => <StatusSelect orderId={params.row.id} currentStatus={params.value} />,
        sortable: false,
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
          <Box onClick={(e) => e.stopPropagation()}>
            <IconButton onClick={(e) => handleClick(e, id)}>
              <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open && currentRowId === id} onClose={handleClose}>
              <MenuItem onClick={() => { navigate(`/orders/show/${id}`); handleClose(); }}>
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
    <List 
        title={<Typography variant="h5">Orders</Typography>}
        breadcrumb={null}
    >
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
            variant="outlined"
            size="small"
            placeholder="Search by customer name..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: '340px' }}
        />
        <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
            >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Processing">Processing</MenuItem>
                <MenuItem value="Shipped">Shipped</MenuItem>
                <MenuItem value="Delivered">Delivered</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
        </FormControl>
      </Paper>
      <Paper sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          sortModel={sortModel}
          sortingMode="server"
          rowHeight={64}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/orders/show/${params.id}`)}
        />
      </Paper>
    </List>
  );
};