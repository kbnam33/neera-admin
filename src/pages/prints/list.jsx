import {
  DataGrid,
} from "@mui/x-data-grid";
import { useDataGrid, List, CreateButton, DeleteButton } from "@refinedev/mui";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Menu, MenuItem, IconButton, Stack, Box, Chip } from "@mui/material";
import { MoreVert, Edit, Delete, Add } from "@mui/icons-material";
import { supabaseAdminClient } from "../../supabase";

export const PrintList = () => {
  const { dataGridProps, setSorters, tableQueryResult } = useDataGrid({
    sorters: {
      initial: [
        {
          field: "id",
          order: "asc",
        },
      ],
      permanent: [
        {
          field: "id",
          order: "asc",
        },
      ],
    },
  });
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);
  const [productCounts, setProductCounts] = useState({});
  const open = Boolean(anchorEl);

  // Controlled sort model for DataGrid to prevent sort reset on data refetch
  const sortModel = useMemo(() => {
    return [{ field: "id", sort: "asc" }];
  }, []);

  // Force re-apply sorting after data refetch to maintain order consistency
  useEffect(() => {
    if (tableQueryResult?.isFetching === false && tableQueryResult?.data) {
      setSorters([{ field: "id", order: "asc" }]);
    }
  }, [tableQueryResult?.isFetching, tableQueryResult?.data, setSorters]);

  // Fetch product counts for each print type
  useEffect(() => {
    const fetchProductCounts = async () => {
      try {
        const { data: prints } = await supabaseAdminClient
          .from('prints')
          .select('id');
        
        if (!prints) return;

        const counts = {};
        for (const print of prints) {
          const { count } = await supabaseAdminClient
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('print_id', print.id);
          
          counts[print.id] = count || 0;
        }
        
        setProductCounts(counts);
      } catch (error) {
        console.error('Error fetching product counts:', error);
      }
    };

    if (tableQueryResult?.data?.data) {
      fetchProductCounts();
    }
  }, [tableQueryResult?.data]);

  const handleClick = (event, id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setCurrentRowId(id);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setCurrentRowId(null);
  };

  const handleDelete = async (id) => {
    const productCount = productCounts[id] || 0;
    
    if (productCount > 0) {
      alert(`Cannot delete: ${productCount} product${productCount > 1 ? 's' : ''} use${productCount === 1 ? 's' : ''} this print type. Please reassign or delete those products first.`);
      handleClose();
      return;
    }

    // Proceed with delete
    document.getElementById(`delete-button-${id}`)?.click();
    handleClose();
  };

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", minWidth: 50 },
      {
        field: "name",
        headerName: "Print Type Name",
        minWidth: 200,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body1" fontWeight={500}>{params.value}</Typography>
        )
      },
      {
        field: "slug",
        headerName: "Slug",
        minWidth: 150,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">{params.value}</Typography>
        )
      },
      {
        field: "product_count",
        headerName: "Products",
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => {
          const count = productCounts[params.id] || 0;
          return (
            <Chip 
              label={count} 
              size="small" 
              color={count > 0 ? "primary" : "default"}
              variant="outlined"
            />
          );
        }
      },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ id }) => (
          <Box onClick={(e) => e.stopPropagation()}>
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={(e) => handleClick(e, id)}
            >
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open && currentRowId === id}
              onClose={handleClose}
            >
              <MenuItem
                onClick={() => {
                  navigate(`/prints/edit/${id}`);
                  handleClose();
                }}
              >
                <Stack direction="row" alignItems="center" gap={1}>
                  <Edit sx={{ fontSize: '1.125rem', color: 'text.secondary' }} />
                  Edit
                </Stack>
              </MenuItem>
              <MenuItem
                onClick={() => handleDelete(id)}
                sx={(theme) => ({
                    color: theme.palette.destructive.main,
                    '&:hover': {
                        backgroundColor: 'rgba(229, 115, 115, 0.08)'
                    }
                })}
              >
                 <Stack direction="row" alignItems="center" gap={1}>
                  <Delete sx={{ fontSize: '1.125rem' }} />
                  Delete
                </Stack>
              </MenuItem>
            </Menu>
             <Box sx={{display: 'none'}}>
                <DeleteButton
                    recordItemId={id}
                    id={`delete-button-${id}`}
                />
             </Box>
          </Box>
        ),
      },
    ],
    [navigate, anchorEl, open, currentRowId, productCounts]
  );

  return (
    <List
        title={<Typography variant="h5">Print Types</Typography>}
        headerButtons={
          <CreateButton
            variant="contained"
            startIcon={<Add />}
          >
            Add Print Type
          </CreateButton>
        }
    >
        <Paper sx={{
            height: '75vh',
            width: '100%',
        }}>
            <DataGrid
              {...dataGridProps}
              columns={columns}
              sortModel={sortModel}
              sortingMode="server"
              rowHeight={72}
              disableRowSelectionOnClick
              onRowClick={(params) => navigate(`/prints/edit/${params.id}`)}
            />
        </Paper>
    </List>
  );
};
