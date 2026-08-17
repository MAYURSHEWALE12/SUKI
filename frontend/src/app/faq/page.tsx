import React from 'react';

export default function FAQPage() {
  const faqs = [
    {
      question: "How long does delivery take?",
      answer: "Standard delivery within India takes 3-5 business days. Remote areas may take up to 7-10 days."
    },
    {
      question: "Do you ship internationally?",
      answer: "Currently, we only ship within India. We are working on expanding our delivery network soon."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order is dispatched, you will receive a tracking link via email and SMS. You can also track your order in the 'My Orders' section of your account."
    },
    {
      question: "Do you offer Custom Fitting or Alterations?",
      answer: "Currently, we offer standard sizes. However, most of our Lehengas and blouses come with ample margin for minor alterations by your local tailor."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), Net Banking, and popular Wallets."
    }
  ];

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#C2185B', fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 700, textAlign: 'center' }}>Frequently Asked Questions</h1>
      <p style={{ color: '#6b7280', marginBottom: '3rem', textAlign: 'center' }}>Find answers to common questions about our products and services.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1f2937', marginTop: 0, marginBottom: '0.75rem', fontWeight: 600 }}>{faq.question}</h3>
            <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6 }}>{faq.answer}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem', backgroundColor: '#FDF2F8', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#C2185B', marginBottom: '0.5rem', marginTop: 0 }}>Still have questions?</h3>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>Our support team is here to help you.</p>
        <a href="mailto:support@sukiethnic.com" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#C2185B', color: '#fff', textDecoration: 'none', borderRadius: '50px', fontWeight: 600, transition: 'opacity 0.2s' }}>
          Contact Support
        </a>
      </div>
    </div>
  );
}
