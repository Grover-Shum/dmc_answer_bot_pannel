import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { RequireAuth } from './ui/components/RequireAuth'
import { AdminPage } from './ui/pages/AdminPage'
import { DashboardPage } from './ui/pages/DashboardPage'
import { FeedbackPage } from './ui/pages/FeedbackPage'
import { LoginPage } from './ui/pages/LoginPage'
import { UploadPage } from './ui/pages/UploadPage'

export const router = createBrowserRouter([
  {
    path: '/feedback',
    element: <FeedbackPage />,
  },
  { path: '/feedback/up', element: <FeedbackPage /> },
  { path: '/feedback/down', element: <FeedbackPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <UploadPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      {
        path: '/admin',
        element: (
          <RequireAuth role="admin">
            <AdminPage />
          </RequireAuth>
        ),
      },
    ],
  },
])
