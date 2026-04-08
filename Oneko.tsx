import React, { useCallback, useEffect, useRef, useState } from "react"

const SPRITE_SETS: Record<string, [number, number][]> = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [
    [-5, 0],
    [-6, 0],
    [-7, 0],
  ],
  scratchWallN: [
    [0, 0],
    [0, -1],
  ],
  scratchWallS: [
    [-7, -1],
    [-6, -2],
  ],
  scratchWallE: [
    [-2, -2],
    [-2, -3],
  ],
  scratchWallW: [
    [-4, 0],
    [-4, -1],
  ],
  tired: [[-3, -2]],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  N: [
    [-1, -2],
    [-1, -3],
  ],
  NE: [
    [0, -2],
    [0, -3],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  SE: [
    [-5, -1],
    [-5, -2],
  ],
  S: [
    [-6, -3],
    [-7, -2],
  ],
  SW: [
    [-5, -3],
    [-6, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
  NW: [
    [-1, 0],
    [-1, -1],
  ],
}

interface OnekoProps {
  speed?: number
  sleepAfter?: number
  idleAfter?: number
  wakeOutOfView?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Oneko: React.FC<OnekoProps> = ({ speed = 10, sleepAfter = 10000, idleAfter = 5000, wakeOutOfView = false, className = "", style = {} }) => {
  const [isChasing, setIsChasing] = useState(false)
  const nekoRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const internal = useRef({
    nekoX: 0,
    nekoY: 0,
    asleepX: 0,
    asleepY: 0,
    mouseX: 0,
    mouseY: 0,
    frameCount: 0,
    idleTime: 0,
    idleAnimationFrame: 0,
    lastCatMoveTime: Date.now(),
    isYawning: false,
    idleAnimation: null as string | null,
    hasPlayedIdle: false,
    manualStop: false,
  })

  const setSprite = useCallback((name: string, frame: number) => {
    if (!nekoRef.current) return
    const sprites = SPRITE_SETS[name] || SPRITE_SETS.idle
    const [x, y] = sprites[frame % sprites.length]
    nekoRef.current.style.backgroundPosition = `${x * 32}px ${y * 32}px`
  }, [])

  const toggleState = useCallback((toSleep: boolean, isManual = false) => {
    if (!toSleep) {
      const rect = nekoRef.current?.getBoundingClientRect()
      if (rect) {
        internal.current.nekoX = rect.left + rect.width / 2
        internal.current.nekoY = rect.top + rect.height / 2
      }
      internal.current.idleTime = 10
      internal.current.lastCatMoveTime = Date.now()
      internal.current.hasPlayedIdle = false
      internal.current.manualStop = false
      setIsChasing(true)
    } else {
      if (internal.current.isYawning) return
      internal.current.isYawning = true
      internal.current.manualStop = isManual

      setTimeout(() => {
        if (nekoRef.current && containerRef.current) {
          const catRect = nekoRef.current.getBoundingClientRect()
          const parentRect = containerRef.current.getBoundingClientRect()
          internal.current.asleepX = catRect.left - parentRect.left
          internal.current.asleepY = catRect.top - parentRect.top
        }
        internal.current.isYawning = false
        internal.current.idleAnimation = null
        setIsChasing(false)
      }, 700)
    }
  }, [])

  useEffect(() => {
    if (!wakeOutOfView || isChasing) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !internal.current.manualStop) {
          toggleState(false)
        }
      },
      { threshold: 0 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [wakeOutOfView, isChasing, toggleState])

  const handleLogic = useCallback(
    (timestamp: number) => {
      if (internal.current.isYawning) {
        setSprite("tired", 0)
        return
      }

      if (!isChasing) {
        setSprite("sleeping", Math.floor(timestamp / 500))
        return
      }

      const { mouseX, mouseY, nekoX, nekoY } = internal.current
      const diffX = nekoX - mouseX
      const diffY = nekoY - mouseY
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2)

      if (distance < speed || distance < 48) {
        const timeSinceStopped = Date.now() - internal.current.lastCatMoveTime

        if (timeSinceStopped > sleepAfter) {
          toggleState(true, false)
          return
        }

        if (timeSinceStopped > idleAfter && !internal.current.hasPlayedIdle && !internal.current.idleAnimation) {
          const walls = []
          if (mouseX < 64) walls.push("scratchWallW")
          if (mouseY < 64) walls.push("scratchWallN")
          if (mouseX > window.innerWidth - 64) walls.push("scratchWallE")
          if (mouseY > window.innerHeight - 64) walls.push("scratchWallS")
          internal.current.idleAnimation = walls.length ? walls[Math.floor(Math.random() * walls.length)] : "scratchSelf"
          internal.current.idleAnimationFrame = 0
        }

        if (internal.current.idleAnimation) {
          setSprite(internal.current.idleAnimation, internal.current.idleAnimationFrame++)
          if (internal.current.idleAnimationFrame > 10) {
            internal.current.idleAnimation = null
            internal.current.hasPlayedIdle = true
          }
        } else {
          setSprite("idle", 0)
        }
        return
      }

      internal.current.lastCatMoveTime = Date.now()
      internal.current.hasPlayedIdle = false

      if (internal.current.idleTime > 0) {
        setSprite("alert", 0)
        internal.current.idleTime--
        return
      }

      let direction = ""
      direction += diffY / distance > 0.5 ? "N" : diffY / distance < -0.5 ? "S" : ""
      direction += diffX / distance > 0.5 ? "W" : diffX / distance < -0.5 ? "E" : ""
      setSprite(direction || "S", internal.current.frameCount++)

      internal.current.nekoX -= (diffX / distance) * speed
      internal.current.nekoY -= (diffY / distance) * speed
      internal.current.nekoX = Math.min(Math.max(16, internal.current.nekoX), window.innerWidth - 16)
      internal.current.nekoY = Math.min(Math.max(16, internal.current.nekoY), window.innerHeight - 16)

      if (nekoRef.current) {
        nekoRef.current.style.left = `${internal.current.nekoX - 16}px`
        nekoRef.current.style.top = `${internal.current.nekoY - 16}px`
      }
    },
    [isChasing, speed, idleAfter, sleepAfter, setSprite, toggleState],
  )

  useEffect(() => {
    let rafId: number
    let lastTimestamp = 0
    const loop = (timestamp: number) => {
      if (timestamp - lastTimestamp > 100) {
        handleLogic(timestamp)
        lastTimestamp = timestamp
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [handleLogic])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      internal.current.mouseX = e.clientX
      internal.current.mouseY = e.clientY
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`oneko-container ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        width: 32,
        height: 32,
        verticalAlign: "middle",
        ...style,
      }}
    >
      <div
        ref={nekoRef}
        aria-hidden="true"
        onClick={() => toggleState(isChasing, true)}
        style={{
          width: 32,
          height: 32,
          position: isChasing ? "fixed" : "absolute",
          backgroundImage: "url('/oneko.gif')",
          imageRendering: "pixelated",
          cursor: "pointer",
          zIndex: 9999,
          left: isChasing ? `${internal.current.nekoX - 16}px` : `${internal.current.asleepX}px`,
          top: isChasing ? `${internal.current.nekoY - 16}px` : `${internal.current.asleepY}px`,
          pointerEvents: "auto",
        }}
      />
    </div>
  )
}

export default Oneko
