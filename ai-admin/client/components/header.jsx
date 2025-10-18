"use client"

export default function Header({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}
