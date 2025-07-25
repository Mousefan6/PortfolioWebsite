// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { AudioProvider } from './hooks/AudioProvider';

createRoot(document.getElementById('root')!).render(
    // // Enable strict mode for dev purposes; comment for production
    // <StrictMode>
    //     <App />
    // </StrictMode>,

    // Uncomment for production
    <AudioProvider>
        <App />
    </AudioProvider>
)
