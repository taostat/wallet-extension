import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useCallback, useEffect, useId, useMemo, useState } from "react"

/** ViewBox layout: circles centred well above the frame so only shallow lower arcs are visible. */
const CX = 50
const CY = 2
const RINGS = [
  { id: "outer", radius: 57.5, strokeOpacity: 0.05 },
  { id: "middle", radius: 52.5, strokeOpacity: 0.05 },
  { id: "inner", radius: 42.5, strokeOpacity: 0.05 },
] as const

const COMET_RING_INDICES = [0, 1] as const

type Comet = {
  id: number
  ringIndex: (typeof COMET_RING_INDICES)[number]
  startOffset: number
  direction: 1 | -1
  duration: number
  travel: number
  tailArc: number
}

const BRAND_STROKE = "#00DBBC"

/** Number of segments used to build the smoothly-fading comet tail. */
const TAIL_SEGMENTS = 16

const circumference = (radius: number) => 2 * Math.PI * radius

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

const createComet = (): Comet => {
  const ringIndex = COMET_RING_INDICES[Math.floor(Math.random() * COMET_RING_INDICES.length)]!
  const radius = RINGS[ringIndex]!.radius
  const c = circumference(radius)

  return {
    id: Date.now() + Math.random(),
    ringIndex,
    startOffset: randomBetween(0, c),
    // Comets always travel anti-clockwise around the rings.
    direction: -1,
    duration: randomBetween(1.2, 2.0),
    // Travel at least half the circumference so comets never just flash in and out.
    travel: c * randomBetween(0.75, 1),
    tailArc: c * randomBetween(0.08, 0.13),
  }
}

const OrbitComet = ({
  comet,
  glowFilterId,
  onComplete,
}: {
  comet: Comet
  glowFilterId: string
  onComplete: (id: number) => void
}) => {
  const ring = RINGS[comet.ringIndex]!
  const c = circumference(ring.radius)
  const endOffset = comet.startOffset - comet.direction * comet.travel

  // Build the tail from overlapping segments. The head segment (i=0) is
  // brightest/thickest; each trailing segment sits further "behind" the head
  // (opposite the travel direction) and fades gradually to transparent.
  const step = comet.tailArc / TAIL_SEGMENTS
  const segLen = step * 1.8

  return (
    <>
      {Array.from({ length: TAIL_SEGMENTS }).map((_, i) => {
        const t = i / (TAIL_SEGMENTS - 1) // 0 at head, 1 at tail end
        const opacity = (1 - t) ** 1.4
        const strokeWidth = 0.11 * (1 - t * 0.55)
        const behind = comet.direction * i * step

        return (
          <motion.circle
            key={i}
            cx={CX}
            cy={CY}
            r={ring.radius}
            fill="none"
            stroke={BRAND_STROKE}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeOpacity={opacity}
            filter={i === 0 ? `url(#${glowFilterId})` : undefined}
            strokeDasharray={`${segLen} ${c - segLen}`}
            initial={{ strokeDashoffset: comet.startOffset + behind, opacity: 0 }}
            animate={{
              strokeDashoffset: endOffset + behind,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: comet.duration,
              ease: "linear",
              opacity: { duration: comet.duration, times: [0, 0.06, 0.86, 1] },
            }}
            onAnimationComplete={i === 0 ? () => onComplete(comet.id) : undefined}
          />
        )
      })}
    </>
  )
}

export const StarryBackground = ({ children }: { children: ReactNode }) => {
  const glowFilterId = useId().replace(/:/g, "")
  const ringFillId = `${glowFilterId}-ring-fill`
  const [comets, setComets] = useState<Comet[]>([])
  const [motionEnabled, setMotionEnabled] = useState(true)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setMotionEnabled(!media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  const removeComet = useCallback((id: number) => {
    setComets((prev) => prev.filter((comet) => comet.id !== id))
  }, [])

  useEffect(() => {
    if (!motionEnabled) return

    let cancelled = false
    let timeoutId = 0

    const schedule = () => {
      const delay = randomBetween(1800, 5500)
      timeoutId = window.setTimeout(() => {
        if (cancelled) return

        setComets((prev) => [...prev, createComet()])

        // Occasionally spawn a second comet on the other ring for overlap.
        if (Math.random() < 0.25) {
          window.setTimeout(
            () => {
              if (!cancelled) setComets((prev) => [...prev, createComet()])
            },
            randomBetween(120, 420),
          )
        }

        schedule()
      }, delay)
    }

    // Kick off with one comet shortly after mount.
    timeoutId = window.setTimeout(
      () => {
        if (cancelled) return
        setComets((prev) => [...prev, createComet()])
        schedule()
      },
      randomBetween(400, 1200),
    )

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [motionEnabled])

  const ringElements = useMemo(
    () =>
      RINGS.map((ring) => (
        <circle
          key={ring.id}
          cx={CX}
          cy={CY}
          r={ring.radius}
          fill="none"
          stroke="white"
          strokeOpacity={ring.strokeOpacity}
          strokeWidth={0.06}
        />
      )),
    [],
  )

  return (
    <div className="bg-app-bg relative h-full w-full overflow-hidden">
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.35" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient
            id={ringFillId}
            gradientUnits="userSpaceOnUse"
            cx={CX}
            cy={CY}
            r={RINGS[0]!.radius}
          >
            {/* Darkest at the very centre, lightening toward the ring band. */}
            <stop offset="0%" stopColor="#0A0B0D" stopOpacity="1" />
            <stop offset="55%" stopColor="#0C0D10" stopOpacity="1" />
            <stop offset="74%" stopColor="#141619" stopOpacity="1" />
            <stop offset="88%" stopColor="#1C1E22" stopOpacity="1" />
            <stop offset="100%" stopColor="#1C1E22" stopOpacity="0.25" />
          </radialGradient>
        </defs>

        {/* Radial fill inside the outermost ring: dark core that lightens into
            the ring band, then fades into the base app background. */}
        <circle cx={CX} cy={CY} r={RINGS[0]!.radius} fill={`url(#${ringFillId})`} />

        {ringElements}

        {motionEnabled &&
          comets.map((comet) => (
            <OrbitComet
              key={comet.id}
              comet={comet}
              glowFilterId={glowFilterId}
              onComplete={removeComet}
            />
          ))}
      </svg>

      <div className="relative z-10">{children}</div>
    </div>
  )
}
