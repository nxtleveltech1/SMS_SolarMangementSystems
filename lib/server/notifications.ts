import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const from = process.env.ALERT_EMAIL_FROM || 'alerts@solarflow.local'
const to = process.env.ALERT_EMAIL_TO || 'ops@solarflow.local'

const client = apiKey ? new Resend(apiKey) : null

export const sendTestEmail = async () => {
  if (!client) {
    return { sent: false, reason: 'RESEND_API_KEY missing' }
  }

  const result = await client.emails.send({
    from,
    to,
    subject: 'SolarFlow test alert',
    html: '<p>SolarFlow alert pipeline is configured and reachable.</p>',
  })

  return { sent: true, id: result.data?.id }
}
