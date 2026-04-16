// =====================================================================
// VULN-036  HARDCODED AWS CREDENTIALS IN SOURCE / RESPONSE
// CWE-798  |  OWASP A02:2021  |  CVSS 9.8 (Critical)
//
// VULN-037  HARDCODED STRIPE SECRET KEY
// CWE-798  |  OWASP A02:2021  |  CVSS 9.1 (Critical)
//
// VULN-038  HARDCODED FIREBASE CONFIG (API Key + DB URL públicos)
// CWE-798  |  OWASP A02:2021  |  CVSS 7.5 (High)
//
// VULN-039  HARDCODED SUPABASE SERVICE ROLE KEY
// CWE-798  |  OWASP A02:2021  |  CVSS 9.1 (Critical)
//
// VULN-040  GCP SERVICE ACCOUNT JSON LEAK
// CWE-798  |  OWASP A02:2021  |  CVSS 9.8 (Critical)
// ---------------------------------------------------------------------
// Chaves fake plantadas diretamente no código-fonte (detectável por SAST)
// E retornadas via endpoint /api/cloud/config (detectável por DAST).
// =====================================================================
const express = require('express');
const router = express.Router();

// VULN-036: AWS creds hardcoded no source
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const AWS_REGION = 'us-east-1';

// VULN-037: Stripe secret key hardcoded
const STRIPE_SECRET_KEY = 'sk_live_51FakeKeyThatLooksRealButIsNotxxxxxxxxxxxxxxxx';
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51FakePublishableKeyxxxxxxxxxxxxxxxxxxxxxxxxx';

// VULN-038: Firebase config exposta
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyFAKE-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  authDomain: 'vulnhub-cyberdyne.firebaseapp.com',
  databaseURL: 'https://vulnhub-cyberdyne-default-rtdb.firebaseio.com',
  projectId: 'vulnhub-cyberdyne',
  storageBucket: 'vulnhub-cyberdyne.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:fakefakefakefake'
};

// VULN-039: Supabase service_role (bypassa RLS)
const SUPABASE_URL = 'https://xyzfakeproject.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emZha2Vwcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.FAKE_SERVICE_ROLE_KEY';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emZha2Vwcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.FAKE_ANON_KEY';

// VULN-040: GCP service account JSON
const GCP_SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'cyberdyne-vulnhub-prod',
  private_key_id: 'key123456789fake',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0FAKEKEY0FAKEKEY0FAKEKEY0FAKEKEY\n-----END RSA PRIVATE KEY-----\n',
  client_email: 'vulnhub-sa@cyberdyne-vulnhub-prod.iam.gserviceaccount.com',
  client_id: '000000000000000000000',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token'
};

// Endpoint que retorna TODAS as chaves (DAST target)
router.get('/cloud/config', (_req, res) => {
  res.json({
    aws: { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION },
    stripe: { STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY },
    firebase: FIREBASE_CONFIG,
    supabase: { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY },
    gcp: GCP_SERVICE_ACCOUNT,
    _warning: 'This endpoint exposes all cloud credentials. SAST should also find them hardcoded in source.'
  });
});

// Endpoint individual para cada provider (superfície mais granular para o scanner)
router.get('/cloud/aws', (_req, res) => {
  res.json({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, region: AWS_REGION });
});

router.get('/cloud/stripe', (_req, res) => {
  res.json({ secretKey: STRIPE_SECRET_KEY, publishableKey: STRIPE_PUBLISHABLE_KEY });
});

router.get('/cloud/firebase', (_req, res) => {
  res.json(FIREBASE_CONFIG);
});

router.get('/cloud/supabase', (_req, res) => {
  res.json({ url: SUPABASE_URL, serviceRole: SUPABASE_SERVICE_ROLE, anonKey: SUPABASE_ANON_KEY });
});

module.exports = router;
