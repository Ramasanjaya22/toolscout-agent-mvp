export function Card({ className = '', children }) {
  return <div className={`rounded-2xl border border-black/10 bg-white p-5 ${className}`}>{children}</div>;
}
