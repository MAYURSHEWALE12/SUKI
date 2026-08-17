import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="card skeleton-card">
      <div className="card-media skeleton">
      </div>
      <div className="card-body">
        <div className="cat skeleton" style={{ width: '40%', height: '12px', marginBottom: '10px' }}></div>
        <div className="title skeleton" style={{ width: '85%', height: '20px', marginBottom: '15px' }}></div>
        <div className="price-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="now skeleton" style={{ width: '30%', height: '18px' }}></div>
          <div className="was skeleton" style={{ width: '20%', height: '14px' }}></div>
        </div>
      </div>

      <style jsx>{`
        .skeleton-card {
          border: 1px solid var(--line);
          border-radius: 6px 6px 14px 14px;
          overflow: hidden;
          background: #fff;
          display: flex;
          flex-direction: column;
        }
        .card-media {
          height: 320px;
          width: 100%;
          border-radius: 0;
        }
        .card-body {
          padding: 18px 18px 20px;
        }
      `}</style>
    </div>
  );
}
