/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Codul tău de verificare MVA Imobiliare</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://fdpandnzblzvamhsoukt.supabase.co/storage/v1/object/public/email-assets/mva-logo.png" width="180" height="60" alt="MVA Imobiliare" style={{ margin: '0 auto' }} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirmă identitatea</Heading>
          <Text style={text}>Folosește codul de mai jos pentru a-ți confirma identitatea:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footerText}>
            Acest cod va expira în curând. Dacă nu ai solicitat acest cod, poți ignora acest email în siguranță.
          </Text>
        </Section>
        <Section style={footerSection}>
          <Text style={footerBrand}>© {new Date().getFullYear()} MVA IMOBILIARE</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#1a1a1a', padding: '30px 25px', textAlign: 'center' as const }
const content = { padding: '40px 30px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a4a4a', lineHeight: '1.7', margin: '0 0 25px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#DAA520',
  margin: '0 0 30px',
  backgroundColor: '#1a1a1a',
  padding: '15px 25px',
  borderRadius: '8px',
  textAlign: 'center' as const,
}
const footerText = { fontSize: '13px', color: '#999999', margin: '30px 0 0' }
const footerSection = { backgroundColor: '#1a1a1a', padding: '20px 25px', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#DAA520', margin: '0' }
