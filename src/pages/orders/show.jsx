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
                        <Stack divider={<Divider flexItem />} spacing={2}>
                            {record?.products?.map((product) => (
                                <Box key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1">{product.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {`₹${Number(product.price).toFixed(2)}`}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                        <Divider sx={{ my: 2 }}/>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Typography variant="h6">Total: ₹{Number(record?.total_price).toFixed(2)}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 3 }}>
                             <Typography variant="h6" gutterBottom>Order Status</Typography>
                             <OrderStatus status={record?.order_status} />
                        </Paper>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Shipping Details</Typography>
                            <Typography variant="body1" fontWeight="500">{record?.shipping_address?.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {`${record?.shipping_address?.address || ''}, ${record?.shipping_address?.city || ''}, ${record?.shipping_address?.state || ''}`}
                            </Typography>
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