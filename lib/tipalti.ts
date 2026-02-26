import crypto from 'crypto';
import axios from 'axios';

const TIPALTI_API_KEY = process.env.TIPALTI_API_KEY ?? '';
const TIPALTI_PAYER_NAME = process.env.TIPALTI_PAYER_NAME ?? '';
const TIPALTI_SANDBOX = process.env.TIPALTI_SANDBOX !== 'false';

const PAYEE_BASE = TIPALTI_SANDBOX ? 'https://api.sandbox.tipalti.com' : 'https://api.tipalti.com';
const PAYER_BASE = TIPALTI_SANDBOX ? 'https://api.sandbox.tipalti.com' : 'https://api.tipalti.com';
const UI_BASE = TIPALTI_SANDBOX ? 'https://ui.sandbox.tipalti.com' : 'https://ui.tipalti.com';
const API_VERSION = 'v11';

function signPayee(idap: string, timestamp: number): string {
  const str = TIPALTI_PAYER_NAME + idap + timestamp;
  return crypto.createHmac('sha256', TIPALTI_API_KEY).update(str, 'utf8').digest('hex');
}

function signPayer(timestamp: number, eat?: string): string {
  const str = eat ? TIPALTI_PAYER_NAME + timestamp + eat : TIPALTI_PAYER_NAME + timestamp;
  return crypto.createHmac('sha256', TIPALTI_API_KEY).update(str, 'utf8').digest('hex');
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export type AffiliateForTipalti = { id: string; name: string; email: string };

/**
 * Register affiliate in Tipalti and optionally send invite email.
 * Uses affiliate.id as Tipalti idap for 1:1 mapping.
 */
export async function createPayee(affiliate: AffiliateForTipalti, sendInvite = true): Promise<{ idap: string }> {
  const idap = affiliate.id;
  const timestamp = Math.floor(Date.now() / 1000);
  const key = signPayee(idap, timestamp);
  const parts = affiliate.name.trim().split(/\s+/);
  const firstName = parts[0] ?? 'Payee';
  const lastName = parts.slice(1).join(' ') || 'User';

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:UpdateOrCreatePayeeInfo>
      <tip:payerName>${escapeXml(TIPALTI_PAYER_NAME)}</tip:payerName>
      <tip:idap>${escapeXml(idap)}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${escapeXml(key)}</tip:key>
      <tip:skipNulls>1</tip:skipNulls>
      <tip:overridePayableCountry>false</tip:overridePayableCountry>
      <tip:item>
        <tip:Idap>${escapeXml(idap)}</tip:Idap>
        <tip:FirstName>${escapeXml(firstName)}</tip:FirstName>
        <tip:LastName>${escapeXml(lastName)}</tip:LastName>
        <tip:Email>${escapeXml(affiliate.email)}</tip:Email>
        <tip:PayeeEntityType>Individual</tip:PayeeEntityType>
        <tip:SendSupplierPortalInvite>${sendInvite ? 'true' : 'false'}</tip:SendSupplierPortalInvite>
      </tip:item>
    </tip:UpdateOrCreatePayeeInfo>
  </soap:Body>
</soap:Envelope>`;

  const res = await axios.post(`${PAYEE_BASE}/${API_VERSION}/PayeeFunctions.asmx`, body, {
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    timeout: 30000,
  });

  const data = res.data as string;
  if (data.includes('ErrorMessage') && data.includes('<tip:ErrorMessage>')) {
    const match = data.match(/<tip:ErrorMessage>([^<]*)<\/tip:ErrorMessage>/);
    throw new Error(match ? match[1] : 'Tipalti create payee failed');
  }
  return { idap };
}

export type PayeeStatus = 'pending' | 'active' | 'blocked';

/**
 * Check if payee has completed tax/banking info (Payable in Tipalti).
 */
export async function getPayeeStatus(affiliateId: string): Promise<PayeeStatus> {
  const timestamp = Math.floor(Date.now() / 1000);
  const key = signPayee(affiliateId, timestamp);

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetExtendedPayeeDetails>
      <tip:payerName>${escapeXml(TIPALTI_PAYER_NAME)}</tip:payerName>
      <tip:idap>${escapeXml(affiliateId)}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${escapeXml(key)}</tip:key>
    </tip:GetExtendedPayeeDetails>
  </soap:Body>
</soap:Envelope>`;

  const res = await axios.post(`${PAYEE_BASE}/${API_VERSION}/PayeeFunctions.asmx`, body, {
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    timeout: 15000,
  });

  const data = res.data as string;
  if (data.includes('ErrorMessage') && data.includes('<tip:ErrorMessage>')) {
    const match = data.match(/<tip:ErrorMessage>([^<]*)<\/tip:ErrorMessage>/);
    throw new Error(match ? match[1] : 'Tipalti get payee failed');
  }
  const payable = /<tip:Payable>(?:true|1)<\/tip:Payable>/i.test(data);
  const blocked = /<tip:Blocked>(?:true|1)<\/tip:Blocked>/i.test(data);
  if (blocked) return 'blocked';
  return payable ? 'active' : 'pending';
}

/**
 * Trigger a payment in Tipalti. refCode must be unique (e.g. payout id).
 */
export async function submitPayment(
  affiliateId: string,
  amount: number,
  currency: string,
  refCode: string
): Promise<{ refCode: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const groupTitle = `aff-${affiliateId}-${timestamp}`;
  const key = signPayer(timestamp, groupTitle);

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:ProcessPayments>
      <tip:payerName>${escapeXml(TIPALTI_PAYER_NAME)}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${escapeXml(key)}</tip:key>
      <tip:paymentGroupTitle>${escapeXml(groupTitle)}</tip:paymentGroupTitle>
      <tip:paymentOrders>
        <tip:ProcessPaymentInfo>
          <tip:Idap>${escapeXml(affiliateId)}</tip:Idap>
          <tip:Amount>${amount}</tip:Amount>
          <tip:RefCode>${escapeXml(refCode)}</tip:RefCode>
          <tip:Currency>${escapeXml(currency)}</tip:Currency>
        </tip:ProcessPaymentInfo>
      </tip:paymentOrders>
    </tip:ProcessPayments>
  </soap:Body>
</soap:Envelope>`;

  const res = await axios.post(`${PAYER_BASE}/${API_VERSION}/PayerFunctions.asmx`, body, {
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    timeout: 30000,
  });

  const data = res.data as string;
  if (data.includes('ErrorMessage') && data.includes('<tip:ErrorMessage>')) {
    const match = data.match(/<tip:ErrorMessage>([^<]*)<\/tip:ErrorMessage>/);
    throw new Error(match ? match[1] : 'Tipalti submit payment failed');
  }
  return { refCode };
}

/**
 * Generate Tipalti Payee Dashboard URL for the affiliate to complete banking/tax info.
 */
export function generateOnboardingLink(affiliateId: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const hash = signPayee(affiliateId, timestamp);
  const params = new URLSearchParams({
    payer: TIPALTI_PAYER_NAME,
    idap: affiliateId,
    ts: String(timestamp),
    hash,
  });
  return `${UI_BASE}/PayeeDashboard/Login?${params.toString()}`;
}

/**
 * Test connection (e.g. GetExtendedPayeeDetails for a dummy idap or simple auth check).
 */
export async function testConnection(): Promise<boolean> {
  if (!TIPALTI_API_KEY || !TIPALTI_PAYER_NAME) return false;
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const key = signPayee('__test__', timestamp);
    const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetExtendedPayeeDetails>
      <tip:payerName>${escapeXml(TIPALTI_PAYER_NAME)}</tip:payerName>
      <tip:idap>__test__</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${escapeXml(key)}</tip:key>
    </tip:GetExtendedPayeeDetails>
  </soap:Body>
</soap:Envelope>`;
    const res = await axios.post(`${PAYEE_BASE}/${API_VERSION}/PayeeFunctions.asmx`, body, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      timeout: 10000,
      validateStatus: () => true,
    });
    const data = res.data as string;
    if (data.includes('Invalid key') || data.includes('Authentication failed')) return false;
    return true;
  } catch {
    return false;
  }
}
