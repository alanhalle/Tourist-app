import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MapView from './App';
import Admin from './Admin';
import './Admin.css';
import { Toaster } from '@/components/ui/sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  </React.StrictMode>
);