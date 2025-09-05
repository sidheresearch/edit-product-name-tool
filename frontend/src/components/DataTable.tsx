import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useData, useUpdateRecord, useTableStats } from '../hooks/useData'
import { ProductIcegateImport, DataFilters, PaginatedResponse } from '../types'

const DataTable: React.FC = () => {
  // State management
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataFilters>({})
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const initialEditValue = useRef<string>('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // API hooks
  const queryParams = useMemo(() => ({
    page: page + 1, // DataGrid uses 0-based, API uses 1-based
    pageSize,
    search,
    filters,
  }), [page, pageSize, search, filters])

  const { data: queryResponse, isLoading, error, refetch } = useData(queryParams)
  const { data: stats } = useTableStats()
  const updateMutation = useUpdateRecord()

  // Extract data with proper typing
  const data = (queryResponse as PaginatedResponse<ProductIcegateImport>) || { data: [], totalCount: 0 }

  // Handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(0) // Reset to first page on search
  }, [])

  const handleFilterChange = useCallback((filterKey: keyof DataFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value || undefined
    }))
    setPage(0) // Reset to first page on filter change
  }, [])

  const handleCellEditStart = useCallback((id: string, field: string, currentValue: any) => {
    
    setEditingCell({ id, field })
    const value = String(currentValue || '')
    setEditValue(value)
    initialEditValue.current = value
  }, [])

  // Input change handler that doesn't trigger re-renders
  const handleEditInputChange = useCallback(() => {
    // Don't update React state during typing to avoid cursor jumps
    // The input value is controlled by the DOM directly via defaultValue
  }, [])

  const handleCellEditSave = useCallback(async () => {
    if (!editingCell || !editInputRef.current) return

    const currentValue = editInputRef.current.value

    try {
      await updateMutation.mutateAsync({
        id: editingCell.id,
        field: 'unique_product_name',
        value: currentValue
      })

      setSnackbar({
        open: true,
        message: 'Record updated successfully',
        severity: 'success'
      })

      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update record',
        severity: 'error'
      })
    }
  }, [editingCell, updateMutation])

  const handleCellEditCancel = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  // Column definitions
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 90,
      sortable: true,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      sortable: true,
      renderCell: (params) => {
        const isEditing = editingCell?.id === params.id && editingCell?.field === 'name'
        
        return isEditing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <TextField
              ref={editInputRef}
              defaultValue={initialEditValue.current}
              onChange={handleEditInputChange}
              size="small"
              fullWidth
              autoFocus
              key={`edit-${params.id}-${editingCell?.field}`}
              inputProps={{
                onKeyDown: (e) => {
                  // Prevent event bubbling that could interfere with cursor
                  e.stopPropagation()
                }
              }}
            />
            <IconButton size="small" onClick={handleCellEditSave} disabled={updateMutation.isPending}>
              <SaveIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleCellEditCancel}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>{params.value}</span>
            <IconButton
              size="small"
              onClick={() => handleCellEditStart(String(params.id), 'name', params.value)}
              sx={{ opacity: 0, '.MuiDataGrid-row:hover &': { opacity: 1 } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      sortable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: true,
      renderCell: (params) => {
        const isEditing = editingCell?.id === params.id && editingCell?.field === 'status'
        
        if (isEditing) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
              <IconButton size="small" onClick={handleCellEditSave} disabled={updateMutation.isPending}>
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleCellEditCancel}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          )
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Chip
              label={params.value}
              size="small"
              color={
                params.value === 'active' ? 'success' :
                params.value === 'inactive' ? 'error' : 'warning'
              }
            />
            <IconButton
              size="small"
              onClick={() => handleCellEditStart(String(params.id), 'status', params.value)}
              sx={{ opacity: 0, '.MuiDataGrid-row:hover &': { opacity: 1 } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      sortable: true,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      sortable: true,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 180,
      sortable: true,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
  ]

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load data. Please try again.
          <Button onClick={() => refetch()} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Handler UI
      </Typography>

      {/* Statistics */}
      {stats && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Total Records: {stats.totalRecords.toLocaleString()} | 
            Last Updated: {new Date(stats.lastUpdated).toLocaleString()}
          </Typography>
        </Box>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search records..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Origin Country</InputLabel>
              <Select
                value={filters.origin_country || ''}
                onChange={(e) => handleFilterChange('origin_country', e.target.value)}
                label="Origin Country"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CHINA">China</MenuItem>
                <MenuItem value="USA">USA</MenuItem>
                <MenuItem value="GERMANY">Germany</MenuItem>
                <MenuItem value="JAPAN">Japan</MenuItem>
                <MenuItem value="SOUTH KOREA">South Korea</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>City</InputLabel>
              <Select
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                label="City"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="MUMBAI">Mumbai</MenuItem>
                <MenuItem value="DELHI">Delhi</MenuItem>
                <MenuItem value="CHENNAI">Chennai</MenuItem>
                <MenuItem value="KOLKATA">Kolkata</MenuItem>
                <MenuItem value="BANGALORE">Bangalore</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilters({})}
              disabled={Object.keys(filters).length === 0}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data?.data || []}
          columns={columns}
          loading={isLoading}
          pagination
          paginationMode="server"
          rowCount={data?.totalCount || 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page)
            setPageSize(model.pageSize)
          }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnMenu={false}
          getRowId={(row) => row.system_id}
          sx={{
            '& .MuiDataGrid-row:hover .edit-button': {
              opacity: 1,
            },
          }}
        />
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default DataTable
