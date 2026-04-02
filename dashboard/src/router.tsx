import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { DashboardPage } from './ui/pages/DashboardPage'
import { FeedbackPage } from './ui/pages/FeedbackPage'
import { UploadPage } from './ui/pages/UploadPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <UploadPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/feedback/up', element: <FeedbackPage type="up" /> },
      { path: '/feedback/down', element: <FeedbackPage type="down" /> },
    ],
  },
])
