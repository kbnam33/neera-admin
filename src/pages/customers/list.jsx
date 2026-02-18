import { useDataGrid, List } from "@refinedev/mui";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Typography, IconButton, Menu, MenuItem, Box, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { MoreVert, Visibility } from "@mui/icons-material";
import { supabaseAdminClient } from "../../supabase";

export const CustomerList = () => {
  const { dataGridProps, setSorters, tableQueryResult } = useDataGrid({ 
    resource: "customers",
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
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
  const [customerOrderStats, setCustomerOrderStats] = useState({});
  const open = Boolean(anchorEl);

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
    const rows = dataGridProps?.rows || [];
    const userIds = rows.map((row) => row.id).filter(Boolean);

    if (userIds.length === 0) {
      setCustomerOrderStats({});
      return;
    }

    let isMounted = true;
    const fetchCustomerOrderStats = async () => {
      try {
        const { data, error } = await supabaseAdminClient
          .from("orders")
          .select("user_id, payment_status, total_price")
          .in("user_id", userIds);

        if (error) throw error;

        const statsMap = {};
        for (const userId of userIds) {
          statsMap[userId] = {
            completedOrders: 0,
            abandonedOrders: 0,
            totalSpent: 0,
          };
        }

        for (const order of data || []) {
          const userId = order.user_id;
          if (!statsMap[userId]) continue;

          const paymentStatus = (order.payment_status || "pending").toLowerCase();
          if (paymentStatus === "paid") {
            statsMap[userId].completedOrders += 1;
            statsMap[userId].totalSpent += Number(order.total_price || 0);
          } else if (paymentStatus === "pending") {
            statsMap[userId].abandonedOrders += 1;
          }
        }

        if (isMounted) {
          setCustomerOrderStats(statsMap);
        }
      } catch (error) {
        console.error("Error fetching customer order stats:", error);
        if (isMounted) {
          setCustomerOrderStats({});
        }
      }
    };

    fetchCustomerOrderStats();
    return () => {
      isMounted = false;
    };
  }, [dataGridProps?.rows]);

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
      { field: "email", headerName: "Email", minWidth: 250, flex: 1 },
      { field: "name", headerName: "Name", minWidth: 180, flex: 1 },
      { 
        field: "total_orders", 
        headerName: "Completed Orders", 
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const stats = customerOrderStats[params.row.id];
          return stats ? stats.completedOrders : 0;
        },
      },
      {
        field: "abandoned_orders",
        headerName: "Abandoned",
        minWidth: 110,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => {
          const stats = customerOrderStats[params.row.id];
          return stats ? stats.abandonedOrders : 0;
        },
      },
      {
        field: "total_spent",
        headerName: "Total Spent (₹)",
        minWidth: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => {
          const stats = customerOrderStats[params.row.id];
          const value = stats ? stats.totalSpent : 0;
          return Number(value).toLocaleString('en-IN', {
            minimumFractionDigits: 2, maximumFractionDigits: 2,
          });
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <IconButton onClick={(e) => handleClick(e, row.id)}>
              <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open && currentRowId === row.id} onClose={handleClose}>
              <MenuItem onClick={() => { navigate(`/customers/show/${row.id}`); handleClose(); }}>
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
    [navigate, anchorEl, open, currentRowId, customerOrderStats]
  );

  return (
    <List title={<Typography variant="h5">Customers</Typography>} breadcrumb={null}>
      <Paper sx={{ height: '75vh', width: '100%' }}>
        <DataGrid
          {...dataGridProps}
          columns={columns}
          sortModel={sortModel}
          sortingMode="server"
          rowHeight={64}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/customers/show/${params.id}`)}
        />
      </Paper>
    </List>
  );
};