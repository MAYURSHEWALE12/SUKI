"use client";

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Pending Payment': { bg: '#fef3c7', color: '#b45309' },
  'Payment Failed': { bg: '#fee2e2', color: '#b91c1c' },
  Processing: { bg: '#ffedd5', color: '#ea580c' },
  Shipped: { bg: '#e0e7ff', color: '#4338ca' },
  Delivered: { bg: '#dcfce3', color: '#15803d' },
  Cancelled: { bg: '#f3f4f6', color: '#4b5563' },
  Refunded: { bg: '#f3e8ff', color: '#7c3aed' },
};

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || { bg: '#f3f4f6', color: '#4b5563' };
  return (
    <span style={{
      backgroundColor: style.bg,
      color: style.color,
      textTransform: 'uppercase',
      padding: '0.3rem 0.8rem',
      borderRadius: '50px',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.5px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      border: 'none',
      whiteSpace: 'nowrap',
    }}>
      {showDot && <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />}
      {status}
    </span>
  );
}