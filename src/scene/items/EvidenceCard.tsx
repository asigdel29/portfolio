import { Suspense, useMemo } from 'react'
import { Text, Html, useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { EvidenceItem } from '../../state/boardTypes'
import { useSelectionStore } from '../../state/selectionStore'
import { useBoardStore } from '../../state/boardStore'
import { ITEM_VISUALS, stickyColorForId } from './itemVisuals'
import { createPaperMaterial } from './paperMaterial'
import { Pin } from '../Pin'
import { projectPointerToBoard } from '../../engine/picking/boardPlane'
import { beginItemDrag } from '../../interactions/dragState'
import { isConnectModeActive, handleItemClickForConnect } from '../../interactions/connectMode'
import { useThree } from '@react-three/fiber'
import { CORK_FRONT_Z } from '../Board'

/** Vertex subdivisions on the card face; needed for the paper-bend shader in `paperMaterial.ts` to have anything to displace. */
const FACE_SEGMENTS = 8

/**
 * Renders a single evidence item as a true 3D card: a subdivided, subtly
 * bent paper mesh, an optional photo texture, a caption, and a pushpin.
 *
 * Pointer-down starts a board-plane drag (see `interactions/dragState`)
 * rather than anything physics-driven — items are user-placed paper on a
 * board, not falling bodies, so a direct state-driven drag is both simpler
 * and more predictable than a kinematic/dynamic Rapier body per item.
 */
export function EvidenceCard({ item }: { item: EvidenceItem }) {
  const { camera } = useThree()
  const visual = ITEM_VISUALS[item.kind]
  const isSelected = useSelectionStore((s) => s.selectedItemIds.has(item.id))
  const isConnectOrigin = useSelectionStore((s) => s.connectingFromItemId === item.id)
  const isEditing = useSelectionStore((s) => s.editingItemId === item.id)
  const setHovered = useSelectionStore((s) => s.setHovered)
  const setItemText = useBoardStore((s) => s.setItemText)

  const baseColor = item.kind === 'sticky-note' ? stickyColorForId(item.id) : visual.baseColor

  const seed = useMemo(() => hashSeed(item.id), [item.id])
  const material = useMemo(() => createPaperMaterial(baseColor, seed), [baseColor, seed])

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    if (isConnectModeActive()) {
      handleItemClickForConnect(item.id)
      return
    }
    if (e.shiftKey) {
      useSelectionStore.getState().select(item.id, true)
      return
    }
    const boardPoint = projectPointerToBoard(camera, e.pointer)
    if (boardPoint) beginItemDrag(item.id, boardPoint)
  }

  function onDoubleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    if (isConnectModeActive()) return
    useSelectionStore.getState().setEditing(item.id)
  }

  return (
    <group
      position={[item.position.x, item.position.y, CORK_FRONT_Z + visual.thickness / 2 + item.position.z]}
      rotation={[0, 0, item.rotation]}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(item.id)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        if (useSelectionStore.getState().hoveredItemId === item.id) setHovered(null)
      }}
    >
      <mesh material={material} receiveShadow castShadow>
        <boxGeometry args={[visual.width, visual.height, visual.thickness, FACE_SEGMENTS, FACE_SEGMENTS, 1]} />
      </mesh>

      {(isSelected || isConnectOrigin) && (
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[visual.width + 0.12, visual.height + 0.12, 0.02]} />
          <meshBasicMaterial color={isConnectOrigin ? '#ff5c33' : '#4da6ff'} transparent opacity={0.55} />
        </mesh>
      )}

      {visual.showsImage && item.imageUrl && (
        <Suspense fallback={null}>
          <PhotoFace url={item.imageUrl} width={visual.width * 0.88} height={visual.height * 0.7} z={visual.thickness / 2 + 0.001} />
        </Suspense>
      )}

      {visual.showsImage && !item.imageUrl && (
        <mesh position={[0, visual.height * 0.06, visual.thickness / 2 + 0.001]}>
          <planeGeometry args={[visual.width * 0.88, visual.height * 0.7]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </mesh>
      )}

      {item.kind === 'sticky-note' && item.text && !isEditing && (
        <Text
          position={[0, 0.05, visual.thickness / 2 + 0.002]}
          fontSize={0.15}
          maxWidth={visual.width - 0.35}
          color="#2a2410"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
        >
          {item.text}
        </Text>
      )}

      {item.label && (
        <Text
          position={[0, -visual.height / 2 + 0.22, visual.thickness / 2 + 0.002]}
          fontSize={0.16}
          maxWidth={visual.width - 0.3}
          color="#1a1a1a"
          anchorX="center"
          anchorY="middle"
        >
          {item.label}
        </Text>
      )}

      {item.kind !== 'sticky-note' && (
        <Pin position={[0, visual.height / 2 - 0.05, visual.thickness / 2 + 0.05]} />
      )}

      {item.metadata.clusterId && (
        <mesh position={[-visual.width / 2 + 0.14, -visual.height / 2 + 0.14, visual.thickness / 2 + 0.003]}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color={clusterColor(item.metadata.clusterId)} />
        </mesh>
      )}

      {isEditing && (
        <Html center position={[0, 0, visual.thickness / 2 + 0.01]} transform distanceFactor={6} style={{ pointerEvents: 'auto' }}>
          <textarea
            autoFocus
            defaultValue={item.text}
            style={{
              width: visual.width * 34,
              height: visual.height * 34,
              padding: 8,
              fontSize: 15,
              fontFamily: 'inherit',
              resize: 'none',
              border: '2px solid #4da6ff',
              borderRadius: 4,
              background: baseColor,
              color: '#1a1a1a',
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              setItemText(item.id, e.target.value)
              useSelectionStore.getState().setEditing(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') e.currentTarget.blur()
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.blur()
            }}
          />
        </Html>
      )}
    </group>
  )
}

function PhotoFace({ url, width, height, z }: { url: string; width: number; height: number; z: number }) {
  const texture = useTexture(url)
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[0, height * 0.06, z]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} roughness={0.5} />
    </mesh>
  )
}

function hashSeed(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return (hash % 1000) / 100
}

/** Deterministic accent color for an AI-assigned cluster id, so all items in the same cluster read as visually grouped. */
const CLUSTER_COLORS = ['#e0b84c', '#5cc9e8', '#8bd17c', '#e07cc9', '#e8975c']
function clusterColor(clusterId: string): string {
  let hash = 0
  for (let i = 0; i < clusterId.length; i++) hash = (hash * 31 + clusterId.charCodeAt(i)) >>> 0
  return CLUSTER_COLORS[hash % CLUSTER_COLORS.length]
}
