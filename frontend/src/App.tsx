import { Box, AppBar, Toolbar, Typography } from '@mui/material'
import ProductImportsTable from './components/ProductImportsTable'

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MEGHA MAM Product Imports - Million Records Manager
          </Typography>
        </Toolbar>
      </AppBar>
      <main>
        <ProductImportsTable />
      </main>
    </Box>
  )
}

export default App
