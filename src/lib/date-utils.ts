import { formatDistanceToNow } from 'date-fns'

export const formatTimeAgo = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export const formatCreatedAt = (dateString: string): string => {
  try {
    return `${formatDistanceToNow(new Date(dateString))} ago`
  } catch {
    return 'Unknown time'
  }
}