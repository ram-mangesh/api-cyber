import { createContext, useContext, useState } from 'react'

const ApiContext = createContext()

export function ApiProvider({ children }) {
  // Seeded from .env for first run, then owned by the user via the Settings page
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('dronikastra_api_key') || import.meta.env.VITE_DRONIKASTRA_API_KEY || ''
  )

  // Dynamic base URL setup configurable via Frontend Settings
  const [baseUrl, setBaseUrl] = useState(
    localStorage.getItem('dronikastra_base_url') || import.meta.env.VITE_API_BASE_URL || ''
  )

  const saveConfig = (key, url) => {
    // Strip trailing slashes to prevent API path issues (e.g. https://ip:3443/ becomes https://ip:3443)
    const cleanUrl = url.replace(/\/+$/, '');
    setApiKey(key)
    setBaseUrl(cleanUrl)
    localStorage.setItem('dronikastra_api_key', key)
    localStorage.setItem('dronikastra_base_url', cleanUrl)
  }

  return (
    <ApiContext.Provider value={{ apiKey, baseUrl, saveConfig }}>
      {children}
    </ApiContext.Provider>
  )
}

export function useApi() {
  return useContext(ApiContext)
}
