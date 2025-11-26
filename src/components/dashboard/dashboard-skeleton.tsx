import { LoadingSkeleton } from "@/components/ui/loading";

export function DashboardSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="mt-1 h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Conteúdo */}
      <div className="mt-6 px-6 flex-1 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="mt-1 h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Cards Principais */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 rounded-md p-3 bg-gray-200 animate-pulse">
                      <div className="h-6 w-6" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="mt-2 h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 rounded-md p-3 bg-gray-200 animate-pulse">
                      <div className="h-6 w-6" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="mt-2 h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Operações Recentes */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr key="header-row">
                      {[...Array(5)].map((_, i) => (
                        <th key={i} className="px-6 py-3">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(3)].map((_, i) => (
                      <tr key={`row-${i}`}>
                        {[...Array(5)].map((_, j) => (
                          <td key={`cell-${i}-${j}`} className="px-6 py-4">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="h-4" /> {/* Padding inferior */}
      </div>
    </div>
  );
} 