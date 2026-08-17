import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#C2185B', fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Effective Date: 16 August 2026</p>

      <div style={{ lineHeight: 1.8, color: '#374151', fontSize: '1rem' }}>
        <p style={{ marginBottom: '1.5rem' }}>
          By using our website, creating an account, or placing an order, you agree to our policies. 
          Suki Ethnic may collect your name, mobile number, email address, billing/shipping details, 
          order and transaction information to process orders, provide customer support, improve our 
          services, prevent fraud, and comply with applicable laws.
        </p>

        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>1. Information We Collect</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Your information may be shared only with trusted service providers such as payment gateways, 
          delivery partners, technology providers, and authorities where legally required. We do not sell 
          or rent your personal information.
        </p>

        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>2. Cookies and Tracking</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Our website may use cookies and similar technologies for essential functions, preferences, 
          analytics, and permitted marketing activities.
        </p>
        
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>3. Data Security</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no internet transmission is ever completely secure or error-free.
        </p>
        
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>4. Your Rights</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          You have the right to access, correct, or delete your personal information. You may also opt-out of marketing communications at any time.
        </p>

        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #C2185B' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#1f2937', marginBottom: '0.5rem', marginTop: 0 }}>Contact Us</h3>
          <p style={{ margin: 0 }}>If you have any questions regarding this Privacy Policy, please contact us at support@sukiethnic.com or via WhatsApp at +91-7768875524.</p>
        </div>
      </div>
    </div>
  );
}
