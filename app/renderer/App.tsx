import React from 'react'
import { ErrorDisplay } from './components/ErrorDisplay'
import { DashboardLayout } from './components/DashboardLayout'
import { ThemeProvider } from './components/ThemeProvider'
import './styles/unified-styles.css'

export default function App() {
  return (
    <ThemeProvider>
      <DashboardLayout />
      <ErrorDisplay />
    </ThemeProvider>
  );
}
