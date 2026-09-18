import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ParkedSpot } from '../../store/app'

/*
  A basement floor drawn from the saved spot, not from a floor plan we do not
  have: zones become rows of bays, pillars sit every two bays, other cars fill
  the bays at the venue's occupancy, and the walk from the lift lobby to your
  car glows. One unit is about two metres.
*/

interface Props {
  spot: ParkedSpot
  zones: string[]
  occupancy: number
  dark: boolean
  onWalk?: (metres: number) => void
}

const BAY_W = 1.25
const BAY_D = 2.4
const AISLE = 3.2
const PILLAR_EVERY = 2

const COLORS = {
  light: { bg: 0xeceae4, floor: 0xd9d6ce, line: 0xffffff, pillar: 0xf4f2ec, car: [0xb9bdb9, 0xa7aca8, 0xc9c5bd, 0x8f9591, 0xd2d0c9] },
  dark: { bg: 0x0b0e0d, floor: 0x161b19, line: 0x3a423e, pillar: 0x252c29, car: [0x2a302d, 0x323936, 0x262b29, 0x3b433f, 0x1f2422] },
}

function labelSprite(text: string, color: string, bg: string, scale = 1) {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  const font = `800 64px "Plus Jakarta Sans Variable", system-ui, sans-serif`
  ctx.font = font
  const w = Math.ceil(ctx.measureText(text).width) + 56
  c.width = w
  c.height = 104
  ctx.font = font
  ctx.fillStyle = bg
  const r = 40
  ctx.beginPath()
  ctx.roundRect(0, 0, w, 104, r)
  ctx.fill()
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 28, 55)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  sprite.scale.set((w / 104) * 0.9 * scale, 0.9 * scale, 1)
  sprite.renderOrder = 10
  return sprite
}

function makeCar(color: number, glow = false) {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.25 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 2.05), bodyMat)
  body.position.y = 0.36
  g.add(body)
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.34, 1.05),
    new THREE.MeshStandardMaterial({ color: glow ? 0x0c0f0d : 0x1a1f1d, roughness: 0.2, metalness: 0.6 }),
  )
  cabin.position.set(0, 0.72, -0.1)
  g.add(cabin)
  const wheel = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 16)
  const tire = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  for (const [x, z] of [
    [-0.46, 0.68],
    [0.46, 0.68],
    [-0.46, -0.68],
    [0.46, -0.68],
  ]) {
    const w = new THREE.Mesh(wheel, tire)
    w.rotation.z = Math.PI / 2
    w.position.set(x, 0.2, z)
    g.add(w)
  }
  if (glow) {
    const lamp = new THREE.MeshBasicMaterial({ color: 0xfff6d5 })
    for (const x of [-0.3, 0.3]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.04), lamp)
      l.position.set(x, 0.42, 1.03)
      g.add(l)
    }
  }
  return g
}

// Deterministic pseudo random so the same spot always draws the same floor.
function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export default function FloorScene({ spot, zones, occupancy, dark, onWalk }: Props) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const pal = dark ? COLORS.dark : COLORS.light
    const width = el.clientWidth
    const height = el.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(pal.bg)
    scene.fog = new THREE.Fog(pal.bg, 38, 70)

    // Layout: each zone is a double row of bays facing a shared aisle.
    const zi = Math.max(0, zones.indexOf(spot.zone))
    const rows = Math.max(12, Math.ceil(spot.pillar / PILLAR_EVERY) * PILLAR_EVERY + 4)
    const zoneW = BAY_D * 2 + AISLE
    const floorW = zones.length * zoneW + AISLE
    const floorD = rows * BAY_W + 6
    const x0 = -floorW / 2 + AISLE / 2
    const z0 = -floorD / 2 + 4

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(floorW + 4, 0.2, floorD + 4),
      new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.95 }),
    )
    floor.position.y = -0.1
    floor.receiveShadow = true
    scene.add(floor)

    const lineMat = new THREE.MeshBasicMaterial({ color: pal.line, transparent: true, opacity: dark ? 0.9 : 0.85 })
    const pillarMat = new THREE.MeshStandardMaterial({ color: pal.pillar, roughness: 0.8 })
    const pillarGeo = new THREE.BoxGeometry(0.5, 2.6, 0.5)
    const rand = rng(spot.pillar * 131 + zi * 17 + spot.level.charCodeAt(0))
    const carPalette = pal.car

    let target = new THREE.Vector3()

    zones.forEach((zone, i) => {
      const cx = x0 + i * zoneW + BAY_D
      for (const side of [-1, 1]) {
        const bx = cx + side * (BAY_D / 2 + 0.05)
        for (let r = 0; r < rows; r++) {
          const bz = z0 + r * BAY_W + BAY_W / 2
          // Bay divider line
          const line = new THREE.Mesh(new THREE.PlaneGeometry(BAY_D, 0.05), lineMat)
          line.rotation.x = -Math.PI / 2
          line.position.set(bx, 0.011, bz - BAY_W / 2)
          scene.add(line)

          const pillarNo = r + 1
          const mine = i === zi && side === 1 && pillarNo === spot.pillar
          if (mine) {
            target = new THREE.Vector3(bx, 0, bz)
            continue
          }
          if (rand() < occupancy) {
            const car = makeCar(carPalette[Math.floor(rand() * carPalette.length)])
            car.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2
            car.position.set(bx, 0, bz)
            car.traverse((o) => ((o as THREE.Mesh).castShadow = true))
            scene.add(car)
          }
        }
      }
      // Pillars between the two bay rows, every two bays, numbered like the signs.
      for (let r = 0; r <= rows; r += PILLAR_EVERY) {
        const p = new THREE.Mesh(pillarGeo, pillarMat)
        p.position.set(cx, 1.3, z0 + r * BAY_W)
        p.castShadow = true
        scene.add(p)
      }
      const zl = labelSprite(zone, dark ? '#f1f4f2' : '#111512', dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,21,18,0.08)', 1.3)
      zl.position.set(cx, 3.4, z0 - 1.2)
      scene.add(zl)
    })

    // Lift lobby at the front edge, centred.
    const lobby = new THREE.Group()
    const lobbyBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1f5fd6, roughness: 0.4, emissive: 0x1f5fd6, emissiveIntensity: 0.25 }),
    )
    lobbyBox.position.y = 1.4
    lobby.add(lobbyBox)
    const lobbyLabel = labelSprite(spot.lobby.toUpperCase(), '#ffffff', '#1f5fd6', 0.9)
    lobbyLabel.position.y = 3.6
    lobby.add(lobbyLabel)
    const lobbyPos = new THREE.Vector3(0, 0, z0 - 3)
    lobby.position.copy(lobbyPos)
    scene.add(lobby)

    // Your car, lit up.
    const mine = makeCar(0x10b981, true)
    mine.rotation.y = Math.PI / 2
    mine.position.copy(target)
    mine.traverse((o) => ((o as THREE.Mesh).castShadow = true))
    scene.add(mine)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.45, 48),
      new THREE.MeshBasicMaterial({ color: 0x43ff9f, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(target.x, 0.03, target.z)
    scene.add(ring)
    const tag = labelSprite(`${spot.level} · ${spot.zone}-${spot.pillar}`, '#0c0f0d', '#43ff9f', 1.1)
    tag.position.set(target.x, 2.6, target.z)
    scene.add(tag)

    // Walking path: lobby, along the aisle next to your zone, then to the car.
    const aisleX = x0 + zi * zoneW + BAY_D * 2 + AISLE / 2 - 0.05
    const pts = [
      new THREE.Vector3(lobbyPos.x, 0.06, lobbyPos.z + 0.9),
      new THREE.Vector3(lobbyPos.x, 0.06, z0 - 0.8),
      new THREE.Vector3(aisleX, 0.06, z0 - 0.8),
      new THREE.Vector3(aisleX, 0.06, target.z),
      new THREE.Vector3(target.x + 1.3, 0.06, target.z),
    ]
    let metres = 0
    for (let i = 1; i < pts.length; i++) metres += pts[i].distanceTo(pts[i - 1]) * 2
    onWalk?.(metres)
    const curve = new THREE.CurvePath<THREE.Vector3>()
    for (let i = 1; i < pts.length; i++) curve.add(new THREE.LineCurve3(pts[i - 1], pts[i]))
    const pathMat = new THREE.MeshBasicMaterial({ color: 0x43ff9f, transparent: true, opacity: 0.95 })
    const path = new THREE.Mesh(new THREE.TubeGeometry(curve as unknown as THREE.Curve<THREE.Vector3>, 220, 0.12, 8, false), pathMat)
    path.geometry.setDrawRange(0, 0)
    scene.add(path)
    const totalIdx = path.geometry.index ? path.geometry.index.count : 0

    // Moving dot that walks the path on loop.
    const walker = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    scene.add(walker)

    // Light
    scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x0b0e0d : 0xd8d4c8, dark ? 0.7 : 1.4))
    const sun = new THREE.DirectionalLight(0xffffff, dark ? 1.1 : 1.6)
    sun.position.set(-14, 26, 18)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    const sc = sun.shadow.camera
    sc.left = -floorW
    sc.right = floorW
    sc.top = floorD
    sc.bottom = -floorD
    scene.add(sun)
    const spot3 = new THREE.PointLight(0x43ff9f, 18, 9, 1.6)
    spot3.position.set(target.x, 2.2, target.z)
    scene.add(spot3)

    // Camera: isometric-ish, framing the floor with the car in view.
    const aspect = width / height
    const span = Math.max(floorW, floorD * 0.7) * 0.62
    const camera = new THREE.OrthographicCamera(-span * aspect, span * aspect, span, -span, 0.1, 200)
    camera.position.set(target.x * 0.4 - 28, 30, target.z * 0.5 + 30)
    camera.zoom = 1.25
    camera.updateProjectionMatrix()
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(target.x * 0.5, 0, (target.z + lobbyPos.z) / 2)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minZoom = 0.8
    controls.maxZoom = 3
    controls.maxPolarAngle = Math.PI / 2.4
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.addEventListener('start', () => (controls.autoRotate = false))

    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      const draw = Math.min(1, t / 1.6)
      path.geometry.setDrawRange(0, Math.floor(totalIdx * draw))
      const k = (t * 0.22) % 1
      walker.position.copy(curve.getPointAt(k))
      walker.position.y = 0.34
      walker.visible = draw >= 1
      const pulse = (Math.sin(t * 3) + 1) / 2
      ring.scale.setScalar(1 + pulse * 0.25)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + (1 - pulse) * 0.5
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      const a = w / h
      camera.left = -span * a
      camera.right = span * a
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [spot, zones, occupancy, dark, onWalk])

  return <div ref={host} className="h-full w-full touch-none" />
}
