import React, { useEffect, useState, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import { supabase, PRODUCTS_TABLE } from '../supabaseClient';

export default function ProductList({ refreshSignal }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null); // product object awaiting confirmation

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetches on mount and whenever the parent signals a new product was added
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshSignal]);

  const confirmDelete = (product) => setPendingDelete(product);
  const cancelDelete = () => setPendingDelete(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setDeletingId(id);
    try {
      const { error: deleteError } = await supabase.from(PRODUCTS_TABLE).delete().eq('id', id);
      if (deleteError) throw deleteError;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6">Product Inventory</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading...' : `${products.length} product${products.length === 1 ? '' : 's'}`}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchProducts} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer sx={{ maxHeight: 560 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Prep (days)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No products yet. Add your first one using the form.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Avatar
                      variant="rounded"
                      src={product.main_photo_url || undefined}
                      sx={{ width: 40, height: 40, bgcolor: 'grey.100' }}
                    >
                      <ImageNotSupportedOutlinedIcon fontSize="small" color="disabled" />
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {product.name}
                    </Typography>
                    {Array.isArray(product.gallery_urls) && product.gallery_urls.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {product.gallery_urls.length} gallery photo
                        {product.gallery_urls.length > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={product.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    ₹{Number(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{product.prep_time_days ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete product">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={deletingId === product.id}
                        onClick={() => confirmDelete(product)}
                      >
                        {deletingId === product.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <DeleteOutlineIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(pendingDelete)} onClose={cancelDelete}>
        <DialogTitle>Delete product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove "{pendingDelete?.name}" from the inventory table. This
            does not delete its uploaded images from storage.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
