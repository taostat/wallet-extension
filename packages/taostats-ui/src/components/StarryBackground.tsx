import type { ReactNode } from "react"
import { cn } from "@taostats-wallet/util"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"
import { useEffect, useRef, useState } from "react"

interface Star {
  id: number
  x: number
  y: number
  size: number
  layer: number
  twinkleDelay: number
  colour: "accent-1" | "accent-2" | "white"
  shape: "circle" | "square"
}

interface ShootingStar {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  duration: number
  delay: number
  colour: "accent-1" | "accent-2" | "white"
  shape: "circle" | "square"
}

export const StarryBackground = ({ children }: { children: ReactNode }) => {
  const [stars, setStars] = useState<Star[]>([])
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  // Create parallax transforms for different layers
  const y1 = useTransform(scrollY, [0, 1000], [0, -100])
  const y2 = useTransform(scrollY, [0, 1000], [0, -200])
  const y3 = useTransform(scrollY, [0, 1000], [0, -300])

  // Add spring physics for smoother motion
  const springY1 = useSpring(y1, { stiffness: 100, damping: 30 })
  const springY2 = useSpring(y2, { stiffness: 100, damping: 30 })
  const springY3 = useSpring(y3, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = []

      // Scale star count by viewport area so small popups
      // get fewer stars and large views get more.
      const width = window.innerWidth || 800
      const height = window.innerHeight || 600
      const area = width * height

      // Tunable density; clamp to avoid extremes.
      const density = 0.0005
      const starCount = Math.max(20, Math.min(80, Math.round(area * density)))

      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 6 + 1, // 1-7px
          layer: Math.floor(Math.random() * 3) + 1, // 1, 2, or 3
          twinkleDelay: Math.random() * 2, // 0-5 seconds delay
          colour: Math.random() < 0.33 ? "accent-2" : Math.random() < 0.66 ? "accent-1" : "white",
          shape: Math.random() < 0.5 ? "circle" : "square",
        })
      }
      setStars(newStars)
    }

    generateStars()

    const handleResize = () => generateStars()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    const createShootingStar = () => {
      const id = Date.now() + Math.random()
      const startX = Math.random() * 100
      const startY = Math.random() * 50 // Start from upper portion
      const endX = startX + (Math.random() * 40 + 20) * (Math.random() > 0.5 ? 1 : -1)
      const endY = startY + Math.random() * 30 + 20
      const duration = Math.random() * 1.1 + 1 // 1-3 seconds

      const newShootingStar: ShootingStar = {
        id,
        startX,
        startY,
        endX,
        endY,
        duration,
        delay: 0,
        colour: Math.random() < 0.33 ? "accent-2" : Math.random() < 0.66 ? "accent-1" : "white",
        shape: Math.random() < 0.5 ? "circle" : "square",
      }

      setShootingStars((prev) => [...prev, newShootingStar])

      // Remove shooting star after animation completes
      setTimeout(
        () => {
          setShootingStars((prev) => prev.filter((star) => star.id !== id))
        },
        duration * 1000 + 500,
      )
    }

    // Create shooting stars at random intervals
    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        // 20% chance every interval
        createShootingStar()
      }
    }, 5000) // Check every 5 seconds

    return () => {
      clearInterval(interval)
    }
  }, [])

  const getLayerTransform = (layer: number) => {
    switch (layer) {
      case 1:
        return springY1
      case 2:
        return springY2
      case 3:
        return springY3
      default:
        return springY1
    }
  }

  const getLayerOpacity = (layer: number) => {
    switch (layer) {
      case 1:
        return 0.6
      case 2:
        return 0.8
      case 3:
        return 1
      default:
        return 0.8
    }
  }

  return (
    <div className="relative min-h-[75vh] overflow-hidden">
      {/* Stars container */}
      <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className={cn(
              "absolute",
              star.shape === "circle" ? "rounded-full" : "rounded-none",
              star.colour === "white"
                ? "bg-white"
                : star.colour === "accent-1"
                  ? "bg-accent-1"
                  : "bg-accent-2",
            )}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              y: getLayerTransform(star.layer),
              opacity: getLayerOpacity(star.layer),
              willChange: "transform, opacity",
            }}
            animate={{
              opacity: [
                getLayerOpacity(star.layer) * 0.3,
                getLayerOpacity(star.layer),
                getLayerOpacity(star.layer) * 0.3,
              ],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 3, // 6-9 seconds
              repeat: Number.POSITIVE_INFINITY,
              delay: star.twinkleDelay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Shooting Stars */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {shootingStars.map((shootingStar) => (
          <motion.div
            key={shootingStar.id}
            className="absolute"
            style={{
              left: `${shootingStar.startX}%`,
              top: `${shootingStar.startY}%`,
              width: "2px",
              height: "2px",
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              x: `${shootingStar.endX - shootingStar.startX}vw`,
              y: `${shootingStar.endY - shootingStar.startY}vh`,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: shootingStar.duration,
              ease: "easeOut",
              times: [0, 0.1, 0.9, 1],
            }}
          >
            {/* Shooting star */}
            <div
              className={cn(
                "h-2 w-2",
                shootingStar.shape === "circle" ? "rounded-full" : "rounded-none",
                shootingStar.colour === "white"
                  ? "bg-white"
                  : shootingStar.colour === "accent-1"
                    ? "bg-accent-1"
                    : "bg-accent-2",
              )}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}
