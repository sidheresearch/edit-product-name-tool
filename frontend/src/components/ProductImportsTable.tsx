import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Autocomplete
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useData, useUpdateRecord, useTableStats } from '../hooks/useData'
import { DataFilters, PaginatedResponse, ProductIcegateImportListItem } from '../types'
import { searchSuggestions, isValidSuggestion } from '../utils/fuzzySearch'

const ProductImportsTable: React.FC = () => {
  // State management
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataFilters>({})
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
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
    filters: {
      ...filters,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
  }), [page, pageSize, search, filters, startDate, endDate])

  const { data: queryResponse, isLoading, error, refetch } = useData(queryParams)
  const { data: stats } = useTableStats()
  const updateMutation = useUpdateRecord()

  // Extract data with proper typing and add unique index
  const tableData = useMemo(() => {
    const rawData = (queryResponse as PaginatedResponse<ProductIcegateImportListItem>) || { data: [], totalCount: 0 }
    // Add a unique index to each row to ensure unique keys
    const dataWithIndex = rawData.data.map((item, index) => ({
      ...item,
      _uniqueIndex: `${page}_${index}` // Include page to ensure uniqueness across pages
    }))
    return {
      ...rawData,
      data: dataWithIndex
    }
  }, [queryResponse, page])

  // Debug logging
  console.log('Query Response:', queryResponse)
  console.log('Table Data:', tableData)
  console.log('Is Loading:', isLoading)
  console.log('Error:', error)

  // Handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(0) // Reset to first page on search
  }, [])

  const handleImporterFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFilters(prev => ({
      ...prev,
      true_importer_name: value || undefined
    }))
    setPage(0) // Reset to first page on filter change
  }, [])

  const handleStartDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value)
    setPage(0) // Reset to first page on filter change
  }, [])

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value)
    setPage(0) // Reset to first page on filter change
  }, [])

  const handleCellEditStart = useCallback((id: string, field: string, currentValue: any) => {
    console.log('Edit start called with:', { id, field, currentValue })
    setEditingCell({ id, field })
    const value = String(currentValue || '')
    setEditValue(value)
    initialEditValue.current = value
  }, [])

  // Input change handler that updates the edit value state
  const handleCellEditSave = useCallback(async () => {
    if (!editingCell) return

    // Use the editValue state instead of trying to read from ref
    const currentValue = editValue.trim()
    
    // Validate that the value is from the suggestions list (unless empty)
    if (currentValue && !isValidSuggestion(currentValue)) {
      setSnackbar({
        open: true,
        message: 'Please select a valid product name from the suggestions list',
        severity: 'error'
      })
      return
    }
    
    // Extract system_id from the composite key (format: system_id_reg_date_month_year_hs_code_uniqueIndex)
    const systemId = editingCell.id.split('_')[0]
    
    console.log('Saving:', { 
      compositeId: editingCell.id,
      systemId: systemId,
      field: editingCell.field, 
      value: currentValue 
    })

    try {
      const result = await updateMutation.mutateAsync({
        id: systemId, // Use system_id for the API call
        field: 'unique_product_name', 
        value: currentValue || null
      })

      console.log('Save successful:', result)

      setSnackbar({
        open: true,
        message: 'Product name updated successfully',
        severity: 'success'
      })

      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      console.error('Save error:', error)
      
      // Extract error message from the response
      let errorMessage = 'Failed to update product name'
      if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response === 'object') {
          if ('data' in error.response && error.response.data && typeof error.response.data === 'object') {
            if ('message' in error.response.data) {
              errorMessage = error.response.data.message as string
            }
          }
        } else if ('message' in error) {
          errorMessage = error.message as string
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
    }
  }, [editingCell, editValue, updateMutation])

  const handleCellEditCancel = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  // Column definitions for the product imports table
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'system_id',
      headerName: 'System ID',
      width: 120,
      sortable: true,
      renderCell: (params) => {
        const matchingCount = tableData.data.filter(row => row.system_id === params.value).length
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{params.value}</span>
            {matchingCount > 1 && (
              <Tooltip title={`${matchingCount} records with this System ID`}>
                <Typography variant="caption" sx={{ 
                  backgroundColor: 'warning.light', 
                  color: 'warning.contrastText',
                  px: 0.5, 
                  borderRadius: 0.5,
                  fontSize: '0.7rem'
                }}>
                  ×{matchingCount}
                </Typography>
              </Tooltip>
            )}
          </Box>
        )
      }
    },
    {
      field: 'reg_date',
      headerName: 'Reg Date',
      width: 120,
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return new Date(params.value).toLocaleDateString()
      }
    },
    {
      field: 'hs_code',
      headerName: 'HS Code',
      width: 140,
      sortable: true,
    },
    {
      field: 'true_importer_name',
      headerName: 'Importer Name',
      width: 250,
      sortable: true,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} placement="top">
          <Typography variant="body2" sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'help'
          }}>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'product_name',
      headerName: 'Product Name',
      width: 450,
      sortable: true,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} placement="top">
          <Typography variant="body2" sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'help'
          }}>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'unique_product_name',
      headerName: 'Unique Product Name (Editable)',
      width: 400,
      sortable: true,
      renderCell: (params) => {
        // console.log('Render cell params:', { id: params.id, value: params.value, row: params.row })
        const isEditing = editingCell?.id === String(params.id) && editingCell?.field === 'unique_product_name'
        // console.log('Is editing check:', { editingCellId: editingCell?.id, paramsId: String(params.id), isEditing })
        
        return isEditing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Autocomplete
              value={editValue}
              onChange={(_, newValue) => {
                if (newValue) {
                  setEditValue(newValue);
                }
              }}
              onInputChange={(_, newInputValue) => {
                setEditValue(newInputValue);
              }}
              options={searchSuggestions(editValue, 10).map(result => result.suggestion)}
              freeSolo={false} // Restrict to suggestions only
              size="small"
              fullWidth
              autoHighlight
              disableClearable
              filterOptions={(options) => options} // Use our own filtering
              renderInput={(params) => (
                <TextField
                  {...params}
                  autoFocus
                  size="small"
                  inputProps={{
                    ...params.inputProps,
                    onKeyDown: (e) => {
                      // Prevent event bubbling that could cause re-renders
                      e.stopPropagation();
                    },
                    style: { fontSize: '14px' }
                  }}
                />
              )}
              sx={{ 
                '& .MuiAutocomplete-option': {
                  fontSize: '14px'
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
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%', 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: 1
              }
            }}
            onClick={() => handleCellEditStart(String(params.id), 'unique_product_name', params.value)}
          >
            <Tooltip title={
              (() => {
                const systemId = String(params.id).split('_')[0]
                const matchingCount = tableData.data.filter(row => row.system_id.toString() === systemId).length
                return matchingCount > 1 
                  ? `Click to edit (will update ${matchingCount} records with same System ID)` 
                  : "Click to edit"
              })()
            } placement="top">
              <Typography variant="body2" sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                padding: '4px 8px',
                borderRadius: 1
              }}>
                {params.value || 'Click to add name'}
              </Typography>
            </Tooltip>
          </Box>
        )
      }
    },
  ], [editingCell, editValue, handleCellEditStart, handleCellEditSave, handleCellEditCancel, updateMutation.isPending])

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
        MEGHA MAM  Imports Management
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing only records with empty product names that need editing. Click on any "Unique Product Name" cell to edit.
        Use the date filters to narrow down records by registration date.
        <br />
        <strong>Note:</strong> Editing a product name will update ALL records with the same System ID (shown with ×N indicator).
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
              placeholder="Search products, HS codes..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Filter by Importer Name..."
              value={filters.true_importer_name || ''}
              onChange={handleImporterFilterChange}
              label="Importer Name Filter"
              variant="outlined"
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={1} sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setFilters({})
                setSearch('')
                setStartDate('')
                setEndDate('')
              }}
              disabled={Object.keys(filters).length === 0 && !search && !startDate && !endDate}
              size="small"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
        
        {/* Date Range Presets */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1, color: 'text.secondary' }}>
            Quick Date Filters:
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              setStartDate(today)
              setEndDate(today)
            }}
          >
            Today
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const today = new Date()
              const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              setStartDate(lastWeek.toISOString().split('T')[0])
              setEndDate(today.toISOString().split('T')[0])
            }}
          >
            Last 7 Days
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const today = new Date()
              const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
              setStartDate(lastMonth.toISOString().split('T')[0])
              setEndDate(today.toISOString().split('T')[0])
            }}
          >
            Last 30 Days
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const today = new Date()
              const startOfYear = new Date(today.getFullYear(), 0, 1)
              setStartDate(startOfYear.toISOString().split('T')[0])
              setEndDate(today.toISOString().split('T')[0])
            }}
          >
            This Year
          </Button>
        </Box>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={tableData?.data || []}
          columns={columns}
          loading={isLoading}
          pagination
          paginationMode="server"
          rowCount={tableData?.totalCount || 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page)
            setPageSize(model.pageSize)
          }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnMenu={false}
          getRowId={(row) => `${row.system_id}_${row.reg_date}_${row.month_year}_${row.hs_code}_${row._uniqueIndex}`}
          getRowClassName={(params) => {
            if (editingCell) {
              const editingSystemId = editingCell.id.split('_')[0]
              const currentSystemId = params.row.system_id.toString()
              return editingSystemId === currentSystemId ? 'editing-related-row' : ''
            }
            return ''
          }}
          sx={{
            '& .MuiDataGrid-row:hover .edit-button': {
              opacity: 1,
            },
            '& .editing-related-row': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
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

export default ProductImportsTable
