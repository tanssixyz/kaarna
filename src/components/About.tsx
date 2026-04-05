import { useState } from "react"

interface AboutProps {
  name: string
  children: React.ReactNode
}

export function About({ name, children }: AboutProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="p-about">
      <button
        className="p-about-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        what is {name}{open ? " ↑" : " ↓"}
      </button>
      {open && <div className="p-about-body">{children}</div>}
    </div>
  )
}
