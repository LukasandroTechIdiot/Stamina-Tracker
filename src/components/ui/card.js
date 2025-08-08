export function Card({ children }) {
  return <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 shadow">{children}</div>;
}

export function CardContent({ children }) {
  return <div className="space-y-2">{children}</div>;
}