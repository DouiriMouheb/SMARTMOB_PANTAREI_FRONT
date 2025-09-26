import { RefreshCw } from 'lucide-react'

function DataTable({ 
  data = [], 
  columns = [], 
  loading = false, 
  error = null, 
  onRefresh = null,
  title = "Data Table"
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Caricamento...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p className="mb-4">Errore nel caricamento dei dati: {error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Riprova
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {data.length} {data.length === 1 ? 'record' : 'records'}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Aggiorna dati"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nessun dato disponibile</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DataTable