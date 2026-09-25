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

export function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={{ backgroundColor: '#fafaf9', fontFamily: 'sans-serif' }}>
        <Container style={{ margin: '40px auto', padding: '24px', backgroundColor: '#ffffff' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Reset your password</Heading>
          <Text style={{ fontSize: '14px', color: '#44403c' }}>
            Use the button below to choose a new password. This link expires in 1 hour.
          </Text>
          <Button
            href={resetUrl}
            style={{
              backgroundColor: '#166534',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '12px 16px',
              fontSize: '14px',
            }}
          >
            Reset password
          </Button>
          <Text style={{ fontSize: '12px', color: '#78716c' }}>
            If you did not ask for this, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
