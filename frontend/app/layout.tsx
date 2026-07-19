// frontend/app/layout.tsx
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Study Assistant',
  description: 'Votre compagnon intelligent pour l\'apprentissage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}>
          <AuthProvider>
            <ChatProvider>
              {children}
              <Toaster position="top-right" />
            </ChatProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}