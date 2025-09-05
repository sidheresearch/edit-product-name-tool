import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataService, FetchDataParams } from '../services/dataService'
import { UpdateRecordRequest, ProductIcegateImportListItem } from '../types'

// Hook for fetching paginated data
export const useData = (params: FetchDataParams) => {
  return useQuery({
    queryKey: ['data', params],
    queryFn: () => dataService.fetchData(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  })
}

// Hook for updating a single record
export const useUpdateRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateRecordRequest) => {
      console.log('Mutation request:', request)
      return dataService.updateRecord(request)
    },
    onMutate: async (newData) => {
      console.log('onMutate called with:', newData)
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['data'] })

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['data'] })

      // Optimistically update to the new value
      queryClient.setQueriesData(
        { queryKey: ['data'] },
        (old: any) => {
          if (!old) return old
          
          console.log('Updating optimistically, looking for system_id:', newData.id)
          const updatedData = {
            ...old,
            data: old.data.map((record: ProductIcegateImportListItem) =>
              record.system_id.toString() === newData.id.toString()
                ? { ...record, [newData.field]: newData.value }
                : record
            )
          }
          console.log('Optimistic update result:', updatedData)
          return updatedData
        }
      )

      return { previousData }
    },
    onError: (_err, _newData, context) => {
      console.error('Mutation error:', _err)
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSuccess: (data, variables) => {
      console.log('Mutation success:', { data, variables })
    },
    onSettled: () => {
      console.log('Mutation settled, invalidating queries')
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['data'] })
    },
  })
}

// Hook for table statistics
export const useTableStats = () => {
  return useQuery({
    queryKey: ['tableStats'],
    queryFn: () => dataService.getTableStats(),
    refetchInterval: 60000, // Refetch every minute
  })
}

// Hook for batch updates
export const useBatchUpdate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: UpdateRecordRequest[]) => dataService.batchUpdate(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] })
    },
  })
}
