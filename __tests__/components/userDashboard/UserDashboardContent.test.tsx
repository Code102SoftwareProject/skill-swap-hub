import React from 'react';
import { render, screen } from '@testing-library/react';
import UserDashboardContent from '@/components/User/DashboardContent/UserDashboardContent';
import { useAuth } from '@/lib/context/AuthContext';
import { useSessionTimer } from '@/lib/hooks/useSessionTimer';


// Mock child components
jest.mock('@/components/Dashboard/UserSkills', () => {
  const MockUserSkills = () => <div data-testid="UserSkills" />;
  MockUserSkills.displayName = 'MockUserSkills';
  return MockUserSkills;
});
jest.mock('@/components/Dashboard/SkillsRequested', () => ({
  SkillsRequested: () => <div data-testid="SkillsRequested" />,
  SkillsOffered: () => <div data-testid="SkillsOffered" />
}));
jest.mock('@/components/Dashboard/ReviewSummary', () => ({
  ReviewSummary: () => <div data-testid="ReviewSummary" />
}));
jest.mock('@/components/Dashboard/EarnedBadges', () => {
  const MockEarnedBadges = () => <div data-testid="EarnedBadges" />;
  MockEarnedBadges.displayName = 'MockEarnedBadges';
  return MockEarnedBadges;
});

jest.mock('@/components/Dashboard/ProfileCard', () => {
  const MockProfileCard = () => <div data-testid="ProfileCard" />;
  MockProfileCard.displayName = 'MockProfileCard';
  return MockProfileCard;
});
jest.mock('@/components/Dashboard/TimeSpentChart', () => ({
  TimeSpentChart: () => <div data-testid="TimeSpentChart" />
}));
jest.mock('@/components/Dashboard/SkillMatchOverview', () => {
  const MockSkillMatchOverview = () => <div data-testid="SkillMatchOverview" />;
  MockSkillMatchOverview.displayName = 'MockSkillMatchOverview';
  return MockSkillMatchOverview;
});

// Mock hooks
jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: jest.fn()
}));
jest.mock('@/lib/hooks/useSessionTimer', () => ({
  useSessionTimer: jest.fn()
}));

describe('UserDashboardContent', () => {
  const mockUser = {
    _id: '123',
    firstName: 'Samha',
    lastName: 'fathima'
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useSessionTimer as jest.Mock).mockReturnValue(null);
  });

  it('renders greeting with user full name', () => {
    render(
      <UserDashboardContent
        onNavigateToMySkills={jest.fn()}
        onNavigateToReviews={jest.fn()}
      />
    );

    expect(screen.getByText(/Hi Samha fathima, Welcome back!/i)).toBeInTheDocument();
  });

  it('renders all child components when user is present', () => {
    render(
      <UserDashboardContent
        onNavigateToMySkills={jest.fn()}
        onNavigateToReviews={jest.fn()}
      />
    );

    expect(screen.getByTestId('UserSkills')).toBeInTheDocument();
    expect(screen.getByTestId('SkillsRequested')).toBeInTheDocument();
    expect(screen.getByTestId('SkillsOffered')).toBeInTheDocument();
    expect(screen.getByTestId('ReviewSummary')).toBeInTheDocument();
    expect(screen.getByTestId('EarnedBadges')).toBeInTheDocument();
    expect(screen.getByTestId('ProfileCard')).toBeInTheDocument();
    expect(screen.getByTestId('TimeSpentChart')).toBeInTheDocument();
    expect(screen.getByTestId('SkillMatchOverview')).toBeInTheDocument();
  });
});
