export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
      <h1 className="text-3xl font-bold text-red-600 mb-2">🚫 Access Denied</h1>
      <p className="text-gray-600">
        You don’t have permission to access this page.
      </p>
    </div>
  )
}
