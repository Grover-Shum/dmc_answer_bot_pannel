import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { DashboardPage } from './ui/pages/DashboardPage'
import { FeedbackPage } from './ui/pages/FeedbackPage'
import { UploadPage } from './ui/pages/UploadPage'

export const router = createBrowserRouter([
  {
    path: '/feedback',
    element: <FeedbackPage />,
  },
  { path: '/feedback/up', element: <FeedbackPage /> },
  { path: '/feedback/down', element: <FeedbackPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <UploadPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
    ],
  },
])
