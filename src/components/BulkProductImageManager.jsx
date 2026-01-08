import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  Close,
  CloudUpload,
  Delete,
  DragIndicator,
  Star,
  Collections,
} from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { supabaseClient } from "../supabase";
import { v4 as uuidv4 } from "uuid";
import { ProductImagePicker } from "./ProductImagePicker";

export const BulkProductImageManager = ({ open, onClose, onSave, initialImages = [], excludeImages = [] }) => {
  const [selectedImages, setSelectedImages] = useState(initialImages);
  const [activeTab, setActiveTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKey, setPickerKey] = useState(0); // Force re-mount of picker

  // Update selected images when initialImages change
  useEffect(() => {
    setSelectedImages(initialImages);
  }, [initialImages]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${uuidv4()}-${file.name}`;

        await supabaseClient.storage
          .from("product-images")
          .upload(fileName, file);

        const {
          data: { publicUrl },
        } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      // Add uploaded images to the end of selected images
      setSelectedImages([...selectedImages, ...uploadedUrls]);
      
      // Force refresh picker data next time it opens
      setPickerKey(prev => prev + 1);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload some images. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  const handleSelectFromExisting = (urls) => {
    // Add selected images to the end of current selection
    const newImages = urls.filter((url) => !selectedImages.includes(url));
    setSelectedImages([...selectedImages, ...newImages]);
    setPickerOpen(false);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(selectedImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedImages(items);
  };

  const handleDone = () => {
    onSave(selectedImages);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: "85vh" },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Manage Product Images</Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Summary */}
            <Paper sx={{ p: 2, bgcolor: "primary.50" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Collections color="primary" />
                <Box flex={1}>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedImages.length === 0
                      ? "No images selected"
                      : `${selectedImages.length} image${selectedImages.length > 1 ? "s" : ""} selected`}
                  </Typography>
                  {selectedImages.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      First image will be the main product image
                    </Typography>
                  )}
                </Box>
                {excludeImages.length > 0 && (
                  <Chip
                    label={`${excludeImages.length} excluded`}
                    size="small"
                    variant="outlined"
                    title="Images already selected for other products in this batch"
                  />
                )}
              </Stack>
            </Paper>

            {/* Tabs for Upload or Select */}
            <Box>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Upload from Computer" icon={<CloudUpload />} iconPosition="start" />
                <Tab label="Select from Existing" icon={<Collections />} iconPosition="start" />
              </Tabs>
              <Divider />
            </Box>

            {/* Tab Content */}
            <Box>
              {activeTab === 0 && (
                <Box>
                  <Button
                    variant="contained"
                    component="label"
                    fullWidth
                    size="large"
                    startIcon={<CloudUpload />}
                    disabled={isUploading}
                    sx={{ py: 2 }}
                  >
                    {isUploading
                      ? `Uploading... ${Math.round(uploadProgress)}%`
                      : "Choose Images to Upload"}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    You can select multiple images at once
                  </Typography>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Collections />}
                    onClick={() => {
                      // Force refresh by incrementing key
                      setPickerKey(prev => prev + 1);
                      setPickerOpen(true);
                    }}
                    sx={{ py: 2 }}
                  >
                    Browse Existing Images
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Select from unorganized images or copy from other products
                  </Typography>
                  {excludeImages.length > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        {excludeImages.length} image{excludeImages.length > 1 ? 's' : ''} already selected for other products in this batch will not appear in unorganized images.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Box>

            {/* Selected Images - Draggable List */}
            {selectedImages.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Selected Images (Drag to Reorder)
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  The first image will be displayed as the main product image. Drag to reorder.
                </Alert>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="images">
                    {(provided) => (
                      <Stack
                        spacing={1.5}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {selectedImages.map((url, index) => (
                          <Draggable key={url} draggableId={url} index={index}>
                            {(provided, snapshot) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                sx={{
                                  p: 1.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  bgcolor: snapshot.isDragging ? "action.hover" : "background.paper",
                                  border: index === 0 ? 2 : 1,
                                  borderColor: index === 0 ? "primary.main" : "divider",
                                  cursor: "move",
                                }}
                              >
                                {/* Drag Handle */}
                                <Box
                                  {...provided.dragHandleProps}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    color: "text.secondary",
                                  }}
                                >
                                  <DragIndicator />
                                </Box>

                                {/* Image Number */}
                                <Box sx={{ minWidth: 40 }}>
                                  {index === 0 ? (
                                    <Chip
                                      icon={<Star />}
                                      label="Main"
                                      color="primary"
                                      size="small"
                                    />
                                  ) : (
                                    <Chip label={index + 1} size="small" />
                                  )}
                                </Box>

                                {/* Image Preview */}
                                <Card sx={{ width: 80, height: 80, flexShrink: 0 }}>
                                  <CardMedia
                                    component="img"
                                    image={url}
                                    alt={`Image ${index + 1}`}
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </Card>

                                {/* Image URL */}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {url.split("/").pop()}
                                </Typography>

                                {/* Remove Button */}
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveImage(index)}
                                >
                                  <Delete />
                                </IconButton>
                              </Paper>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Stack>
                    )}
                  </Droppable>
                </DragDropContext>
              </Box>
            )}

            {selectedImages.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "text.secondary",
                }}
              >
                <Collections sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                <Typography variant="body1">
                  No images selected yet
                </Typography>
                <Typography variant="body2">
                  Upload from computer or select from existing images
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDone}
            disabled={isUploading}
            startIcon={<Collections />}
          >
            Done ({selectedImages.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Picker for "Select from Existing" */}
      <ProductImagePicker
        key={pickerKey}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectImages={handleSelectFromExisting}
        excludeImages={excludeImages}
      />
    </>
  );
};

