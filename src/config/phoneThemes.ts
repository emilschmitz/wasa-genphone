/**
 * Phone theme configuration
 * 
 * All phone images have the same button layout - only the colors differ.
 * Users can select their preferred phone color theme.
 */

export interface PhoneTheme {
  id: string;
  name: string;
  image: any; // require() path for React Native
  description: string;
}

export const PHONE_THEMES: PhoneTheme[] = [
  {
    id: 'light',
    name: 'Light Blue',
    image: require('../../assets/phone/phone_light.png'),
    description: 'Classic light blue phone',
  },
  {
    id: 'dark',
    name: 'Dark Blue',
    image: require('../../assets/phone/phone_dark.png'),
    description: 'Metallic dark blue phone',
  },
  {
    id: 'black',
    name: 'Black',
    image: require('../../assets/phone/phone_black.png'),
    description: 'Sleek black phone',
  },
  {
    id: 'pink',
    name: 'Pink',
    image: require('../../assets/phone/phone_pink.png'),
    description: 'Fun pink phone',
  },
];

export const DEFAULT_THEME = PHONE_THEMES[0]; // Light blue
