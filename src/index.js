// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-2:9be042e1-c05c-4e19-ba44-a5a709bdac39',
});

const iotData = new AWS.IotData({
    endpoint: 'a25uftv5hqd3ve-ats.iot.us-east-2.amazonaws.com',
    region: 'us-east-2',
});

iotData.getThingShadow({ thingName: 'raven-pi-temp' }, (err, data) => {
  const { state: { reported: { temp } } } = JSON.parse(data.payload);
  document.getElementById('temperature').innerText = Math.floor(temp);
  document.getElementById('units').style.display = 'inline';
});
