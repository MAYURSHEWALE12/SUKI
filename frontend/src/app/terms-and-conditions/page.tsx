import React from 'react';

export default function TermsAndConditionsPage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#C2185B', fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Terms & Conditions</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Effective Date: 16 August 2026</p>

      <div style={{ lineHeight: 1.8, color: '#374151', fontSize: '1rem' }}>
        <p style={{ marginBottom: '1.5rem' }}>
          Welcome to Suki Ethnic! These Terms & Conditions govern your use of our website and services. By accessing or using our website, you agree to be bound by these terms.
        </p>

        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>1. General Conditions</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information) may be transferred unencrypted and involve transmissions over various networks.
        </p>

        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>2. Products and Pricing</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Product prices, availability, descriptions, colours and images may vary and are subject to change without notice. We have made every effort to display as accurately as possible the colours and images of our products, but we cannot guarantee that your computer monitor&apos;s display of any colour will be accurate.
        </p>
        
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>3. Order Processing</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Orders are processed and delivered within the timelines displayed at checkout, subject to availability and circumstances beyond our control. We reserve the right to limit the sales of our products or Services to any person, geographic region or jurisdiction.
        </p>
        
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>4. Governing Law</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
        </p>

        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #C2185B' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#1f2937', marginBottom: '0.5rem', marginTop: 0 }}>Questions?</h3>
          <p style={{ margin: 0 }}>Questions about the Terms of Service should be sent to us at support@sukiethnic.com.</p>
        </div>
      </div>
    </div>
  );
}
