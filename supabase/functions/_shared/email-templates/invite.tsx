/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Ai fost invitat pe MVA Imobiliare</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://fdpandnzblzvamhsoukt.supabase.co/storage/v1/object/public/email-assets/mva-logo.png" width="180" height="60" alt="MVA Imobiliare" style={{ margin: '0 auto' }} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>Ai primit o invitație</Heading>
          <Text style={text}>
            Ai fost invitat să te alături pe{' '}
            <Link href={siteUrl} style={link}>
              <strong>MVA Imobiliare</strong>
            </Link>
            . Apasă butonul de mai jos pentru a accepta invitația și a-ți crea contul.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Acceptă Invitația
          </Button>
          <Text style={footerText}>
            Dacă nu așteptai această invitație, poți ignora acest email în siguranță.
          </Text>
        </Section>
        <Section style={footerSection}>
          <Text style={footerBrand}>© {new Date().getFullYear()} MVA IMOBILIARE</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#1a1a1a', padding: '30px 25px', textAlign: 'center' as const }
const content = { padding: '40px 30px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a4a4a', lineHeight: '1.7', margin: '0 0 25px' }
const link = { color: '#DAA520', textDecoration: 'underline' }
const button = { backgroundColor: '#DAA520', color: '#1a1a1a', fontSize: '16px', fontWeight: '600' as const, borderRadius: '8px', padding: '14px 32px', textDecoration: 'none' }
const footerText = { fontSize: '13px', color: '#999999', margin: '30px 0 0' }
const footerSection = { backgroundColor: '#1a1a1a', padding: '20px 25px', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#DAA520', margin: '0' }
