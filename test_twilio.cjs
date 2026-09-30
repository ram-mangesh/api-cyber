// Standalone smoke test for the Twilio alert path.
// Usage (PowerShell):
//   $env:VITE_TWILIO_ACCOUNT_SID="AC..."; $env:VITE_TWILIO_AUTH_TOKEN="..."
//   $env:VITE_TWILIO_TO_NUMBER="+1..."; $env:VITE_TWILIO_FROM_NUMBER="+1..."
//   node test_twilio.cjs
const axios = require('axios');

const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID
const authToken = process.env.VITE_TWILIO_AUTH_TOKEN
const toNumber = process.env.VITE_TWILIO_TO_NUMBER
const fromNumber = process.env.VITE_TWILIO_FROM_NUMBER

const required = { VITE_TWILIO_ACCOUNT_SID: accountSid, VITE_TWILIO_AUTH_TOKEN: authToken, VITE_TWILIO_TO_NUMBER: toNumber, VITE_TWILIO_FROM_NUMBER: fromNumber }
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k)

if (missing.length) {
  console.error(`Missing env values: ${missing.join(', ')}`)
  process.exit(1)
}

const testCall = async () => {
  const twimlXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather numDigits="1" action="${process.env.VITE_TWILIO_GATHER_ACTION_URL || ''}" method="POST">
        <Say voice="Polly.Matthew-Neural" language="en-US">Test Dynamic Twimlets</Say>
    </Gather>
    <Say voice="Polly.Matthew-Neural">Done.</Say>
</Response>`

  const tEchoUrl = 'https://twimlets.com/echo?Twiml=' + encodeURIComponent(twimlXml)

  const data = new URLSearchParams()
  data.append('To', toNumber)
  data.append('From', fromNumber)
  data.append('Url', tEchoUrl)

  try {
    const res = await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    })
    console.log('Success:', res.data.sid)
  } catch (err) {
    console.log('Twilio Error:', err.response ? err.response.data : err.message)
  }
}
testCall();
