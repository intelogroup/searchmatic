import { useNavigate } from 'react-router-dom'

export const useAppNavigation = () => {
  const navigate = useNavigate()

  return {
    goToDashboard: () => navigate('/dashboard'),
    goToLogin: () => navigate('/login'),
    goToProject: (id: string) => navigate(`/projects/${id}`),
    goToNewProject: () => navigate('/projects/new'),
    goToSettings: () => navigate('/settings'),
    goToMigrations: () => navigate('/migrations'),
    goToProjectDemo: (id: string) => navigate(`/projects/${id}/demo`),
    goHome: () => navigate('/'),
    goBack: () => navigate(-1)
  }
}