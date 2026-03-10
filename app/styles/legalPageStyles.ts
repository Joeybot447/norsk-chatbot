/**
 * Shared styles for legal pages (personvern, cookies, brukervilkar)
 * Single source of truth - no duplication across pages
 */



export const navStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  padding: '16px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',

};

export const logoStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#0f172a',
  textDecoration: 'none',
};

export const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
};

export const navLinkStyle: React.CSSProperties = {
  color: '#64748b',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
};

export const containerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '48px 24px 64px',

  color: '#334155',
  fontSize: '16px',
  lineHeight: 1.7,
};

export const h1Style: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: '8px',
  lineHeight: 1.3,
};

export const h2Style: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#1e293b',
  marginTop: '40px',
  marginBottom: '16px',
  lineHeight: 1.3,
};

export const h3Style: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#1e293b',
  marginTop: '24px',
  marginBottom: '12px',
};

export const sectionStyle: React.CSSProperties = {
  paddingBottom: '32px',
  marginBottom: '32px',
  borderBottom: '1px solid #e2e8f0',
};

export const lastSectionStyle: React.CSSProperties = {
  paddingBottom: '32px',
  marginBottom: '32px',
};

export const updatedStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '14px',
  marginBottom: '40px',
};

export const ulStyle: React.CSSProperties = {
  paddingLeft: '24px',
  marginBottom: '16px',
};

export const liStyle: React.CSSProperties = {
  marginBottom: '8px',
};

export const linkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'underline',
};

export const footerStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
  padding: '32px 24px',

};

export const footerInnerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap' as const,
  gap: '24px',
};

export const footerColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
};

export const footerLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#1e293b',
  marginBottom: '4px',
};

export const footerLinkStyle: React.CSSProperties = {
  color: '#64748b',
  textDecoration: 'none',
  fontSize: '14px',
};

export const footerCopyStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94a3b8',
  marginTop: '24px',
  width: '100%',
  textAlign: 'center' as const,
};
