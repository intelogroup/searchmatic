/**
 * Pagination Component
 * High-performance pagination with keyboard navigation and accessibility
 */

import React from 'react'
import { Button } from './button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: number // How many page numbers to show around current
  isLoading?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = 5,
  isLoading = false,
  className
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const halfShow = Math.floor(showPageNumbers / 2)

    // Always show first page
    if (currentPage > halfShow + 1) {
      pages.push(1)
      if (currentPage > halfShow + 2) {
        pages.push('ellipsis')
      }
    }

    // Show pages around current page
    const startPage = Math.max(1, currentPage - halfShow)
    const endPage = Math.min(totalPages, currentPage + halfShow)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Always show last page
    if (currentPage < totalPages - halfShow) {
      if (currentPage < totalPages - halfShow - 1) {
        pages.push('ellipsis')
      }
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isLoading) return

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        if (canGoPrevious) onPageChange(currentPage - 1)
        break
      case 'ArrowRight':
        event.preventDefault()
        if (canGoNext) onPageChange(currentPage + 1)
        break
      case 'Home':
        event.preventDefault()
        onPageChange(1)
        break
      case 'End':
        event.preventDefault()
        onPageChange(totalPages)
        break
    }
  }

  return (
    <nav
      className={cn(
        'flex items-center justify-center space-x-1',
        className
      )}
      aria-label="Pagination"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious || isLoading}
        aria-label="Go to previous page"
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-1 text-gray-500"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )
          }

          const isCurrentPage = page === currentPage

          return (
            <Button
              key={page}
              variant={isCurrentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              aria-label={`Go to page ${page}`}
              aria-current={isCurrentPage ? "page" : undefined}
              className={cn(
                "min-w-[2.5rem]",
                isCurrentPage && "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {page}
            </Button>
          )
        })}
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext || isLoading}
        aria-label="Go to next page"
        className="flex items-center gap-1"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Page info for screen readers */}
      <span className="sr-only">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  )
}

// Additional utility component for showing page info
interface PageInfoProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
}

export function PageInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className
}: PageInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={cn(
      "text-sm text-gray-600 flex items-center justify-between",
      className
    )}>
      <span>
        Showing {startItem} to {endItem} of {totalItems} results
      </span>
      <span>
        Page {currentPage} of {totalPages}
      </span>
    </div>
  )
}

// Hook for managing pagination state
export function usePagination({
  initialPage = 1,
  totalItems,
  itemsPerPage = 20
}: {
  initialPage?: number
  totalItems: number
  itemsPerPage?: number
}) {
  const [currentPage, setCurrentPage] = React.useState(initialPage)
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  
  // Reset to page 1 if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const previousPage = () => goToPage(currentPage - 1)
  const firstPage = () => goToPage(1)
  const lastPage = () => goToPage(totalPages)

  return {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < totalPages,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage - 1, totalItems - 1)
  }
}

export default Pagination