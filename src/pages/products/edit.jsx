import { Edit, useAutocomplete } from "@refinedev/mui";
import { Box, TextField, Autocomplete, Button, Typography, Paper, IconButton } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { supabaseClient } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid";
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


export const ProductEdit = () => {
  const { id: productId } = useParams();
  
  const {
    saveButtonProps,
    refineCore: { queryResult },
    control,
    register,
    formState: { errors },
    reset,
  } = useForm();

  const productData = queryResult?.data?.data;

  useEffect(() => {
    if (productData) {
      const transformedData = {
        ...productData,
        images: productData.images || [], // Ensure images is always an array
      };
      reset(transformedData);
    }
  }, [productData, reset]);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "images",
  });
  
  const images = useWatch({ control, name: "images" });
  const [isUploading, setIsUploading] = useState(false);

  const { autocompleteProps } = useAutocomplete({
    resource: "fabrics",
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !productId) return;

    setIsUploading(true);
    const fileName = `${productId}/${uuidv4()}-${file.name}`;
    
    try {
      await supabaseClient.storage
        .from("product-images")
        .upload(fileName, file);
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from("product-images")
        .getPublicUrl(fileName);
      
      append(publicUrl);

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box component="form" sx={{ display: "flex", flexDirection: "column" }} autoComplete="off">
        {/* --- Standard Text Fields --- */}
        <TextField {...register("name", { required: "This field is required" })} error={!!errors.name} helperText={errors.name?.message} margin="normal" fullWidth label="Name" name="name" variant="outlined" InputLabelProps={{ shrink: true }} />
        <TextField {...register("description")} margin="normal" fullWidth multiline rows={4} label="Description" name="description" variant="outlined" InputLabelProps={{ shrink: true }} />
        <TextField {...register("price", { required: "This field is required", valueAsNumber: true })} error={!!errors.price} helperText={errors.price?.message} margin="normal" fullWidth type="number" label="Price" name="price" variant="outlined" InputLabelProps={{ shrink: true }} />
        <Controller
          control={control}
          name="fabric_type"
          render={({ field }) => {
            const selectedOption = autocompleteProps.options?.find((option) => option.name === field.value) || null;
            return (
                <Autocomplete
                    {...autocompleteProps}
                    value={selectedOption}
                    getOptionLabel={(option) => option.name || ""}
                    isOptionEqualToValue={(option, value) => option.name === value?.name}
                    onChange={(_, newValue) => field.onChange(newValue?.name || "")}
                    renderInput={(params) => (
                        <TextField {...params} label="Fabric" margin="normal" variant="outlined" error={!!errors.fabric_type} helperText={errors.fabric_type?.message} />
                    )}
                />
            );
          }}
        />

        {/* --- Unified Image Management Section with Drag-and-Drop --- */}
        <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>Images</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Drag and drop images to reorder. The first image is the main image.
            </Typography>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              position: 'relative',
                              width: 100,
                              height: 100,
                              border: index === 0 ? '3px solid #1976d2' : '1px solid #e0e0e0',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            {index === 0 && (
                                <Typography sx={{ position: 'absolute', top: 0, left: 0, background: '#1976d2', color: 'white', padding: '2px 6px', fontSize: '0.7rem', borderBottomRightRadius: '4px', zIndex: 1 }}>
                                    Main
                                </Typography>
                            )}
                            <img src={images[index]} alt={`product-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <IconButton
                              size="small"
                              onClick={() => remove(index)}
                              sx={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
            <Button
              variant="contained"
              component="label"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
        </Paper>
      </Box>
    </Edit>
  );
};