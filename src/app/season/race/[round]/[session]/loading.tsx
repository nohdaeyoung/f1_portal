export default function SessionLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-2xl bg-[#141420] border border-[#2D2D3A] p-8 mb-8">
        <div className="h-3 w-20 bg-[#3D3D50] rounded mb-4" />
        <div className="h-8 w-72 bg-[#3D3D50] rounded mb-3" />
        <div className="h-4 w-48 bg-[#2D2D3A] rounded" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl bg-[#141420] border border-[#2D2D3A] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2D2D3A]">
          <div className="w-7 h-3 bg-[#3D3D50] rounded" />
          <div className="w-32 h-3 bg-[#3D3D50] rounded" />
          <div className="flex-1" />
          <div className="w-20 h-3 bg-[#3D3D50] rounded" />
          <div className="w-16 h-3 bg-[#3D3D50] rounded hidden sm:block" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1E1E2A]"
          >
            <div className="w-7 h-7 rounded-full bg-[#2D2D3A] shrink-0" />
            <div className="w-7 h-7 rounded-full bg-[#2D2D3A] shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-3 w-24 bg-[#2D2D3A] rounded" />
              <div className="h-2.5 w-16 bg-[#1E1E2A] rounded" />
            </div>
            <div className="h-3 w-24 bg-[#2D2D3A] rounded font-mono" />
            <div className="h-3 w-16 bg-[#1E1E2A] rounded hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
