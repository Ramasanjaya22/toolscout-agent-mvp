export function Button({ className = '', ...props }) {
  return <button className={`rounded-xl border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-violet-600 hover:text-white ${className}`} {...props} />;
}
