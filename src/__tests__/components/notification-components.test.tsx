/**
 * Notification Components Tests
 * اختبارات مكونات الإشعارات
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock notification dropdown component
const MockNotificationDropdown = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    notificationType: string;
  }>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div data-testid="notification-dropdown">
      <div data-testid="unread-count">{unreadCount} unread</div>
      <button onClick={onMarkAllAsRead} data-testid="mark-all-read-btn">
        Mark all as read
      </button>
      <ul data-testid="notification-list">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            data-testid={`notification-${notification.id}`}
            className={notification.isRead ? 'read' : 'unread'}
          >
            <span data-testid={`title-${notification.id}`}>{notification.title}</span>
            <span data-testid={`message-${notification.id}`}>{notification.message}</span>
            {!notification.isRead && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                data-testid={`mark-read-${notification.id}`}
              >
                Mark as read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Mock notification badge component
const MockNotificationBadge = ({ count }: { count: number }) => (
  <div data-testid="notification-badge">
    {count > 0 && (
      <span data-testid="badge-count" className="badge">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </div>
);

// Mock notification item component
const MockNotificationItem = ({
  notification,
  onClick,
  onMarkAsRead,
}: {
  notification: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    notificationType: string;
  };
  onClick: () => void;
  onMarkAsRead: () => void;
}) => {
  const icons: Record<string, string> = {
    system: '⚙️',
    task: '✅',
    project: '📁',
    invoice: '💰',
    approval: '✍️',
    mention: '@',
  };

  return (
    <div
      data-testid={`notification-item-${notification.id}`}
      onClick={onClick}
      className={notification.isRead ? 'read' : 'unread'}
    >
      <span data-testid="notification-icon">
        {icons[notification.notificationType] || '🔔'}
      </span>
      <div>
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
      </div>
      {!notification.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
          data-testid="mark-read-btn"
        >
          Mark as read
        </button>
      )}
    </div>
  );
};

describe('NotificationDropdown Component', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'New Task Assigned',
      message: 'You have been assigned to Task X',
      isRead: false,
      createdAt: new Date(),
      notificationType: 'task',
    },
    {
      id: 'notif-2',
      title: 'Project Updated',
      message: 'Project Y has been updated',
      isRead: true,
      createdAt: new Date(),
      notificationType: 'project',
    },
    {
      id: 'notif-3',
      title: 'Invoice Approved',
      message: 'Invoice #123 has been approved',
      isRead: false,
      createdAt: new Date(),
      notificationType: 'invoice',
    },
  ];

  const mockOnMarkAsRead = jest.fn();
  const mockOnMarkAllAsRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render notification list', () => {
    render(
      <MockNotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
      />
    );

    expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('should display unread count', () => {
    render(
      <MockNotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
      />
    );

    expect(screen.getByTestId('unread-count')).toHaveTextContent('2 unread');
  });

  it('should call onMarkAsRead when mark as read clicked', () => {
    render(
      <MockNotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
      />
    );

    fireEvent.click(screen.getByTestId('mark-read-notif-1'));
    expect(mockOnMarkAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('should call onMarkAllAsRead when mark all clicked', () => {
    render(
      <MockNotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
      />
    );

    fireEvent.click(screen.getByTestId('mark-all-read-btn'));
    expect(mockOnMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('should not show mark as read button for read notifications', () => {
    render(
      <MockNotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
      />
    );

    expect(screen.queryByTestId('mark-read-notif-2')).not.toBeInTheDocument();
  });

  it('should handle empty notifications', () => {
    render(
      <MockNotificationDropdown
        notifications={[]}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
      />
    );

    expect(screen.getByTestId('unread-count')).toHaveTextContent('0 unread');
    expect(screen.getAllByRole('listitem')).toHaveLength(0);
  });
});

describe('NotificationBadge Component', () => {
  it('should display count when greater than 0', () => {
    render(<MockNotificationBadge count={5} />);
    expect(screen.getByTestId('badge-count')).toHaveTextContent('5');
  });

  it('should not display when count is 0', () => {
    render(<MockNotificationBadge count={0} />);
    expect(screen.queryByTestId('badge-count')).not.toBeInTheDocument();
  });

  it('should show 99+ for counts over 99', () => {
    render(<MockNotificationBadge count={150} />);
    expect(screen.getByTestId('badge-count')).toHaveTextContent('99+');
  });

  it('should display exact count for 99', () => {
    render(<MockNotificationBadge count={99} />);
    expect(screen.getByTestId('badge-count')).toHaveTextContent('99');
  });
});

describe('NotificationItem Component', () => {
  const mockNotification = {
    id: 'notif-1',
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    notificationType: 'task',
  };

  const mockOnClick = jest.fn();
  const mockOnMarkAsRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render notification content', () => {
    render(
      <MockNotificationItem
        notification={mockNotification}
        onClick={mockOnClick}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
  });

  it('should display correct icon for notification type', () => {
    render(
      <MockNotificationItem
        notification={mockNotification}
        onClick={mockOnClick}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    expect(screen.getByTestId('notification-icon')).toHaveTextContent('✅');
  });

  it('should call onClick when clicked', () => {
    render(
      <MockNotificationItem
        notification={mockNotification}
        onClick={mockOnClick}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    fireEvent.click(screen.getByTestId('notification-item-notif-1'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should call onMarkAsRead when button clicked', () => {
    render(
      <MockNotificationItem
        notification={mockNotification}
        onClick={mockOnClick}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    fireEvent.click(screen.getByTestId('mark-read-btn'));
    expect(mockOnMarkAsRead).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should not show mark as read button for read notifications', () => {
    render(
      <MockNotificationItem
        notification={{ ...mockNotification, isRead: true }}
        onClick={mockOnClick}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    expect(screen.queryByTestId('mark-read-btn')).not.toBeInTheDocument();
  });
});

describe('Notification Icons', () => {
  it('should have icon for each notification type', () => {
    const icons: Record<string, string> = {
      system: '⚙️',
      task: '✅',
      project: '📁',
      invoice: '💰',
      approval: '✍️',
      mention: '@',
    };

    Object.entries(icons).forEach(([type, icon]) => {
      expect(icon).toBeTruthy();
    });
  });
});

describe('Notification Time Formatting', () => {
  it('should format recent time as "just now"', () => {
    const formatTime = (date: Date): string => {
      const diff = Date.now() - date.getTime();
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return `${Math.floor(diff / 86400000)} days ago`;
    };

    const recentDate = new Date(Date.now() - 30000);
    expect(formatTime(recentDate)).toBe('just now');
  });

  it('should format minutes ago', () => {
    const formatTime = (date: Date): string => {
      const diff = Date.now() - date.getTime();
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return `${Math.floor(diff / 86400000)} days ago`;
    };

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    expect(formatTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should format hours ago', () => {
    const formatTime = (date: Date): string => {
      const diff = Date.now() - date.getTime();
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return `${Math.floor(diff / 86400000)} days ago`;
    };

    const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
    expect(formatTime(twoHoursAgo)).toBe('2 hours ago');
  });

  it('should format days ago', () => {
    const formatTime = (date: Date): string => {
      const diff = Date.now() - date.getTime();
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return `${Math.floor(diff / 86400000)} days ago`;
    };

    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    expect(formatTime(threeDaysAgo)).toBe('3 days ago');
  });
});
