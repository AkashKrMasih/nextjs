export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-stone-300 bg-stone-50">
      <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-stone-600">
        © {year} Shop
      </div>
    </footer>
  );
}
