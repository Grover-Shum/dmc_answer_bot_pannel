import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { DashboardPage } from './ui/pages/DashboardPage'
import { UploadPage } from './ui/pages/UploadPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <UploadPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
    ],
  },
])

