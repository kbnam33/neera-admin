import { Create } from "@refinedev/mui";
import { Box, TextField, Typography } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";

export const FabricCreate = () => {
  const {
    saveButtonProps,
    register,
    formState: { errors },
  } = useForm();

  return (
    <Create 
      saveButtonProps={saveButtonProps}
      title={<Typography variant="h5">Create New Fabric</Typography>}
      breadcrumb={null}
    >
      <Box component="form" sx={{ display: "flex", flexDirection: "column" }} autoComplete="off">
        <TextField
          {...register("name", {
            required: "This field is required",
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          variant="outlined"
          autoFocus
        />
      </Box>
    </Create>
  );
};