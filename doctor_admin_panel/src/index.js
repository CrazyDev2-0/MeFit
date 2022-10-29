import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import "./sass/dashboard.scss";

// Pages
import LoginPage from './pages/login';
import ForPass from './pages/forgotPass';
import PatientListPage from './pages/patientList';
import Navbar from './components/navbar';
import TopBar from './components/topBar';
import AlertBar from './components/alertbar';
import PatientStatsPage from './pages/patientStats';


const root = ReactDOM.createRoot(document.getElementById('root'));
const user = JSON.parse(localStorage.getItem('profile'));

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const theme = extendTheme({
  colors:{
    
  }
})


root.render(
  localStorage.getItem('token') === null || localStorage.getItem('token') === undefined ? 
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/*" element={<LoginPage />} replace />
        <Route path="/forpass*" element={<ForPass />} replace />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode> 
  :
  <React.StrictMode>
    <ChakraProvider>
      <div className="dashboardContainer">
        <BrowserRouter>
          <Navbar />
          <TopBar />
          <AlertBar />
          <div className="containerContent">
            <Routes>
            <Route path="/" element={<PatientListPage />} />
            <Route path="/patients/:id" element={<PatientStatsPage />} />
            <Route path="/auth" element={ user?.result ? <Navigate replace to="/" /> : <LoginPage /> } />
            </Routes>
          </div>
        </BrowserRouter>
      </div>
    </ChakraProvider>
  </React.StrictMode>
);

