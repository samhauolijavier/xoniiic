export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-10 h-10 mx-auto mb-4" />
        <p className="text-brand-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}
