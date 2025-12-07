# Plan: Add Interesting Map Elements to Matrics FPS Game

## Overview
Transform the current flat, empty 100x100 gray plane into an interesting tactical map by adding 9 diverse environmental elements including obstacles, structures, platforms, and visual variety.

## Current State
- Completely flat gray plane (100x100 units) with grid overlay
- No obstacles or structures
- Scene setup in `game.js` lines 27-90
- Floor created at lines 69-77

## User Requirements
- Add 5-10 simple map elements (targeting 9 total)
- Mix of: obstacles/cover, buildings/structures, vertical elements (platforms/ramps), visual variety
- Keep complexity simple

## Implementation Plan

### 1. Create Map Elements Function
**Location:** Add new function after `createWeapon()` function (after line 127 in game.js)

Create `createMapElements()` function that will generate all map geometry:
- Use MeshPhongMaterial for consistency with existing code style
- Enable castShadow and receiveShadow on all elements
- Use varied colors for visual interest

### 2. Map Elements to Create

#### Central Tower (1 element)
- **Size:** 5x5 base, 10 units tall
- **Position:** (0, 5, 0) - world center
- **Color:** Dark gray (0x444444)
- **Purpose:** Vertical landmark, tactical high ground
- **Code:** BoxGeometry(5, 10, 5)

#### Corner Bunkers (4 elements)
- **Size:** 3x3x3 cubes
- **Positions:**
  - (25, 1.5, 25)
  - (-25, 1.5, 25)
  - (25, 1.5, -25)
  - (-25, 1.5, -25)
- **Color:** Orange-red (0xFF6633)
- **Purpose:** Corner cover points
- **Code:** 4x BoxGeometry(3, 3, 3)

#### Divider Walls (2 elements)
- **Size:** 1.5 thick x 4 tall x 20 long
- **Positions:**
  - (15, 2, 0) - vertical wall (no rotation)
  - (0, 2, 15) - horizontal wall (rotated 90°)
- **Color:** Dark blue (0x2C5AA0)
- **Purpose:** Create lanes and sightline blockers
- **Code:** 2x BoxGeometry with different rotations

#### Ramp Structures (2 elements)
- **Size:** Boxes rotated 30° to create ramps
- **Positions:**
  - (-20, 0, -20) - low ramp
  - (20, 0, -20) - medium ramp
- **Color:** Teal-green (0x33DD99)
- **Purpose:** Visual variety and movement interest
- **Code:** BoxGeometry rotated on z-axis (Math.PI / 6)

### 3. Code Structure

Add function call in `init()`:
- **Location:** After line 77 (gridHelper), before line 79 (createWeapon)
- **Call:** `createMapElements();`

### 4. Implementation Details

Each map element will:
- Use `new THREE.BoxGeometry()` for consistency
- Use `new THREE.MeshPhongMaterial({ color: 0xHEXCODE })`
- Set `mesh.castShadow = true`
- Set `mesh.receiveShadow = true`
- Add to scene with `scene.add(mesh)`
- Position using `mesh.position.set(x, y, z)`
- Rotate if needed using `mesh.rotation.y = angle`

### 5. Critical File

**File to modify:** `/Users/oskar/git/matrics/game.js`
- Add `createMapElements()` function after line 127
- Add function call `createMapElements();` after line 77

### 6. Important Considerations

- **No collision physics:** Players can walk through objects (current game limitation)
- **Spawn overlap:** Players spawn randomly in -10 to +10 area, may spawn inside central tower (acceptable - they respawn after 3 seconds if needed)
- **Shadow system:** All elements automatically integrate with existing shadow mapping
- **Performance:** 9 simple box meshes have negligible performance impact

## Success Criteria
- Map has visual variety with 9 distinct colored elements
- Elements are spread across the play area
- Central tower creates vertical interest
- Corner bunkers define play zones
- Walls create tactical lanes
- Ramps add geometric variety
- All elements cast/receive shadows properly
