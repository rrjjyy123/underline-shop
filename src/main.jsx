import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/noto-serif-kr/400.css';
import '@fontsource/noto-serif-kr/600.css';
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';
import '@fontsource/nanum-pen-script/400.css';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import './styles.css';
import { AppProvider } from './store';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
