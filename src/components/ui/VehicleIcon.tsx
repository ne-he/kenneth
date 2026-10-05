import { Motorcycle } from '@phosphor-icons/react'
import clsx from 'clsx'
import { bodyOf } from '../../lib/carBody'
import { spriteIdOf, spriteUrl, type CarView } from '../../lib/carCatalog'
import { DEFAULT_PAINT, usePaintedSprite, type CarPaint } from '../../lib/carPaint'
import type { CarBody, Vehicle } from '../../store/app'

/*
  Side views of the four shapes people tell their cars apart by, drawn on
  Phosphor's 256 grid and weight so they sit next to its motorbike. Windows
  and hubs are holes, so the icon reads on any background. The SUV rides
  higher on bigger wheels.
*/
const WHEELS =
  'M40,184 a24,24 0 1 0 48,0 a24,24 0 1 0 -48,0 Z M55,184 a9,9 0 1 0 18,0 a9,9 0 1 0 -18,0 Z ' +
  'M168,184 a24,24 0 1 0 48,0 a24,24 0 1 0 -48,0 Z M183,184 a9,9 0 1 0 18,0 a9,9 0 1 0 -18,0 Z'
const HIGH_WHEELS =
  'M36,182 a28,28 0 1 0 56,0 a28,28 0 1 0 -56,0 Z M53,182 a11,11 0 1 0 22,0 a11,11 0 1 0 -22,0 Z ' +
  'M164,182 a28,28 0 1 0 56,0 a28,28 0 1 0 -56,0 Z M181,182 a11,11 0 1 0 22,0 a11,11 0 1 0 -22,0 Z'
const SILL = 'V184 H224 A32,32 0 0 0 160,184 H96 A32,32 0 0 0 32,184 H16 Z'

const PATHS: Record<CarBody, { body: string; wheels: string }> = {
  hatch: {
    body:
      'M16,184 V112 Q16,98 28,94 L52,84 Q60,80 70,80 H136 Q144,80 150,86 L184,122 L224,128 Q240,131 240,148 ' +
      SILL +
      ' M64,96 H92 V124 H36 Z M100,96 H134 L160,124 H100 Z',
    wheels: WHEELS,
  },
  sedan: {
    body:
      'M16,184 V150 Q16,134 32,132 L64,128 L98,90 Q102,86 108,86 H146 Q152,86 156,90 L188,124 L226,130 Q240,133 240,150 ' +
      SILL +
      ' M106,100 H118 V126 H80 Z M126,100 H144 L170,126 H126 Z',
    wheels: WHEELS,
  },
  mpv: {
    body:
      'M16,184 V74 Q16,60 30,60 H138 Q148,60 154,66 L208,118 L230,124 Q240,128 240,144 ' +
      SILL +
      ' M32,76 H74 V114 H32 Z M82,76 H128 V114 H82 Z M136,76 H150 L188,114 H136 Z',
    wheels: WHEELS,
  },
  suv: {
    body:
      'M16,172 V78 Q16,64 30,64 H148 Q156,64 160,70 L178,100 L228,104 Q240,106 240,122 ' +
      'V172 H225.5 A35,35 0 0 0 158.5,172 H97.5 A35,35 0 0 0 30.5,172 H16 Z' +
      ' M32,80 H96 V100 H32 Z M104,80 H146 L160,100 H104 Z',
    wheels: HIGH_WHEELS,
  },
}

export function BodyIcon({ body, size = 18, className }: { body: CarBody; size?: number; className?: string }) {
  const p = PATHS[body]
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className={className}>
      <path fillRule="evenodd" d={p.body} />
      <path fillRule="evenodd" d={p.wheels} />
    </svg>
  )
}

/**
 * A car's isometric render, in its paint. `height` sets the size; the frame is
 * 3:2 and the car stands on its bottom edge. The front view faces down-left,
 * the rear view up-right, and mirroring turns either one around.
 */
export function CarSprite({
  id,
  paint,
  view = 'front',
  mirror = false,
  height,
  className,
}: {
  id: string
  paint: CarPaint
  view?: CarView
  mirror?: boolean
  height: number
  className?: string
}) {
  const src = usePaintedSprite(spriteUrl(id, view), paint)
  const width = Math.round(height * 1.5)
  return (
    <span aria-hidden="true" className={clsx('relative inline-block shrink-0', className)} style={{ width, height }}>
      {src && (
        <img
          src={src}
          alt=""
          width={width}
          height={height}
          draggable={false}
          className="absolute inset-0 size-full select-none"
          style={mirror ? { transform: 'scaleX(-1)' } : undefined}
        />
      )}
    </span>
  )
}

/**
 * One vehicle's icon. Where there is room (28 px and up) a car is its own 3D
 * model in its paint, or the template car when the model is not in the list;
 * smaller, or before any render exists, it is the flat shape. A motorbike is
 * Phosphor's motorbike.
 */
export function VehicleIcon({
  vehicle,
  size = 18,
  className,
}: {
  vehicle: Pick<Vehicle, 'kind' | 'model' | 'body' | 'modelId' | 'paint'>
  size?: number
  className?: string
}) {
  if (vehicle.kind === 'motor') return <Motorcycle size={size} weight="fill" className={className} />
  const sprite = size >= 28 ? spriteIdOf(vehicle) : undefined
  if (sprite) return <CarSprite id={sprite} paint={vehicle.paint ?? DEFAULT_PAINT} height={size} className={className} />
  return <BodyIcon body={bodyOf(vehicle)} size={size} className={className} />
}
