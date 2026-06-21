const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*const clientId = \wlr-web-\\\$\\{Math\.random\(\)\.toString\(16\)\.substring\(2, 8\)\\}\;\s*clientRef\.current = mqtt\.connect\(MQTT_BROKER, \{[^\}]+\}\);\s*clientRef\.current\.on\('connect', \(\) => \{ setConnectionStatus\('CONNECTED'\); clientRef\.current\?\.subscribe\(MQTT_TOPIC, \{ qos: 0 \}\); \}\);\s*clientRef\.current\.on\('reconnect', \(\) => setConnectionStatus\('CONNECTING'\)\);\s*clientRef\.current\.on\('error', \(\) => setConnectionStatus\('ERROR'\)\);\s*clientRef\.current\.on\('offline', \(\) => setConnectionStatus\('DISCONNECTED'\)\);\s*clientRef\.current\.on\('message', \(topic, message\) => \{\s*if \(topic !== MQTT_TOPIC\) return;/;

const newBlock = useEffect(() => {
    const storedBroker = localStorage.getItem('mqtt_broker') || MQTT_BROKER;
    const storedTopic = localStorage.getItem('mqtt_topic') || MQTT_TOPIC;
    const storedUser = localStorage.getItem('mqtt_user') || 'faisal';
    const storedPass = localStorage.getItem('mqtt_pass') || 'faisalwibu11';

    const clientId = \\\wlr-web-\\\\\\;
    clientRef.current = mqtt.connect(storedBroker, {
      clientId,
      username: storedUser,
      password: storedPass,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    clientRef.current.on('connect', () => { setConnectionStatus('CONNECTED'); clientRef.current?.subscribe(storedTopic, { qos: 0 }); });
    clientRef.current.on('reconnect', () => setConnectionStatus('CONNECTING'));
    clientRef.current.on('error', () => setConnectionStatus('ERROR'));
    clientRef.current.on('offline', () => setConnectionStatus('DISCONNECTED'));

    clientRef.current.on('message', (topic, message) => {
      if (topic !== storedTopic) return;;

content = content.replace(regex, newBlock);
fs.writeFileSync('app/page.tsx', content);
console.log("Replacement applied successfully if match found.");
