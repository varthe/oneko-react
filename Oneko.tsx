import { useEffect, useRef } from "react"
import { Fragment } from "react"

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

type OnekoProps = {
  offsetX?: number
  speed?: number
  sleepAfter?: number
  idleAfter?: number
}

export default function Oneko({ offsetX = 0, speed = 10, sleepAfter = 10000, idleAfter = 5000 }: OnekoProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const nekoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches === true
    if (isReducedMotion) return

    const nekoEl = nekoRef.current
    if (!nekoEl) return

    const anchor = anchorRef.current
    const rect = anchor?.getBoundingClientRect()
    let nekoPosX = (rect ? rect.left + rect.width / 2 : 32) + offsetX
    let nekoPosY = rect ? rect.top + rect.height / 2 : 32
    let mousePosX = 0
    let mousePosY = 0
    let frameCount = 0
    let idleTime = 200
    let idleAnimation: string | null = "sleeping"
    let idleAnimationFrame = 100
    let lastFrameTimestamp: number | undefined
    let rafId: number

    nekoEl.style.left = `${nekoPosX - 16}px`
    nekoEl.style.top = `${nekoPosY - 16}px`

    function setSprite(name: string, frame: number) {
      const sprites = SPRITE_SETS[name]
      const sprite = sprites[frame % sprites.length]
      nekoEl!.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`
    }

    function resetIdleAnimation() {
      idleAnimation = null
      idleAnimationFrame = 0
    }

    function idle() {
      idleTime += 1

      if (idleAnimation === null && !hasIdled && Date.now() - lastMouseMoveTime > idleAfter) {
        const wallOptions: string[] = []
        if (mousePosX < 64) wallOptions.push("scratchWallW")
        if (mousePosY < 64) wallOptions.push("scratchWallN")
        if (mousePosX > window.innerWidth - 64) wallOptions.push("scratchWallE")
        if (mousePosY > window.innerHeight - 64) wallOptions.push("scratchWallS")
        const available = wallOptions.length > 0 ? wallOptions : ["scratchSelf"]
        idleAnimation = available[Math.floor(Math.random() * available.length)]
        hasIdled = true
      }

      switch (idleAnimation) {
        case "sleeping":
          if (idleAnimationFrame < 8) {
            setSprite("tired", 0)
            break
          }
          setSprite("sleeping", Math.floor(idleAnimationFrame / 4))
          if (idleAnimationFrame > 192) resetIdleAnimation()
          break
        case "scratchWallN":
        case "scratchWallS":
        case "scratchWallE":
        case "scratchWallW":
        case "scratchSelf":
          setSprite(idleAnimation, idleAnimationFrame)
          if (idleAnimationFrame > 9) resetIdleAnimation()
          break
        default:
          setSprite("idle", 0)
          return
      }
      idleAnimationFrame += 1
    }

    function frame() {
      frameCount += 1
      const diffX = nekoPosX - mousePosX
      const diffY = nekoPosY - mousePosY
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2)

      if (distance < speed || distance < 48) {
        idle()
        return
      }

      idleAnimation = null
      idleAnimationFrame = 0
      hasIdled = false

      if (idleTime > 1) {
        setSprite("alert", 0)
        idleTime = Math.min(idleTime, 7)
        idleTime -= 1
        return
      }

      let direction = ""
      direction += diffY / distance > 0.5 ? "N" : ""
      direction += diffY / distance < -0.5 ? "S" : ""
      direction += diffX / distance > 0.5 ? "W" : ""
      direction += diffX / distance < -0.5 ? "E" : ""
      setSprite(direction, frameCount)

      nekoPosX -= (diffX / distance) * speed
      nekoPosY -= (diffY / distance) * speed
      nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16)
      nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16)

      nekoEl!.style.left = `${nekoPosX - 16}px`
      nekoEl!.style.top = `${nekoPosY - 16}px`
    }

    let lastMouseMoveTime = 0
    let hasIdled = false
    let sleepFrame = 0
    let lastSleepTimestamp: number | undefined
    let sleepRafId: number
    let yawnTimeoutId: number
    let isSleeping = true

    function onSleepFrame(timestamp: number) {
      if (!lastSleepTimestamp) lastSleepTimestamp = timestamp
      if (timestamp - lastSleepTimestamp > 600) {
        lastSleepTimestamp = timestamp
        setSprite("sleeping", sleepFrame)
        sleepFrame += 1
      }
      sleepRafId = window.requestAnimationFrame(onSleepFrame)
    }

    function wake(x: number, y: number, alert = false) {
      window.cancelAnimationFrame(sleepRafId)
      window.clearTimeout(yawnTimeoutId)
      isSleeping = false
      mousePosX = x
      mousePosY = y
      lastMouseMoveTime = Date.now()
      idleTime = alert ? 7 : 0
      idleAnimation = null
      idleAnimationFrame = 0
      hasIdled = false
      lastFrameTimestamp = undefined
      nekoEl!.style.pointerEvents = "none"
      nekoEl!.style.cursor = "default"
      document.addEventListener("mousemove", onMouseMove)
      rafId = window.requestAnimationFrame(onAnimationFrameWithSleepCheck)
    }

    function onWake(event: MouseEvent) {
      nekoEl!.removeEventListener("click", onWake)
      wake(event.clientX, event.clientY)
    }

    function onAutoWake(event: MouseEvent) {
      document.removeEventListener("mousemove", onAutoWake)
      wake(event.clientX, event.clientY, true)
    }

    function goToSleep() {
      isSleeping = true
      window.cancelAnimationFrame(rafId)
      document.removeEventListener("mousemove", onMouseMove)
      setSprite("tired", 0)
      yawnTimeoutId = window.setTimeout(() => {
        sleepFrame = 0
        lastSleepTimestamp = undefined
        sleepRafId = window.requestAnimationFrame(onSleepFrame)
        document.addEventListener("mousemove", onAutoWake)
      }, 1000)
    }

    function repositionToAnchor() {
      if (!isSleeping || !anchor) return
      const newRect = anchor.getBoundingClientRect()
      nekoPosX = newRect.left + newRect.width / 2 + offsetX
      nekoPosY = newRect.top + newRect.height / 2
      nekoEl!.style.left = `${nekoPosX - 16}px`
      nekoEl!.style.top = `${nekoPosY - 16}px`
    }

    function onResize() {
      repositionToAnchor()
    }

    function onMouseMove(event: MouseEvent) {
      mousePosX = event.clientX
      mousePosY = event.clientY
      lastMouseMoveTime = Date.now()
    }

    function onAnimationFrameWithSleepCheck(timestamp: number) {
      if (Date.now() - lastMouseMoveTime > sleepAfter && idleAnimation === null) {
        goToSleep()
        return
      }
      if (!lastFrameTimestamp) lastFrameTimestamp = timestamp
      if (timestamp - lastFrameTimestamp > 100) {
        lastFrameTimestamp = timestamp
        frame()
      }
      rafId = window.requestAnimationFrame(onAnimationFrameWithSleepCheck)
    }

    // Set sleeping sprite immediately to avoid flash
    setSprite("sleeping", 0)
    nekoEl.style.pointerEvents = "auto"
    nekoEl.style.cursor = "pointer"
    sleepRafId = window.requestAnimationFrame(onSleepFrame)
    nekoEl.addEventListener("click", onWake)
    window.addEventListener("resize", onResize)
    if (document.readyState !== "complete") {
      window.addEventListener("load", repositionToAnchor)
    }

    return () => {
      window.cancelAnimationFrame(rafId)
      window.cancelAnimationFrame(sleepRafId)
      window.clearTimeout(yawnTimeoutId)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mousemove", onAutoWake)
      nekoEl.removeEventListener("click", onWake)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("load", repositionToAnchor)
    }
  }, [anchorRef])

  return (
    <Fragment>
      <span ref={anchorRef} aria-hidden="true" style={{ display: "inline-block", width: 0, height: 0 }} />
      <div
        ref={nekoRef}
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          position: "fixed",
          pointerEvents: "none",
          imageRendering: "pixelated",
          zIndex: 2147483647,
          backgroundImage: "url(./oneko.gif)",
        }}
      />
    </Fragment>
  )
}
