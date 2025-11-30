import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import Sidebar from './shared/Sidebar';
import Home from './pages/Home/page';
import Devices from './pages/Devices/page';
import Data from './pages/Data/page';
import './index.css';
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative">
              {/* Modern geometric background pattern */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/40 via-transparent to-cyan-50/40"></div>
                <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-20 right-20 w-48 h-48 bg-cyan-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute bottom-20 left-1/4 w-56 h-56 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
                <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-blue-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4.5s' }}></div>
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>
              <Sidebar />
              <main className="flex-1 overflow-auto lg:ml-0 relative z-10">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/data" element={<Data />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
        enableMultiContainer={false}
      />
    </BrowserRouter>
  );
}

export default App;