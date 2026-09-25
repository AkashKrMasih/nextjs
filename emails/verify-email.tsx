import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

export function VerifyEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email to finish creating your account</Preview>
      <Body style={{ backgroundColor: '#fafaf9', fontFamily: 'sans-serif' }}>
        <Container style={{ margin: '40px auto', padding: '24px', backgroundColor: '#ffffff' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Verify your email</Heading>
          <Text style={{ fontSize: '14px', color: '#44403c' }}>
            Confirm this address to finish creating your account. This link expires in 24 hours.
          </Text>
          <Button
            href={verifyUrl}
            style={{
              backgroundColor: '#166534',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '12px 16px',
              fontSize: '14px',
            }}
          >
            Verify email
          </Button>
          <Text style={{ fontSize: '12px', color: '#78716c' }}>
            If you did not create an account, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
