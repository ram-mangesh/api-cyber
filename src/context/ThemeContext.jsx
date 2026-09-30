import { createContext, useContext, useState } from 'react'

export const themes = {
  bisque: {
    name: 'Bisque + Atlas Red',
    bg: '#FEE3C5',
    primary: '#82193A',
    primaryLight: '#a82050',
    sidebar: '#f5d4af',
    card: '#fff8f0',
    border: '#e8c9a0',
    text: '#2d1a10',
    textMuted: '#7a5c44',
    chartColors: ['#82193A', '#b5294f', '#d4506e', '#e8849a', '#f5b8c8'],
  },
  olive: {
    name: 'Olive Green + Beige Cream',
    bg: '#FFF3D5',
    primary: '#4D6946',
    primaryLight: '#5e8057',
    sidebar: '#f0e8c0',
    card: '#fffdf0',
    border: '#d6c98a',
    text: '#1e2a1a',
    textMuted: '#5a6650',
    chartColors: ['#4D6946', '#6b8f63', '#8db080', '#b0cfa8', '#d4e8d0'],
  },
  teal: {
    name: 'Teal + Beige',
    bg: '#F5F5DC',
    primary: '#008080',
    primaryLight: '#009999',
    sidebar: '#e8e8cc',
    card: '#fafaf0',
    border: '#c8c8a0',
    text: '#1a2020',
    textMuted: '#4a6060',
    chartColors: ['#008080', '#20a0a0', '#40c0c0', '#80d8d8', '#b0e8e8'],
  },
  sunset: {
    name: 'Sunset Orange',
    bg: '#F5F4ED',
    primary: '#EC5E27',
    primaryLight: '#f57a4a',
    sidebar: '#e8e5d3',
    card: '#ffffff',
    border: '#e0ded1',
    text: '#2e1b12',
    textMuted: '#6b4c3e',
    chartColors: ['#EC5E27', '#f07d4f', '#f59b75', '#fabb9c', '#fddbc2'],
  },
  sunny: {
    name: 'Sunny Gold',
    bg: '#FFFBEF',
    primary: '#FFB000',
    primaryLight: '#ffc133',
    sidebar: '#f5ead0',
    card: '#ffffff',
    border: '#e8dcba',
    text: '#332300',
    textMuted: '#7a5a14',
    chartColors: ['#FFB000', '#ffc133', '#ffd266', '#ffe399', '#fff4cc'],
  },
  blossom: {
    name: 'Pink Blossom',
    bg: '#FFF9FB',
    primary: '#FF5C8A',
    primaryLight: '#ff7fa3',
    sidebar: '#fcecf2',
    card: '#ffffff',
    border: '#f2d8e2',
    text: '#2e111a',
    textMuted: '#754053',
    chartColors: ['#FF5C8A', '#ff85a8', '#ffadc6', '#ffd6e3', '#ffebf1'],
  },
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('bisque')
  const theme = themes[currentTheme]

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setCurrentTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
