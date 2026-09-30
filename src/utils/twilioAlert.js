import axios from 'axios'

const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID
const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN
const toNumber = import.meta.env.VITE_TWILIO_TO_NUMBER
const fromNumber = import.meta.env.VITE_TWILIO_FROM_NUMBER
const gatherActionUrl = import.meta.env.VITE_TWILIO_GATHER_ACTION_URL

export const isTwilioConfigured = () =>
  Boolean(accountSid && authToken && toNumber && fromNumber)

export const triggerTwilioCall = async (count = 1, severity = 'Critical') => {
  if (!isTwilioConfigured()) {
    throw new Error('Twilio is not configured. Set the VITE_TWILIO_* variables in .env')
  }

  // Fully DYNAMIC XML payload
  const twimlXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather numDigits="1" action="${gatherActionUrl || ''}" method="POST">
        <Say voice="Polly.Matthew-Neural" language="en-US">
            Hello. ${count} ${severity} vulnerabilities have been detected in your model.
            Select an action from the following options.
            Press 1 to create and assign these vulnerabilities in the Issue Tracker.
            Press 2 to initiate a retest by the security team.
            Press 3 to ignore these findings or mark them as accepted risks.
            Press 4 to receive a reminder later regarding these vulnerabilities.
        </Say>
    </Gather>
    <Say voice="Polly.Matthew-Neural">We didn't receive any input. Goodbye.</Say>
</Response>`

  // Using Twilio's official Twimlets Echo service to convert raw dynamic XML to a Public URL
  // This bypasses the "Twiml" parameter limitation on Free Trial accounts
  const echoUrl = 'https://twimlets.com/echo?Twiml=' + encodeURIComponent(twimlXml)

  const data = new URLSearchParams()
  data.append('To', toNumber)
  data.append('From', fromNumber)
  data.append('Url', echoUrl)

  try {
    await axios.post(`/twilio/2010-04-01/Accounts/${accountSid}/Calls.json`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + window.btoa(`${accountSid}:${authToken}`)
      }
    })
    console.log('Critical Alert: Dynamic AI Call Initiated Successfully!')
  } catch (error) {
    console.error('Failed to initiate Twilio call:', error?.response?.data || error.message)
    throw new Error(error?.response?.data?.message || error.message)
  }
}
