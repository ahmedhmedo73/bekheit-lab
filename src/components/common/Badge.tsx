import React, { type ReactNode } from 'react';
import type { UserStatus } from '../../types/user';
import type { UserRole } from '../../types/auth';

type BadgeVariant =
  | 'primary'
  | 'teal'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  switch (status) {
    case 'Active':
      return (
        <Badge variant="success" dot size="sm">
          Active
        </Badge>
      );
    case 'On Leave':
      return (
        <Badge variant="warning" dot size="sm">
          On Leave
        </Badge>
      );
    case 'Suspended':
      return (
        <Badge variant="danger" dot size="sm">
          Suspended
        </Badge>
      );
    case 'In Training':
      return (
        <Badge variant="info" dot size="sm">
          In Training
        </Badge>
      );
    default:
      return <Badge variant="neutral" size="sm">{status}</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: UserRole }> = () => {
  return <Badge variant="primary" size="sm">Admin</Badge>;
};
