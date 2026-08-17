"use client";
import React, { useState } from 'react';

export default function ReturnPolicyPage() {
  const [openCard, setOpenCard] = useState<number | null>(null);

  const toggleCard = (index: number) => {
    if (openCard === index) {
      setOpenCard(null);
    } else {
      setOpenCard(index);
    }
  };

  return (
    <div style={{ backgroundColor: '#FAFAFA', minHeight: '100vh', padding: '4rem 1rem' }}>
      <div className="container" style={{ maxWidth: '850px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: '#C2185B', fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>Exchange, Return & Refund Policy</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ height: '1px', width: '40px', backgroundColor: '#F7D8E2' }}></div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#C2185B">
              <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" />
            </svg>
            <div style={{ height: '1px', width: '40px', backgroundColor: '#F7D8E2' }}></div>
          </div>
          
          <p style={{ color: '#4b5563', fontSize: '1.05rem' }}>
            Effective Date: <span style={{ color: '#C2185B', fontWeight: 600 }}>16 August 2026</span>
          </p>
        </div>

        {/* Content Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card 1: Strict Policy */}
          <div style={{ display: 'flex', alignItems: 'flex-start', backgroundColor: '#FFF5F8', border: '1px solid #F7D8E2', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '70px', height: '70px', backgroundColor: '#FDECEF', borderRadius: '50%', flexShrink: 0, marginRight: '1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: '15px 0 0.5rem 0', color: '#C2185B', fontSize: '1.15rem', fontWeight: 600 }}>Strict No-Refund / No-Exchange Policy</h3>
              <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6, fontSize: '0.95rem' }}>
                We strictly do not offer refunds, returns, or exchanges under normal circumstances. 
                Each product is carefully quality-checked before dispatch.
              </p>
            </div>
          </div>

          {/* Card 2: Exceptions for Damages */}
          <div 
            onClick={() => toggleCard(1)}
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #F3F4F6', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '70px', height: '70px', backgroundColor: '#FFF5F8', borderRadius: '16px', flexShrink: 0, marginRight: '1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            
            <div style={{ width: '1px', height: openCard === 1 ? '100px' : '60px', borderLeft: '2px dashed #F7D8E2', marginRight: '1.5rem', transition: 'height 0.3s ease' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '32px', height: '32px', backgroundColor: '#C2185B', color: '#FFF', borderRadius: '50%', flexShrink: 0, marginRight: '1.5rem', marginTop: '19px', fontWeight: 600, fontSize: '15px' }}>
              1
            </div>

            <div style={{ flex: 1, marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.15rem', fontWeight: 600 }}>Exceptions for Damages</h3>
                <svg 
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  style={{ transform: openCard === 1 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div style={{ 
                maxHeight: openCard === 1 ? '500px' : '0', 
                overflow: 'hidden', 
                transition: 'max-height 0.3s ease, opacity 0.3s ease',
                opacity: openCard === 1 ? 1 : 0
              }}>
                <p style={{ margin: 0, paddingTop: '0.5rem', color: '#4b5563', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Exceptions for replacement or refund are only made if a product is delivered physically damaged. 
                  In such rare cases, the customer must provide an uninterrupted, unedited unboxing video 
                  from the time the sealed package is opened, clearly showing the damage.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Reporting a Claim */}
          <div 
            onClick={() => toggleCard(2)}
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #F3F4F6', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '70px', height: '70px', backgroundColor: '#FFF5F8', borderRadius: '16px', flexShrink: 0, marginRight: '1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" strokeDasharray="3 3"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            
            <div style={{ width: '1px', height: openCard === 2 ? '100px' : '60px', borderLeft: '2px dashed #F7D8E2', marginRight: '1.5rem', transition: 'height 0.3s ease' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '32px', height: '32px', backgroundColor: '#C2185B', color: '#FFF', borderRadius: '50%', flexShrink: 0, marginRight: '1.5rem', marginTop: '19px', fontWeight: 600, fontSize: '15px' }}>
              2
            </div>

            <div style={{ flex: 1, marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.15rem', fontWeight: 600 }}>Reporting a Claim</h3>
                <svg 
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  style={{ transform: openCard === 2 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div style={{ 
                maxHeight: openCard === 2 ? '500px' : '0', 
                overflow: 'hidden', 
                transition: 'max-height 0.3s ease, opacity 0.3s ease',
                opacity: openCard === 2 ? 1 : 0
              }}>
                <p style={{ margin: 0, paddingTop: '0.5rem', color: '#4b5563', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Any claims for damaged goods must be reported to us within 24 hours of delivery. Once verified, 
                  we will arrange for a replacement. If a replacement is unavailable, a refund will be initiated to 
                  the original payment method.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Cancellation Policy */}
          <div 
            onClick={() => toggleCard(3)}
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #F3F4F6', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '70px', height: '70px', backgroundColor: '#FFF5F8', borderRadius: '16px', flexShrink: 0, marginRight: '1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                <path d="M9.5 13.5l5 5m0-5l-5 5"/>
              </svg>
            </div>
            
            <div style={{ width: '1px', height: openCard === 3 ? '100px' : '60px', borderLeft: '2px dashed #F7D8E2', marginRight: '1.5rem', transition: 'height 0.3s ease' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '32px', height: '32px', backgroundColor: '#C2185B', color: '#FFF', borderRadius: '50%', flexShrink: 0, marginRight: '1.5rem', marginTop: '19px', fontWeight: 600, fontSize: '15px' }}>
              3
            </div>

            <div style={{ flex: 1, marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.15rem', fontWeight: 600 }}>Cancellation Policy</h3>
                <svg 
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  style={{ transform: openCard === 3 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div style={{ 
                maxHeight: openCard === 3 ? '500px' : '0', 
                overflow: 'hidden', 
                transition: 'max-height 0.3s ease, opacity 0.3s ease',
                opacity: openCard === 3 ? 1 : 0
              }}>
                <p style={{ margin: 0, paddingTop: '0.5rem', color: '#4b5563', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Cancellation is only permitted before the order is dispatched. Once the order leaves our facility, 
                  no cancellations will be accepted.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Need Help */}
          <div style={{ display: 'flex', alignItems: 'flex-start', backgroundColor: '#FFF5F8', border: '2px solid #C2185B', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem', boxShadow: '0 4px 12px rgba(194, 24, 91, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '70px', height: '70px', backgroundColor: '#FDECEF', borderRadius: '50%', flexShrink: 0, marginRight: '1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                <path d="M19 22H5"/>
                <path d="M12 22v-3"/>
              </svg>
            </div>
            <div style={{ width: '100%', marginTop: '5px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#C2185B', fontSize: '1.15rem', fontWeight: 600 }}>Need Help?</h3>
              <p style={{ margin: '0 0 1rem 0', color: '#4b5563', lineHeight: 1.5, fontSize: '0.95rem' }}>
                To report an issue or submit an unboxing video, please contact our support team at
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.95rem', color: '#1f2937', fontWeight: 500 }}>
                <a href="mailto:support@sukiethnic.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1f2937', textDecoration: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  support@sukiethnic.com
                </a>
                
                <div style={{ width: '1px', height: '16px', backgroundColor: '#D1D5DB' }}></div>
                
                <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1f2937', textDecoration: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Message us on WhatsApp
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
