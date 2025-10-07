import { useShow } from "@refinedev/core";
import { Show, ListButton } from "@refinedev/mui";
import { Box, Typography, Paper, Grid, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabaseAdminClient } from "../../supabase"; 

// Helper to format addresses consistently
const formatAddress = (address) => {
    if (!address) return "No primary address on file.";
    return `${address.address || ''}, ${address.city || ''}, ${address.state || ''} - ${address.postalCode || ''}`;
};

// New, more elegant component for displaying detail items
const DetailItem = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
    >
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
      {value}
    </Typography>
  </Box>
);

export const CustomerShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [orderHistory, setOrderHistory] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);

    const { queryResult: customerQueryResult } = useShow({ resource: "customers", id });
    const customer = customerQueryResult.data?.data;

    useEffect(() => {
        if (id) {
            setIsLoadingOrders(true);
            const fetchOrderHistory = async () => {
                try {
                    const { data, error } = await supabaseAdminClient
                        .from('orders')
                        .select('*')
                        .eq('user_id', id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setOrderHistory(data || []);
                } catch (err) {
                    console.error("Error fetching order history:", err);
                    setOrderHistory([]);
                } finally {
                    setIsLoadingOrders(false);
                }
            };

            fetchOrderHistory();
        }
    }, [id]);

    const orderColumns = useMemo(() => [
        { field: "id", headerName: "Order ID", minWidth: 80 },
        { 
            field: "created_at", 
            headerName: "Date", 
            minWidth: 180,
            renderCell: (params) => new Date(params.value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric'})
        },
        {
          field: "products",
          headerName: "Products",
          flex: 1,
          minWidth: 250,
          renderCell: (params) => (
            <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflowY: 'auto' }}>
              {(params.value || []).map((product) => (
                <Typography key={product.id} variant="body2" sx={{ my: 0.5 }}>
                  {product.name}
                </Typography>
              ))}
            </Box>
          ),
          sortable: false,
        },
        { field: "order_status", headerName: "Status", minWidth: 120 },
        { 
            field: "total_price", 
            headerName: "Total (₹)", 
            minWidth: 120, 
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => `₹${Number(params.value).toFixed(2)}`
        },
    ], []);
    
    const primaryAddress = customer?.raw_user_meta_data?.address;

    return (
        <Show 
            headerButtons={<ListButton resource="customers" />}
            title={customer?.name || customer?.email}
            breadcrumb={null}
        >
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Customer Details</Typography>
                            <Stack spacing={2.5} sx={{ mt: 3 }}>
                                <DetailItem label="Name" value={customer?.name || 'Not provided'} />
                                <DetailItem label="Email" value={customer?.email} />
                                <DetailItem label="Total Orders" value={customer?.total_orders || 0} />
                                <DetailItem 
                                    label="Total Spent" 
                                    value={`₹${Number(customer?.total_spent || 0).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2, maximumFractionDigits: 2,
                                    })}`} 
                                />
                            </Stack>
                        </Paper>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Primary Address</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatAddress(primaryAddress)}
                            </Typography>
                        </Paper>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={8}>
                     <Paper sx={{ p: 3, height: '60vh' }}>
                        <Typography variant="h6" gutterBottom>Order History</Typography>
                        <DataGrid
                            rows={orderHistory}
                            columns={orderColumns}
                            loading={isLoadingOrders}
                            autoHeight
                            disableRowSelectionOnClick
                            onRowClick={(params) => navigate(`/orders/show/${params.id}`)}
                            sx={{ border: 'none' }}
                            rowHeight={80} 
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 5, page: 0 },
                                },
                            }}
                            pageSizeOptions={[5, 10, 20]}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Show>
    );
};