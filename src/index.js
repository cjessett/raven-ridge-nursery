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
    if (s) display += `${s}s ago`

    document.getElementById('last-updated').style.display = 'block';
    document.getElementById('last-updated').children[0].innerText = display;
  }
}

iotData.getThingShadow({ thingName: 'RavenPi' }, (err, data) => {
  const { state: { reported: { temp } }, metadata } = JSON.parse(data.payload);
  const { reported: { temp: { timestamp } } } = metadata;
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
  setInterval(setDiff(lastUpdated), 1000);
  
  document.getElementById('temperature').innerText = Math.floor(temp);
  document.getElementById('units').style.display = 'inline';
  document.getElementById('timestamp').innerText = lastUpdated.toLocaleString('en-US', options);
});
