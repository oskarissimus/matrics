# Implementation Plan: Player Name Entry with localStorage Persistence

## Overview
Add a modal-based player name entry system that delays socket connection until the player submits their name, with localStorage persistence for returning players.

## Requirements
- Modal overlay UI for name entry before joining
- Name persisted in browser localStorage
- Auto-populate text field with saved name on return visits
- Validation: 3-20 characters, letters/numbers/spaces/basic punctuation only
- Fallback to auto-generated name (Player1, Player2) if empty/invalid

---

## Implementation Steps

### Step 1: Add Modal HTML to index.html

**Location:** After line 145 (before script tags)

Add modal structure:
```html
<div id="nameModal">
    <div id="nameModalContent">
        <h2>Enter Your Name</h2>
        <input type="text" id="nameInput" placeholder="Your name (3-20 characters)" maxlength="20" autocomplete="off" />
        <div id="nameError"></div>
        <button id="joinButton">Join Game</button>
    </div>
</div>
```

### Step 2: Add Modal CSS to index.html

**Location:** After line 127 (end of existing styles, before `</style>`)

Add styles for:
- `#nameModal` - full-screen overlay with semi-transparent black background, flexbox centering, z-index: 1000
- `#nameModalContent` - white card with padding, border-radius, shadow, min-width: 400px
- `#nameInput` - full-width text input with focus state
- `#nameError` - red error text display
- `#joinButton` - green button with hover state
- `.hidden` - utility class with display: none

### Step 3: Add Client-Side JavaScript (game.js)

**3a. Add global variables** (after line 25):
```javascript
const STORAGE_KEY = 'matrics_player_name';
let pendingPlayerName = null;
```

**3b. Add localStorage functions** (after init function, ~line 99):
- `loadSavedName()` - returns saved name from localStorage or empty string
- `saveName(name)` - saves name to localStorage with try-catch for private browsing

**3c. Add validation function**:
```javascript
function validatePlayerName(name) {
    const trimmedName = name.trim();
    if (trimmedName.length < 3) return { valid: false, error: 'Name must be at least 3 characters' };
    if (trimmedName.length > 20) return { valid: false, error: 'Name must be 20 characters or less' };
    const validPattern = /^[a-zA-Z0-9 .,!?'-]+$/;
    if (!validPattern.test(trimmedName)) return { valid: false, error: 'Name can only contain letters, numbers, spaces, and basic punctuation' };
    return { valid: true, name: trimmedName };
}
```

**3d. Add modal control functions**:
- `showNameModal()` - load saved name, show modal, set up event listeners for button click and Enter key
- `hideNameModal()` - add 'hidden' class to modal

**3e. Modify init() function** (line 94):
- Replace `connectToServer()` with `showNameModal()`

**3f. Modify connectToServer()** (line 471):
- Change `socket = io()` to pass name via query:
```javascript
socket = io({
    query: { playerName: pendingPlayerName || '' }
});
```

### Step 4: Add Server-Side Validation (server.js)

**4a. Add validation function** (after line 30, before connection handler):
```javascript
function validatePlayerName(name) {
    if (!name || typeof name !== 'string') return { valid: false };
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 20) return { valid: false };
    const validPattern = /^[a-zA-Z0-9 .,!?'-]+$/;
    if (!validPattern.test(trimmedName)) return { valid: false };
    return { valid: true, name: trimmedName };
}
```

**4b. Modify connection handler** (lines 37-40):
```javascript
const clientName = socket.handshake.query.playerName;
const validation = validatePlayerName(clientName);
playerCount++;
const playerName = validation.valid ? validation.name : `Player${playerCount}`;
```

Then use `playerName` instead of `Player${playerCount}` in the newPlayer object.

---

## Files to Modify

1. **index.html** - Add modal HTML and CSS
2. **game.js** - Add modal logic, validation, localStorage, modify connection
3. **server.js** - Add server validation, modify connection handler

## Testing Checklist

- [ ] Modal appears on page load
- [ ] Saved name auto-populates input
- [ ] Valid name accepted, invalid shows error
- [ ] Enter key and button both work
- [ ] Modal hides after join
- [ ] Player name displays correctly in HUD
- [ ] Other players see custom name
- [ ] Server falls back to Player# for invalid names
- [ ] Private browsing mode works (no localStorage)
