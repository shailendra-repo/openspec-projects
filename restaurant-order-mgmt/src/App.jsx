import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import CreateItems from './pages/CreateItems.jsx'
import CreateOrder from './pages/CreateOrder.jsx'
import Dashboard from './pages/Dashboard.jsx'
import './App.css'

function App() {
  return (
    <main className="app">
      <header className="topbar">
        <h1>Restaurant Orders</h1>
        <nav className="nav">
          <NavLink to="/items">CreateItems</NavLink>
          <NavLink to="/create-order">CreateOrder</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/create-order" replace />} />
        <Route path="/items" element={<CreateItems />} />
        <Route path="/create-order" element={<CreateOrder />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/create-order" replace />} />
      </Routes>
    </main>
  )
}

export default App
