'use client'

import { useState, useRef, useEffect } from 'react'

interface BadgeTooltipProps {
  name: string
  description: string
  children: React.ReactNode
}

export function BadgeTooltip({ name, description, children }: BadgeTooltipProps) {
  const [show, setShow] = useState(false)
  const [above, setAbove] = useState(true)
  const tipRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (show && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect()
      // If too close to top, show below instead
      setAbove(rect.top > 80)
    }
  }, [show])

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          ref={tipRef}
          className={`absolute z-[100] w-52 px-3 py-2.5 rounded-xl bg-brand-card border border-brand-border shadow-card pointer-events-none transition-opacity duration-150 ${
            above ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2`}
        >
          <p className="text-xs font-bold text-brand-text leading-tight">{name}</p>
          <p className="text-xs text-brand-muted italic leading-snug mt-0.5">{description}</p>
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-brand-card border-brand-border ${
              above
                ? 'top-full -mt-1 border-r border-b'
                : 'bottom-full -mb-1 border-l border-t'
            }`}
          />
        </div>
      )}
    </span>
  )
}
