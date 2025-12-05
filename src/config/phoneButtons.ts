/**
 * Phone button configuration
 * 
 * All coordinates are stored as PERCENTAGES (0-100%) relative to the phone image dimensions.
 * This makes the button positions resolution-independent and allows the phone to be resized freely.
 * 
 * Usage:
 * 1. Render the phone image at any size
 * 2. When user clicks, call findNearestButton() with click position and current image dimensions
 * 3. The function converts percentage coordinates to actual pixels and finds the nearest button
 * 
 * Button layout:
 * - 4 directional buttons (Up, Down, Left, Right) with arrow key mappings
 * - 12 numpad buttons (0-9, *, #)
 */

export interface PhoneButton {
  id: number;
  label: string;
  key?: string; // Keyboard key to simulate (for game controls)
  x: string; // X position as percentage of image width (e.g., "50%" = center)
  y: string; // Y position as percentage of image height (e.g., "50%" = middle)
}

// Button centers - click finds nearest button
// Coordinates adjusted: moved down 8%, left/right sides moved 3.5% toward center
export const BUTTON_CENTERS: PhoneButton[] = [
  {
    id: 1,
    label: 'Up',
    key: 'ArrowUp',
    x: '50%',
    y: '46%',  // was 38%, +8%
  },
  {
    id: 2,
    label: 'Down',
    key: 'ArrowDown',
    x: '50%',
    y: '53%',  // was 45%, +8%
  },
  {
    id: 3,
    label: 'Left',
    key: 'ArrowLeft',
    x: '42.5%',  // was 39%, +3.5%
    y: '52%',  // was 44%, +8%
  },
  {
    id: 4,
    label: 'Right',
    key: 'ArrowRight',
    x: '57.5%',  // was 61%, -3.5%
    y: '52%',  // was 44%, +8%
  },
  {
    id: 5,
    label: '1',
    x: '42.5%',  // was 39%, +3.5%
    y: '60%',  // was 52%, +8%
  },
  {
    id: 6,
    label: '2',
    x: '50%',
    y: '60%',  // was 52%, +8%
  },
  {
    id: 7,
    label: '3',
    x: '57.5%',  // was 61%, -3.5%
    y: '60%',  // was 52%, +8%
  },
  {
    id: 8,
    label: '4',
    x: '42.5%',  // was 39%, +3.5%
    y: '66%',  // was 58%, +8%
  },
  {
    id: 9,
    label: '5',
    x: '50%',
    y: '66%',  // was 58%, +8%
  },
  {
    id: 10,
    label: '6',
    x: '57.5%',  // was 61%, -3.5%
    y: '66%',  // was 58%, +8%
  },
  {
    id: 11,
    label: '7',
    x: '42.5%',  // was 39%, +3.5%
    y: '72%',  // was 64%, +8%
  },
  {
    id: 12,
    label: '8',
    x: '50%',
    y: '72%',  // was 64%, +8%
  },
  {
    id: 13,
    label: '9',
    x: '57.5%',  // was 61%, -3.5%
    y: '72%',  // was 64%, +8%
  },
  {
    id: 14,
    label: '*',
    x: '42.5%',  // was 39%, +3.5%
    y: '78%',  // was 70%, +8%
  },
  {
    id: 15,
    label: '0',
    x: '50%',
    y: '78%',  // was 70%, +8%
  },
  {
    id: 16,
    label: '#',
    x: '57.5%',  // was 61%, -3.5%
    y: '78%',  // was 70%, +8%
  },
];

/**
 * Find the nearest button to a click position
 * 
 * This function is resolution-independent - it works with any phone image size.
 * Button coordinates are stored as percentages and converted to pixels based on
 * the current image dimensions.
 * 
 * @param clickX Click X coordinate in pixels (relative to phone image)
 * @param clickY Click Y coordinate in pixels (relative to phone image)
 * @param imageWidth Current phone image width in pixels
 * @param imageHeight Current phone image height in pixels
 * @returns The nearest button, or null if none found
 * 
 * @example
 * // Phone image is 1000x800, user clicks at (500, 400)
 * const button = findNearestButton(500, 400, 1000, 800);
 * if (button?.key) {
 *   simulateKeyPress(button.key);
 * }
 */
export function findNearestButton(
  clickX: number,
  clickY: number,
  imageWidth: number,
  imageHeight: number
): PhoneButton | null {
  let nearestButton: PhoneButton | null = null;
  let minDistance = Infinity;

  for (const button of BUTTON_CENTERS) {
    // Convert percentage coordinates to actual pixels based on current image size
    const btnX = (parseFloat(button.x) / 100) * imageWidth;
    const btnY = (parseFloat(button.y) / 100) * imageHeight;

    // Calculate Euclidean distance
    const distance = Math.sqrt(
      Math.pow(clickX - btnX, 2) + Math.pow(clickY - btnY, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestButton = button;
    }
  }

  return nearestButton;
}

/**
 * Get buttons that have game control key mappings
 */
export const GAME_CONTROL_BUTTONS = BUTTON_CENTERS.filter(btn => btn.key);

/**
 * Button mapping by function
 */
export const BUTTON_MAP = {
  DPAD_UP: BUTTON_CENTERS.find(b => b.label === 'Up')!,
  DPAD_DOWN: BUTTON_CENTERS.find(b => b.label === 'Down')!,
  DPAD_LEFT: BUTTON_CENTERS.find(b => b.label === 'Left')!,
  DPAD_RIGHT: BUTTON_CENTERS.find(b => b.label === 'Right')!,
};
