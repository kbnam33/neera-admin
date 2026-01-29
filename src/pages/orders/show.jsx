import { useShow, useUpdate } from "@refinedev/core";
import { Show, ListButton } from "@refinedev/mui";
import { Box, Typography, Paper, Grid, Select, MenuItem, Chip, Divider, Stack, TextField, Button } from "@mui/material";
import { useParams } from "react-router-dom";
import { useForm } from "@refinedev/react-hook-form";
import { useEffect } from "react";

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
    return <Chip label={status || 'N/A'} color={color} />;
};

export const OrderShow = () => {
    const { id } = useParams();
    const { queryResult } = useShow();
    const { mutate, isLoading } = useUpdate();
    const { data } = queryResult;
    const record = data?.data;

    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (record) {
            reset({
                shipping_provider: record.shipping_provider,
                tracking_number: record.tracking_number,
            });
        }
    }, [record, reset]);

    const onFinish = (values) => {
        if (id) {
            mutate({
                resource: "orders",
                id,
                values,
                successNotification: { message: "Shipping info updated!", type: "success" },
            });
        }
    };
    
    return (
        <Show 
            headerButtons={<ListButton />}
            title={<Typography variant="h5">Order #{record?.id}</Typography>}
            breadcrumb={null}
        >
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Products</Typography>
                        <Stack divider={<Divider flexItem />} spacing={3}>
                            {record?.products?.map((product, index) => (
                                <Box key={product.id || index}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={3}>
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    paddingTop: '100%',
                                                    position: 'relative',
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    backgroundColor: 'grey.100',
                                                }}
                                            >
                                                <img
                                                    src={product.images?.[0] || '/placeholder.png'}
                                                    alt={product.name}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder.png';
                                                    }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={9}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Typography variant="h6" gutterBottom>
                                                        {product.name}
                                                    </Typography>
                                                    {product.fabric_type && (
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            Fabric: {product.fabric_type}
                                                        </Typography>
                                                    )}
                                                    {product.slug && (
                                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                                            SKU: {product.slug}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Quantity: {product.quantity || 1}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Price: ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="h6" color="primary">
                                                        ₹{(Number(product.price) * (product.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Stack>
                        <Divider sx={{ my: 3 }}/>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 300 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Subtotal:
                                </Typography>
                                <Typography variant="body1">
                                    ₹{Number(record?.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 300 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Shipping:
                                </Typography>
                                <Typography variant="body1">
                                    Free
                                </Typography>
                            </Box>
                            <Divider sx={{ width: '100%', maxWidth: 300, my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 300 }}>
                                <Typography variant="h6">
                                    Total:
                                </Typography>
                                <Typography variant="h6" color="primary">
                                    ₹{Number(record?.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Order Information</Typography>
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Order ID</Typography>
                                    <Typography variant="body2" fontWeight={500}>#{record?.id}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Order Date</Typography>
                                    <Typography variant="body2">
                                        {record?.created_at ? new Date(record.created_at).toLocaleString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <OrderStatus status={record?.order_status} />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                                    <Typography variant="body2">
                                        <Chip 
                                            label={record?.payment_status === 'paid' ? 'Paid' : 'Pending'} 
                                            color={record?.payment_status === 'paid' ? 'success' : 'warning'}
                                            size="small"
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Typography>
                                </Box>
                                {record?.razorpay_payment_id && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Payment ID</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {record.razorpay_payment_id}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Paper>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Shipping Address</Typography>
                            <Stack spacing={1}>
                                <Typography variant="body1" fontWeight="500">
                                    {record?.shipping_address?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {record?.shipping_address?.address}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {record?.shipping_address?.city}, {record?.shipping_address?.state} {record?.shipping_address?.postalCode}
                                </Typography>
                                {record?.shipping_address?.phone && (
                                    <Typography variant="body2" color="text.secondary">
                                        Phone: {record.shipping_address.phone}
                                    </Typography>
                                )}
                                {record?.shipping_address?.email && (
                                    <Typography variant="body2" color="text.secondary">
                                        Email: {record.shipping_address.email}
                                    </Typography>
                                )}
                            </Stack>
                        </Paper>
                         <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Shipment Tracking</Typography>
                            <Box component="form" onSubmit={handleSubmit(onFinish)} sx={{ mt: 2 }}>
                                <Stack spacing={2}>
                                    <TextField 
                                        {...register("shipping_provider")}
                                        label="Shipping Provider"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField 
                                        {...register("tracking_number")}
                                        label="Tracking Number"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                    />
                                    <Button type="submit" variant="contained" disabled={isLoading}>
                                        {isLoading ? "Saving..." : "Save Tracking Info"}
                                    </Button>
                                </Stack>
                            </Box>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Show>
    );
};