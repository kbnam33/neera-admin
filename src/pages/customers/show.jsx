import { useShow, useList } from "@refinedev/core";
import { Show, ListButton } from "@refinedev/mui";
import { Box, Typography, Paper, Grid, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const CustomerShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Fetch the customer's details from the 'customers' view
    const { queryResult: customerQueryResult } = useShow({ resource: "customers", id });
    const customer = customerQueryResult.data?.data;

    // Fetch the order history for this specific customer using their UUID (id)
    const { dataGridProps } = useList({
        resource: "orders",
        filters: [{ field: "user_id", operator: "eq", value: id }],
        sorters: [{ field: "created_at", order: "desc" }],
        queryOptions: { enabled: !!id },
    });

    const orderColumns = useMemo(() => [
        { field: "id", headerName: "Order ID", minWidth: 80 },
        { 
            field: "created_at", 
            headerName: "Date", 
            minWidth: 180,
            renderCell: (params) => new Date(params.value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric'})
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

    return (
        <Show 
            headerButtons={<ListButton resource="customers" />}
            title={customer?.name || customer?.email}
            breadcrumb={null}
        >
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Customer Details</Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2"><strong>Name:</strong> {customer?.name || 'Not provided'}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {customer?.email}</Typography>
                            <Typography variant="body2"><strong>Total Orders:</strong> {customer?.total_orders || 0}</Typography>
                            <Typography variant="body2">
                                <strong>Total Spent:</strong> ₹{Number(customer?.total_spent || 0).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2, maximumFractionDigits: 2,
                                })}
                            </Typography>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                     <Paper sx={{ p: 3, height: '60vh' }}>
                        <Typography variant="h6" gutterBottom>Order History</Typography>
                        <DataGrid
                            {...dataGridProps}
                            columns={orderColumns}
                            autoHeight
                            disableRowSelectionOnClick
                            onRowClick={(params) => navigate(`/orders/show/${params.id}`)}
                            sx={{ border: 'none' }}
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