import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { ThreePanelLayout } from '../ThreePanelLayout'

// Mock components for testing
const MockMainContent = () => <div data-testid="main-content">Main Content Area</div>
const MockProtocolPanel = () => <div data-testid="protocol-panel">Protocol Panel</div>
const MockAIChatPanel = () => <div data-testid="ai-chat-panel">AI Chat Panel</div>

describe('ThreePanelLayout Component', () => {
  const defaultProps = {
    mainContent: <MockMainContent />,
    protocolPanel: <MockProtocolPanel />,
    aiChatPanel: <MockAIChatPanel />
  }

  describe('Basic Rendering', () => {
    test('should render all three panels', () => {
      render(<ThreePanelLayout {...defaultProps} />)
      
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
      expect(screen.getByTestId('protocol-panel')).toBeInTheDocument()
      expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()
    })

    test('should render with custom className', () => {
      const { container } = render(
        <ThreePanelLayout {...defaultProps} className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    test('should have proper layout structure', () => {
      const { container } = render(<ThreePanelLayout {...defaultProps} />)
      
      // Should have flex layout
      expect(container.firstChild).toHaveClass('flex', 'h-screen', 'bg-background')
    })
  })

  describe('Panel Layout and Positioning', () => {
    test('should have main content area with flexible width', () => {
      render(<ThreePanelLayout {...defaultProps} />)
      
      const mainContent = screen.getByTestId('main-content')
      const mainContainer = mainContent.closest('.flex-1')
      
      expect(mainContainer).toBeInTheDocument()
      expect(mainContainer).toHaveClass('flex-1')
    })

    test('should have protocol panel with fixed width', () => {
      render(<ThreePanelLayout {...defaultProps} />)
      
      const protocolPanel = screen.getByTestId('protocol-panel')
      const protocolContainer = protocolPanel.closest('.w-80')
      
      expect(protocolContainer).toBeInTheDocument()
      expect(protocolContainer).toHaveClass('w-80', 'border-l')
    })

    test('should have AI chat panel with fixed width', () => {
      render(<ThreePanelLayout {...defaultProps} />)
      
      const aiChatPanel = screen.getByTestId('ai-chat-panel')
      const aiChatContainer = aiChatPanel.closest('.w-96')
      
      expect(aiChatContainer).toBeInTheDocument()
      expect(aiChatContainer).toHaveClass('w-96', 'border-l')
    })
  })

  describe('Scrolling and Overflow Handling', () => {
    test('should handle overflow correctly in all panels', () => {
      render(<ThreePanelLayout {...defaultProps} />)
      
      // Main content should have overflow-y-auto
      const mainContent = screen.getByTestId('main-content')
      const mainScrollContainer = mainContent.closest('.overflow-y-auto')
      expect(mainScrollContainer).toHaveClass('overflow-y-auto')
      
      // Protocol panel should have overflow-y-auto
      const protocolPanel = screen.getByTestId('protocol-panel')
      const protocolScrollContainer = protocolPanel.closest('.overflow-y-auto')
      expect(protocolScrollContainer).toHaveClass('overflow-y-auto')
      
      // AI chat panel should have overflow-y-auto
      const aiChatPanel = screen.getByTestId('ai-chat-panel')
      const aiChatScrollContainer = aiChatPanel.closest('.overflow-y-auto')
      expect(aiChatScrollContainer).toHaveClass('overflow-y-auto')
    })

    test('should prevent horizontal overflow', () => {
      const { container } = render(<ThreePanelLayout {...defaultProps} />)
      
      // Container should have overflow-hidden to prevent horizontal scroll
      const mainContainer = container.querySelector('.overflow-hidden')
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('Responsive Design Considerations', () => {
    test('should maintain layout structure on different screen sizes', () => {
      // Mock different viewport sizes
      const originalInnerWidth = window.innerWidth
      
      // Test desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })
      
      render(<ThreePanelLayout {...defaultProps} />)
      
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
      expect(screen.getByTestId('protocol-panel')).toBeInTheDocument()
      expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()
      
      // Restore original width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth
      })
    })

    test('should handle narrow screens gracefully', () => {
      // Mock narrow viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })
      
      render(<ThreePanelLayout {...defaultProps} />)
      
      // All panels should still render (layout handles responsive behavior via CSS)
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
      expect(screen.getByTestId('protocol-panel')).toBeInTheDocument()
      expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    test('should render complex content in each panel', () => {
      const ComplexMainContent = () => (
        <div data-testid="complex-main">
          <h1>Project Dashboard</h1>
          <button>New Project</button>
          <table>
            <thead>
              <tr><th>Name</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>Project 1</td><td>Active</td></tr>
            </tbody>
          </table>
        </div>
      )
      
      const ComplexProtocolPanel = () => (
        <div data-testid="complex-protocol">
          <h2>Research Protocol</h2>
          <form>
            <input type="text" placeholder="Research question" />
            <textarea placeholder="Inclusion criteria"></textarea>
            <button type="submit">Save Protocol</button>
          </form>
        </div>
      )
      
      const ComplexAIChatPanel = () => (
        <div data-testid="complex-ai-chat">
          <h2>AI Assistant</h2>
          <div className="messages">
            <div className="message">How can I help with your review?</div>
            <div className="message user">Help me with PICO framework</div>
          </div>
          <input type="text" placeholder="Type your message..." />
          <button>Send</button>
        </div>
      )
      
      render(
        <ThreePanelLayout
          mainContent={<ComplexMainContent />}
          protocolPanel={<ComplexProtocolPanel />}
          aiChatPanel={<ComplexAIChatPanel />}
        />
      )
      
      // Check that complex content renders correctly
      expect(screen.getByText('Project Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Research Protocol')).toBeInTheDocument()
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
      
      // Check interactive elements
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save protocol/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    test('should handle empty content gracefully', () => {
      const { container } = render(
        <ThreePanelLayout
          mainContent={null}
          protocolPanel={null}
          aiChatPanel={null}
        />
      )
      
      // Layout should still render even with null content
      // Check for direct children with the expected classes
      const mainContainer = container.querySelector('.flex-1')
      const protocolContainer = container.querySelector('.w-80')
      const aiChatContainer = container.querySelector('.w-96')
      
      expect(mainContainer).toBeInTheDocument()
      expect(protocolContainer).toBeInTheDocument()
      expect(aiChatContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper semantic structure', () => {
      render(<ThreePanelLayout {...defaultProps} />)
      
      // Main content should be in a main element
      const mainElement = screen.getByTestId('main-content').closest('main')
      expect(mainElement).toBeInTheDocument()
    })

    test('should support keyboard navigation', () => {
      render(
        <ThreePanelLayout
          mainContent={<button data-testid="main-button">Main Button</button>}
          protocolPanel={<button data-testid="protocol-button">Protocol Button</button>}
          aiChatPanel={<button data-testid="ai-button">AI Button</button>}
        />
      )
      
      // All buttons should be focusable
      const mainButton = screen.getByTestId('main-button')
      const protocolButton = screen.getByTestId('protocol-button')
      const aiButton = screen.getByTestId('ai-button')
      
      expect(mainButton).toBeInTheDocument()
      expect(protocolButton).toBeInTheDocument()
      expect(aiButton).toBeInTheDocument()
      
      // Should be able to focus elements in all panels
      mainButton.focus()
      expect(document.activeElement).toBe(mainButton)
      
      protocolButton.focus()
      expect(document.activeElement).toBe(protocolButton)
      
      aiButton.focus()
      expect(document.activeElement).toBe(aiButton)
    })
  })

  describe('Performance and Rendering', () => {
    test('should render quickly with large content', () => {
      const LargeContent = ({ testId, itemCount = 100 }: { testId: string, itemCount?: number }) => (
        <div data-testid={testId}>
          {Array.from({ length: itemCount }, (_, i) => (
            <div key={i}>Item {i + 1}</div>
          ))}
        </div>
      )
      
      const startTime = performance.now()
      
      render(
        <ThreePanelLayout
          mainContent={<LargeContent testId="large-main" itemCount={50} />}
          protocolPanel={<LargeContent testId="large-protocol" itemCount={30} />}
          aiChatPanel={<LargeContent testId="large-ai" itemCount={20} />}
        />
      )
      
      const renderTime = performance.now() - startTime
      
      // Should render within reasonable time (generous for test environment)
      expect(renderTime).toBeLessThan(100)
      
      // Content should still be accessible
      expect(screen.getByTestId('large-main')).toBeInTheDocument()
      expect(screen.getByTestId('large-protocol')).toBeInTheDocument()
      expect(screen.getByTestId('large-ai')).toBeInTheDocument()
    })
  })

  describe('Layout Constraints', () => {
    test('should maintain height constraints', () => {
      const { container } = render(<ThreePanelLayout {...defaultProps} />)
      
      // Root container should have h-screen
      expect(container.firstChild).toHaveClass('h-screen')
      
      // All panel containers should have flex-1 or fixed heights
      const flexContainers = container.querySelectorAll('.flex-1')
      expect(flexContainers.length).toBeGreaterThan(0)
    })

    test('should handle border styling correctly', () => {
      render(<ThreePanelLayout {...defaultProps} />)
      
      // Protocol and AI chat panels should have left borders
      const protocolPanel = screen.getByTestId('protocol-panel')
      const protocolContainer = protocolPanel.closest('.border-l')
      expect(protocolContainer).toHaveClass('border-l', 'border-border')
      
      const aiChatPanel = screen.getByTestId('ai-chat-panel')
      const aiChatContainer = aiChatPanel.closest('.border-l')
      expect(aiChatContainer).toHaveClass('border-l', 'border-border')
    })
  })
})