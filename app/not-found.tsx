// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-[655px] mx-auto px-6 text-center">
        <h1 className="text-[20px] font-semibold text-[#d6d5cf] mb-3">
          page not found
        </h1>
        <p className="text-[14px] text-[#8f8e89] mb-8 leading-[1.7]">
          the page you requested does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="text-[14px] text-[#b9b8b2] underline underline-offset-[3px] hover:text-[#d6d5cf] transition-colors"
        >
          return home →
        </Link>
      </div>
    </main>
  );
}
