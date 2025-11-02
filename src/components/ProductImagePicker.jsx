import { 
    Box, Button, Typography, Paper, IconButton, Grid, Stack,
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, InputAdornment, TextField,
    DialogActions, useTheme // Added DialogActions and useTheme
} from "@mui/material";
import { supabaseClient } from "../supabase";
import CloseIcon from '@mui/icons-material/Close';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Added for selection
import { useState, useEffect, useMemo } from "react";

// Helper function to list all files from the root of a bucket
const fetchRootFiles = async (bucketName) => {
    const { data, error } = await supabaseClient.storage.from(bucketName).list(null, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
        console.error(`Error listing root files from ${bucketName}:`, error);
        return [];
    }
    
    // Filter out any folders (which have id=null) and .emptyFolderPlaceholder
    const rootFiles = data.filter(item => item.id !== null && item.name !== '.emptyFolderPlaceholder');
    
    return rootFiles.map(file => {
        const { data: { publicUrl } } = supabaseClient.storage.from(bucketName).getPublicUrl(file.name);
        return { name: file.name, url: publicUrl };
    });
};

export const ProductImagePicker = ({ open, onClose, onSelectImages }) => { // Prop renamed to onSelectImages
    const theme = useTheme();
    const [products, setProducts] = useState([]);
    const [rootImages, setRootImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [view, setView] = useState('list'); // 'list' or 'images'
    const [selectedItem, setSelectedItem] = useState(null); // Can be a product object or 'root'
    
    // --- New state for multi-selection ---
    const [selectedUrls, setSelectedUrls] = useState([]);

    useEffect(() => {
        if (!open) {
            // Reset state when modal is closed
            setView('list');
            setSelectedItem(null);
            setFilter("");
            setSelectedUrls([]); // Clear selection
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all products
                const { data: productsData, error: productsError } = await supabaseClient
                    .from('products')
                    .select('id, name, images')
                    .order('name', { ascending: true });
                
                if (productsError) throw productsError;
                
                // Fetch all unorganized images from root
                const rootImagesData = await fetchRootFiles('product-images');

                // --- START OF CHANGE ---
                // Create a Set of all images used by any product
                const allUsedImages = new Set();
                if (productsData) {
                    productsData.forEach(product => {
                        if (product.images && Array.isArray(product.images)) {
                            product.images.forEach(url => allUsedImages.add(url));
                        }
                    });
                }

                // Filter root images to only include those NOT in the allUsedImages set
                const unusedRootImagesData = rootImagesData.filter(
                    file => !allUsedImages.has(file.url)
                );
                // --- END OF CHANGE ---

                setProducts(productsData.filter(p => p.images && p.images.length > 0));
                setRootImages(unusedRootImagesData); // <-- Use the new filtered data

            } catch (error) {
                console.error("Error fetching data for picker:", error);
                alert("Failed to load products and images.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [open]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [products, filter]);

    const handleSelectProduct = (product) => {
        setSelectedItem(product);
        setView('images');
    };

    const handleSelectRoot = () => {
        setSelectedItem({ id: 'root', name: 'Unorganized Images', images: rootImages });
        setView('images');
    };

    const handleBack = () => {
        setView('list');
        setSelectedItem(null);
        setFilter("");
        setSelectedUrls([]); // Clear selection when going back
    };

    // --- New handler to toggle selection ---
    const handleToggleSelect = (url) => {
        setSelectedUrls(prev => 
            prev.includes(url) 
                ? prev.filter(u => u !== url) // Deselect
                : [...prev, url] // Select
        );
    };

    // --- New handler for the "Add" button ---
    const handleDone = () => {
        onSelectImages(selectedUrls); // Pass array of URLs
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display="flex" alignItems="center">
                    {view === 'images' && (
                        <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6">
                        {view === 'list' ? "Select from Existing" : `Select from "${selectedItem?.name || ''}"`}
                    </Typography>
                </Box>
                {/* --- Show count when in image view --- */}
                {view === 'images' && selectedUrls.length > 0 && (
                    <Typography variant="body1" color="text.secondary">
                        {selectedUrls.length} selected
                    </Typography>
                )}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: '60vh', bgcolor: 'background.default' }}>
                {isLoading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <>
                        {/* --- View 1: Product & Root List --- */}
                        {view === 'list' && (
                            <Box>
                                <TextField
                                    fullWidth
                                    placeholder="Filter by product name..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    margin="dense"
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ImageSearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <List dense component={Paper} elevation={0}>
                                    {rootImages.length > 0 && (
                                        <ListItemButton onClick={handleSelectRoot}>
                                            <ListItemText 
                                                primary="Unorganized Images" 
                                                secondary={`${rootImages.length} image(s) available`} 
                                            />
                                        </ListItemButton>
                                    )}
                                    {filteredProducts.length === 0 && rootImages.length === 0 ? (
                                        <ListItemText primary="No products with images found." sx={{ textAlign: 'center', color: 'text.secondary' }} />
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <ListItemButton key={product.id} onClick={() => handleSelectProduct(product)}>
                                                <ListItemText 
                                                    primary={product.name} 
                                                    secondary={`${product.images.length} image(s) available`} 
                                                />
                                            </ListItemButton>
                                        ))
                                    )}
                                </List>
                            </Box>
                        )}

                        {/* --- View 2: Image Grid --- */}
                        {view === 'images' && selectedItem && (
                            <Grid container spacing={1.5}>
                                {selectedItem.images.map((img, index) => {
                                    const imgUrl = typeof img === 'string' ? img : img.url;
                                    const imgName = typeof img === 'string' ? `Image ${index+1}` : img.name;
                                    const isSelected = selectedUrls.includes(imgUrl);

                                    return (
                                    <Grid item xs={4} sm={3} md={3} key={index}>
                                        <Paper 
                                            onClick={() => handleToggleSelect(imgUrl)}
                                            elevation={0}
                                            sx={{ 
                                                position: 'relative', 
                                                width: '100%', 
                                                paddingTop: '100%', // Square
                                                cursor: 'pointer', 
                                                overflow: 'hidden', 
                                                borderRadius: '8px',
                                                border: '2px solid',
                                                borderColor: isSelected ? theme.palette.primary.main : 'transparent',
                                                transition: 'border-color 0.2s',
                                            }}
                                        >
                                            <img 
                                                src={imgUrl} 
                                                alt={imgName}
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: 0, left: 0, 
                                                    width: '100%', height: '100%', 
                                                    objectFit: 'cover',
                                                    opacity: isSelected ? 0.7 : 1, // Dim if selected
                                                    transition: 'opacity 0.2s',
                                                }} 
                                            />
                                            {isSelected && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    color: 'white',
                                                    backgroundColor: theme.palette.primary.main,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <CheckCircleIcon sx={{ fontSize: 24 }} />
                                                </Box>
                                            )}
                                        </Paper>
                                    </Grid>
                                )})}
                            </Grid>
                        )}
                    </>
                )}
            </DialogContent>

            {/* --- New Actions Footer --- */}
            {view === 'images' && (
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleDone} 
                        variant="contained" 
                        disabled={selectedUrls.length === 0}
                    >
                        Add {selectedUrls.length > 0 ? selectedUrls.length : ''} Image(s)
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};