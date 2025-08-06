/**
 * VCT User Journey Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VCTUserJourney, createVCTJourney } from '../VCTUserJourney';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the error logger
vi.mock('@/lib/error-logger', () => ({
  errorLogger: {
    logInfo: vi.fn(),
    logError: vi.fn()
  }
}));

describe('VCTUserJourney', () => {
  const mockJourney = createVCTJourney({
    name: 'Test Journey',
    description: 'A test user journey',
    environment: 'local',
    steps: [
      {
        title: 'Step 1',
        description: 'First test step',
        status: 'pending',
        agent: 'TestAgent'
      },
      {
        title: 'Step 2', 
        description: 'Second test step',
        status: 'pending',
        agent: 'VisualAgent'
      }
    ]
  });

  const mockHandlers = {
    onStepStart: vi.fn(),
    onStepComplete: vi.fn(),
    onJourneyComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders journey overview correctly', () => {
    render(<VCTUserJourney journey={mockJourney} {...mockHandlers} />);
    
    expect(screen.getByText('Test Journey')).toBeInTheDocument();
    expect(screen.getByText('A test user journey')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('displays journey progress correctly', () => {
    render(<VCTUserJourney journey={mockJourney} {...mockHandlers} />);
    
    // Should show 0% progress initially
    expect(screen.getByText('0%')).toBeInTheDocument();
    
    // Should show correct step count
    expect(screen.getByText('2')).toBeInTheDocument(); // Total steps
  });

  it('shows journey steps with correct status', () => {
    render(<VCTUserJourney journey={mockJourney} {...mockHandlers} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('TestAgent')).toBeInTheDocument();
    expect(screen.getByText('VisualAgent')).toBeInTheDocument();
  });

  it('allows step selection and shows details', () => {
    render(<VCTUserJourney journey={mockJourney} {...mockHandlers} />);
    
    // Click on first step
    fireEvent.click(screen.getByText('Step 1'));
    
    // Should show step details
    expect(screen.getByText('First test step')).toBeInTheDocument();
  });

  it('shows VCT agents panel', () => {
    render(<VCTUserJourney journey={mockJourney} {...mockHandlers} />);
    
    expect(screen.getByText('VCT Agents')).toBeInTheDocument();
    expect(screen.getByText('Active agents orchestrating this journey')).toBeInTheDocument();
  });

  it('displays journey metrics', () => {
    render(<VCTUserJourney journey={mockJourney} {...mockHandlers} />);
    
    expect(screen.getByText('Journey Metrics')).toBeInTheDocument();
    expect(screen.getByText('Total Steps:')).toBeInTheDocument();
    expect(screen.getByText('Completed:')).toBeInTheDocument();
    expect(screen.getByText('Success Rate:')).toBeInTheDocument();
  });

  it('handles run journey button click', async () => {
    render(<VCTUserJourney journey={mockJourney} {...mockHandlers} />);
    
    const runButton = screen.getByText('Run Journey');
    fireEvent.click(runButton);
    
    // Button should be disabled during execution
    await waitFor(() => {
      expect(runButton).toBeDisabled();
    });
  });

  it('handles reset button click', () => {
    const journeyWithStatus = { ...mockJourney, status: 'completed' as const };
    render(<VCTUserJourney journey={journeyWithStatus} {...mockHandlers} />);
    
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    // Journey should reset to pending
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
});

describe('createVCTJourney', () => {
  it('creates journey with correct structure', () => {
    const config = {
      name: 'Test Journey',
      description: 'Test description',
      environment: 'staging' as const,
      steps: [
        {
          title: 'Test Step',
          description: 'Test step description',
          status: 'pending' as const,
          agent: 'TestAgent'
        }
      ]
    };

    const journey = createVCTJourney(config);

    expect(journey.name).toBe('Test Journey');
    expect(journey.description).toBe('Test description');
    expect(journey.environment).toBe('staging');
    expect(journey.status).toBe('pending');
    expect(journey.currentStep).toBe(0);
    expect(journey.steps).toHaveLength(1);
    expect(journey.steps[0].title).toBe('Test Step');
    expect(journey.id).toMatch(/^journey_/);
    expect(journey.steps[0].id).toMatch(/^step_1_/);
  });

  it('defaults to local environment when not specified', () => {
    const config = {
      name: 'Test',
      description: 'Test',
      steps: []
    };

    const journey = createVCTJourney(config);
    expect(journey.environment).toBe('local');
  });

  it('creates unique IDs for journey and steps', () => {
    const config = {
      name: 'Test',
      description: 'Test',
      steps: [
        { title: 'Step 1', description: 'Test', status: 'pending' as const },
        { title: 'Step 2', description: 'Test', status: 'pending' as const }
      ]
    };

    const journey1 = createVCTJourney(config);
    const journey2 = createVCTJourney(config);

    expect(journey1.id).not.toBe(journey2.id);
    expect(journey1.steps[0].id).not.toBe(journey2.steps[0].id);
    expect(journey1.steps[0].id).not.toBe(journey1.steps[1].id);
  });
});