import React from 'react';
import { createRoot } from 'react-dom/client';
import GurlPage from '../src/gurl/GurlPage.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GurlPage />
  </React.StrictMode>
);
