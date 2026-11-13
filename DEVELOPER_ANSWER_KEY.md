# ROOM 13: CURFEW — Developer Answer Key & Walkthrough

> **Developer & Testing Documentation Only** — Not exposed in the player interface.

---

## 1. Passwords Overview

| Difficulty | Drawer Password (3-Digit) | Final Door Password (4-Digit) |
| --- | :---: | :---: |
| **Easy** | `427` | `1310` |
| **Moderate** | `583` | `2413` |
| **Hard** | `906` | `7310` |

---

## 2. Easy Mode

### Clues & Locations
1. **Wall Clock (`clock`, above left side of study desk)**: Displays `10:40` with bezel scratch `40 MIN` → tens digit of minutes = **`4`**.
2. **Notice Board (`notice`, corkboard on north wall)**:
   - Inspection Sheet: `BLOCK: B`, `FLOOR: 2`, `ROOM NO: 13` → Floor = **`2`**, Room = **`13`**.
   - Curfew Notice: `10:00 PM` (`GATES LOCK AT HOUR 10`) → Curfew Hour = **`10`**.
3. **Hostel Bed (`bed`, steel plate under right rail)**: Reads `BED NO. 7` → **`7`**.
4. **Study Notebook (`notebook`, open on study desk)**: Underlined rule: `"Read the room in this order: TIME -> FLOOR -> BED"`.
5. **Torn Drawer Note (`tornNote`, inside unlocked desk drawer)**: `"Combine the ROOM NUMBER with the HOUR OF CURFEW."`

### Calculations & Order
- **Drawer (`427`)**: Follow Notebook order `TIME -> FLOOR -> BED` → Clock (`4`) + Floor (`2`) + Bed (`7`) = **`427`**.
- **Final Door (`1310`)**: Follow Torn Drawer Note `ROOM NUMBER + HOUR OF CURFEW` → Room (`13`) + Curfew Hour (`10`) = **`1310`**.

### Helpful Roommate Dialogue (Rohan — Easy)
- *Ask about the wall clock*: Points to `10:40` and the rim scratch about using the tens digit of the minutes.
- *Ask about the notices & bed*: Directs you to the inspection sheet floor, the bed rail inventory plate, and the notebook order.
- *Ask about the exit door*: Hints that the note locked inside the drawer pairs the room number and curfew hour.

### Complete Walkthrough Order (Easy)
1. Inspect the **Wall Clock** (`4`), **Notice Board** (`Floor 2`, `Room 13`, `10:00 PM`), **Hostel Bed** (`7`), and **Study Notebook** (`TIME -> FLOOR -> BED`).
2. Inspect the **Desk Drawer**, dial **`427`**, press **Enter** → drawer unlocks, opens, and adds the **Torn Note** to inventory/journal.
3. Inspect the **Main Exit Door**, enter **`1310`**, press **Enter** → door unlocks and escape sequence plays.

---

## 3. Moderate Mode

### Clues & Locations
1. **Wall Clock (`clock`, above left side of study desk)**: Displays `11:55` with bezel scratch `TO 12:00` → `60 - 55` = **`5`** minutes remaining until midnight.
2. **Wardrobe (`wardrobe`, teak almirah on east wall)**: Open the double doors to see chalked shelf stencil `LOCKER NO. 8` → **`8`**.
3. **Notice Board (`notice`, corkboard on north wall)**:
   - Inspection Sheet: `BLOCK: B`, `FLOOR: 3`, `ROOM NO: 13` → Floor = **`3`**, Room = **`13`**.
   - Curfew Notice: `MAIN GATE LOCKS AT 24 HR` (`24:00`) → Gate Lock Hour = **`24`**.
4. **Study Notebook (`notebook`, open on study desk)**: `"Desk lock order: [Minutes to midnight on Clock] -> [Wardrobe Locker #] -> [Inspection Floor]."` (`CLOCK -> LOCKER -> FLOOR`).
5. **Torn Drawer Note (`tornNote`, inside unlocked desk drawer)**: `"Enter the 2-digit Gate Lock Hour followed by our Room Number."`

### Calculations & Order
- **Drawer (`583`)**: Follow Notebook order `CLOCK -> LOCKER -> FLOOR`:
  - Clock (`11:55` → minutes left until `12:00`) = **`5`**
  - Wardrobe (`LOCKER NO. 8`) = **`8`**
  - Notice Board (`FLOOR: 3`) = **`3`**
  - Result = **`583`**.
- **Final Door (`2413`)**: Follow Torn Drawer Note `Gate Lock Hour (24) + Room Number (13)` = **`2413`**.

### Helpful Roommate Dialogue (Rohan — Moderate)
- *Ask about the wall clock*: Notes it stopped five minutes shy of midnight and points to the rim note.
- *Ask about the wooden wardrobe*: Mentions seeing a single-digit locker number chalked inside the almirah shelf.
- *Ask about the notices & notebook*: Points out the floor, the `24:00` midnight gate-lock format, and the spiral notebook's ordering rule.

### Complete Walkthrough Order (Moderate)
1. Inspect **Wall Clock** (`5` min to 12:00), **Wardrobe** (`LOCKER NO. 8`), **Notice Board** (`Floor 3`, `24:00`, `Room 13`), and **Study Notebook** (`CLOCK -> LOCKER -> FLOOR`).
2. Inspect **Desk Drawer**, enter **`583`** → unlocks drawer and grants the **Torn Note**.
3. Inspect **Main Exit Door**, enter **`2413`** → unlocks exit and triggers victory.

---

## 4. Hard Mode

### Clues & Locations
1. **Hostel Bed (`bed`, steel plate under right rail)**: Reads `BED NO. 12` → **`12`**.
2. **Study Table (`table`, left surface of study desk)**: Three hardcover textbooks stacked beside the chai mug → **`3`**.
3. **Wall Clock (`clock`, above left side of study desk)**: Displays `10:30` with rim etching `PAST :30` (`Minutes past :30`) → `30 - 30` = **`0`**.
4. **Notice Board (`notice`, corkboard on north wall)**:
   - Inspection Sheet: `BLOCK: B`, `FLOOR: 2`, `ROOM NO: 13` → Floor = **`2`**, Room = **`13`**.
   - Curfew Notice: `STRICT CURFEW: 10:00 PM (CURFEW HOUR: 10)` → Curfew Hour = **`10`**.
5. **Wardrobe (`wardrobe`, teak almirah on east wall)**: Open doors to reveal shelf stencil `LOCKER #60` → **`60`**.
6. **Study Notebook (`notebook`, open on study desk)**: `"Drawer cipher: (1) Bed Number minus stacked desk books. (2) Minutes past :30. (3) Inspection Floor multiplied by desk books."` (`B-BK · M-30 · FxBK`).
7. **Torn Drawer Note (`tornNote`, inside unlocked desk drawer)**: `"Door Pair 1: Wardrobe Locker # plus Room Number. Door Pair 2: Evening Curfew Hour from the Notice Board."`

### Calculations & Order
- **Drawer (`906`)**:
  - Digit 1: `Bed No. (12) - Desk Books (3)` = **`9`**
  - Digit 2: `Clock Minutes past :30 (10:30 -> 30 - 30)` = **`0`**
  - Digit 3: `Inspection Floor (2) × Desk Books (3)` = **`6`**
  - Result = **`906`**.
- **Final Door (`7310`)**:
  - First pair: `Wardrobe Locker #60 (60) + Room Number (13)` = **`73`**
  - Second pair: `Evening Curfew Hour (10)` = **`10`**
  - Result = **`7310`**.

### Helpful Roommate Dialogue (Rohan — Hard)
- *Ask what he noticed around the desk*: Mentions the stacked hardcover textbooks and the three-part formula in the notebook referencing the bed plate and books.
- *Ask about the wall clock & wardrobe*: Points to the half-hour bezel scratch (`:30`) and the two-digit compartment stencil inside the wardrobe.
- *Ask about the notice board & bed*: Highlights the two-digit bed plate, floor, room number, and evening curfew hour needing subtraction and multiplication.

### Complete Walkthrough Order (Hard)
1. Inspect **Hostel Bed** (`12`), **Study Table** (`3` books), **Wall Clock** (`10:30` → `0`), **Notice Board** (`Floor 2`, `Room 13`, `Hour 10`), **Wardrobe** (`LOCKER #60`), and **Study Notebook** (3-step cipher).
2. Inspect **Desk Drawer**, enter **`906`** → unlocks drawer and grants the **Torn Note**.
3. Inspect **Main Exit Door**, enter **`7310`** → unlocks exit and triggers victory.
