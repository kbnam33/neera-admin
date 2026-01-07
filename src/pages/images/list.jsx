import { 
  Box, Paper, Typography, Button, Grid, Card, CardMedia, IconButton, 
  LinearProgress, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Skeleton
} from "@mui/material";
import { List } from "@refinedev/mui";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabaseClient, supabaseAdminClient } from "../../supabase";
import { CloudUpload, Delete, Refresh, Image as ImageIcon, Search } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

export const ImageList = () => {
  const [images, setImages] = useState([]);
  const [totalCount, setTotalCount] = useState(0); // Track total count separately
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50; // Reduced for faster initial load
  const observerTarget = useRef(null);

  // Fetch all images used by products
  const fetchUsedImages = async () => {
    try {
      const { data: products, error } = await supabaseAdminClient
        .from('products')
        .select('images');

      if (error) throw error;

      // Collect all used image URLs
      const usedUrls = new Set();
      products.forEach(product => {
        if (Array.isArray(product.images)) {
          product.images.forEach(url => {
            if (url) usedUrls.add(url);
          });
        }
      });

      return usedUrls;
    } catch (error) {
      console.error("Error fetching used images:", error);
      return new Set();
    }
  };

  // Fetch total count of unorganized images (handles unlimited images)
  const fetchTotalCount = async () => {
    try {
      let allFiles = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      // Fetch all files in batches
      while (hasMore) {
        const { data, error } = await supabaseClient.storage
          .from("product-images")
          .list(null, {
            limit: batchSize,
            offset: offset,
          });

        if (error) throw error;

        if (data && data.length > 0) {
          allFiles = [...allFiles, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Filter out folders and placeholder files
      const rootFiles = allFiles.filter(
        item => item.id !== null && item.name !== '.emptyFolderPlaceholder'
      );

      // Get all used images
      const usedImages = await fetchUsedImages();

      // Filter out images that are used in products
      const unorganizedFiles = rootFiles.filter(file => {
        const { data: { publicUrl } } = supabaseClient.storage
          .from("product-images")
          .getPublicUrl(file.name);
        return !usedImages.has(publicUrl);
      });
      
      setTotalCount(unorganizedFiles.length);
    } catch (error) {
      console.error("Error fetching total count:", error);
    }
  };

  // Fetch unorganized images from root of product-images bucket
  const fetchImages = async (offsetValue = 0, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Get all used images first
      const usedImages = await fetchUsedImages();

      // Fetch storage files - we need to fetch more than PAGE_SIZE 
      // because some will be filtered out as "used"
      const fetchSize = PAGE_SIZE * 3; // Fetch 3x to account for filtering
      const { data, error } = await supabaseClient.storage
        .from("product-images")
        .list(null, {
          limit: fetchSize,
          offset: offsetValue,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      // Filter out folders and placeholder files
      const rootFiles = data.filter(
        item => item.id !== null && item.name !== '.emptyFolderPlaceholder'
      );

      // Map to image objects and filter out used images
      const allImageList = rootFiles.map(file => {
        const { data: { publicUrl } } = supabaseClient.storage
          .from("product-images")
          .getPublicUrl(file.name);
        return { 
          name: file.name, 
          url: publicUrl,
          createdAt: file.created_at,
          size: file.metadata?.size || 0
        };
      });

      // Filter out images that are used in products
      const unorganizedImages = allImageList.filter(img => !usedImages.has(img.url));

      // Take only PAGE_SIZE items for display
      const imageList = unorganizedImages.slice(0, PAGE_SIZE);

      if (append) {
        setImages(prev => [...prev, ...imageList]);
      } else {
        setImages(imageList);
        // Update total count when doing initial fetch
        fetchTotalCount();
      }
      
      setHasMore(imageList.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchImages(0, false);
  }, []);

  // Infinite scroll with Intersection Observer
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && !isLoading && hasMore && !searchTerm) {
      const newOffset = offset + PAGE_SIZE;
      setOffset(newOffset);
      fetchImages(newOffset, true);
    }
  }, [offset, isLoadingMore, isLoading, hasMore, searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [handleLoadMore]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const file of files) {
        const fileName = `${uuidv4()}-${file.name}`;
        
        await supabaseClient.storage
          .from("product-images")
          .upload(fileName, file);
        
        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      // Refresh the image list and reset state
      // fetchImages will call fetchTotalCount to get accurate unorganized count
      setOffset(0);
      setHasMore(true);
      await fetchImages(0, false);
      
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Some images failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  const handleDeleteClick = (image) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      const { error } = await supabaseClient.storage
        .from("product-images")
        .remove([imageToDelete.name]);

      if (error) throw error;

      // Remove from local state and update count
      setImages(prev => prev.filter(img => img.name !== imageToDelete.name));
      setTotalCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image. Please try again.");
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;

    const deleteCount = selectedImages.length;
    if (!window.confirm(`Delete ${deleteCount} selected images?`)) {
      return;
    }

    try {
      const fileNames = selectedImages.map(url => {
        // Extract filename from full URL
        const urlParts = url.split('/');
        return decodeURIComponent(urlParts[urlParts.length - 1]);
      });

      const { error } = await supabaseClient.storage
        .from("product-images")
        .remove(fileNames);

      if (error) throw error;

      // Remove from local state and update count
      setImages(prev => prev.filter(img => !selectedImages.includes(img.url)));
      setTotalCount(prev => Math.max(0, prev - deleteCount));
      setSelectedImages([]);
      
    } catch (error) {
      console.error("Error deleting images:", error);
      alert("Failed to delete some images. Please try again.");
    }
  };

  const toggleImageSelection = (url) => {
    setSelectedImages(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const filteredImages = useMemo(() => {
    if (!searchTerm) return images;
    return images.filter(img => 
      img.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [images, searchTerm]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <List
      title={<Typography variant="h5">Image Gallery</Typography>}
      breadcrumb={null}
      headerButtons={
        <Stack direction="row" spacing={2} alignItems="center">
          {selectedImages.length > 0 && (
            <Chip 
              label={`${selectedImages.length} selected`}
              onDelete={handleBulkDelete}
              deleteIcon={<Delete />}
              color="primary"
            />
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setOffset(0);
              setHasMore(true);
              setSelectedImages([]);
              fetchImages(0, false);
              fetchTotalCount();
            }}
            disabled={isLoading || isUploading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUpload />}
            disabled={isUploading}
          >
            Upload Images
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFileUpload}
            />
          </Button>
        </Stack>
      }
    >
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search images by filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <Search sx={{ mr: 1, color: 'text.secondary' }} />
            ),
          }}
          size="small"
        />
      </Paper>

      {/* Upload Progress */}
      {isUploading && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Uploading images... {Math.round(uploadProgress)}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Paper>
      )}

      {/* Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box>
            <Typography variant="h6" color="primary">
              {searchTerm ? filteredImages.length : totalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {searchTerm ? 'Matching Images' : 'Unorganized Images (not used in products)'}
            </Typography>
          </Box>
          {selectedImages.length > 0 && (
            <Box>
              <Typography variant="h6" color="secondary">
                {selectedImages.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Selected
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Image Grid */}
      <Paper sx={{ p: 3 }}>
        {isLoading && images.length === 0 ? (
          <Grid container spacing={2}>
            {[...Array(12)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={index}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        ) : filteredImages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ImageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'No images match your search' : 'No unorganized images'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? 'Try a different search term' 
                : 'All uploaded images are being used in products, or no images have been uploaded yet.'}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {filteredImages.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={image.name}>
                  <Card 
                    sx={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      border: selectedImages.includes(image.url) ? 2 : 0,
                      borderColor: 'primary.main',
                      height: 200,
                      '&:hover': {
                        boxShadow: 6,
                        '& .image-overlay': {
                          opacity: 1,
                        }
                      }
                    }}
                    onClick={() => toggleImageSelection(image.url)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={image.url}
                      alt={image.name}
                      loading="lazy"
                      sx={{ 
                        objectFit: 'cover',
                        height: '100%',
                        width: '100%',
                      }}
                    />
                    <Box
                      className="image-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 1,
                        opacity: selectedImages.includes(image.url) ? 1 : 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          sx={{ 
                            bgcolor: 'error.main', 
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(image);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'white',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {image.name}
                        </Typography>
                        {image.size > 0 && (
                          <Typography variant="caption" sx={{ color: 'white', opacity: 0.7 }}>
                            {formatFileSize(image.size)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Infinite Scroll Trigger & Loading Indicator */}
            {hasMore && !searchTerm && (
              <Box 
                ref={observerTarget}
                sx={{ textAlign: 'center', mt: 4, py: 3 }}
              >
                {isLoadingMore && (
                  <Stack spacing={2} alignItems="center">
                    <LinearProgress sx={{ width: '50%' }} />
                    <Typography variant="body2" color="text.secondary">
                      Loading more images...
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Image?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this image? This action cannot be undone.
          </Typography>
          {imageToDelete && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img 
                src={imageToDelete.url} 
                alt={imageToDelete.name}
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {imageToDelete.name}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </List>
  );
};

