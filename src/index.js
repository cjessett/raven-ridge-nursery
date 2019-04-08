const AWSIoTData = require('aws-iot-device-sdk');
// Initialize the Amazon Cognito credentials provider
AWS.config.region = process.env.REGION; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.IDENTITY_POOL_ID,
});

const iotData = new AWS.IotData({
    endpoint: process.env.ENDPOINT,
    region: process.env.REGION,
});

function setDiff(date) {
  return () => {      
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime()) / 1000;

    const d = Math.floor(diff / 86400);
    const h = Math.floor(diff / 3600) % 24;
    const m = Math.floor(diff / 60) % 60;
    const s = Math.floor(diff % 60);

    let display = '';
    if (d) display += `${days}d `;
    if (h) display += `${h}h `;
    if (m) display += `${m}m `;
    if (s) display += `${s}s `;
    display = display ? `${display} ago` : '';

    document.getElementById('last-updated').style.display = 'block';
    document.getElementById('last-updated').children[0].innerText = display;
  }
}

function updateTemp(temp, timestamp) {
  clearInterval(window.lastUpdatedInterval)
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  }

  const lastUpdated = new Date(timestamp * 1000);
  
  setDiff(lastUpdated)();
  window.lastUpdatedInterval = setInterval(setDiff(lastUpdated), 1000);
  
  document.getElementById('temperature').innerText = Math.floor(temp);
  document.getElementById('units').style.display = 'inline';
  document.getElementById('timestamp').innerText = lastUpdated.toLocaleString('en-US', options);
}

iotData.getThingShadow({ thingName: process.env.THING_NAME }, (err, data) => {
  const { state: { reported: { temp } }, metadata } = JSON.parse(data.payload);
  const { reported: { temp: { timestamp } } } = metadata;
  updateTemp(temp, timestamp);
});

const client = AWSIoTData.device({
   region: AWS.config.region, 
   host: process.env.ENDPOINT,
   clientId: 'temperature-control-browser-' + (Math.floor((Math.random() * 100000) + 1)),
   protocol: 'wss',
   maximumReconnectTimeMs: 8000,
   debug: true,
   accessKeyId: '',
   secretKey: '',
   sessionToken: ''
});

const cognitoIdentity = new AWS.CognitoIdentity();
AWS.config.credentials.get((err, data) => {
   if (!err) {
      const params = {
         IdentityId: AWS.config.credentials.identityId
      };
      cognitoIdentity.getCredentialsForIdentity(params, (err, data) => {
         if (!err) {
            client.updateWebSocketCredentials(data.Credentials.AccessKeyId,
               data.Credentials.SecretKey,
               data.Credentials.SessionToken);
         } else {
            console.log('error retrieving credentials: ' + err);
            alert('error retrieving credentials: ' + err);
         }
      });
   } else {
      console.log('error retrieving identity:' + err);
      alert('error retrieving identity: ' + err);
   }
});

client.on('connect', () => {
  client.subscribe(`$aws/things/${process.env.THING_NAME}/shadow/update/accepted`);
});

client.on('message', (_, payload) => {
  const { state: { reported: { temp } }, metadata } = JSON.parse(payload.toString());
  const { reported: { temp: { timestamp } } } = metadata;
  updateTemp(temp, timestamp);
})

