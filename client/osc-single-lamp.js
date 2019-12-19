/*
Lad os prøve at lave et program som modtager to variable til at styre lysstyrke og temperatur med osc variablene lys og varme

BEMÆRK for at et javascript kan modtage OSC skal det køre filen bridge.js med node. Find din terminal og find mappen som projektet ligger i. Her ligger der en fil ved navn bridge.js 

Skriv denne kommando i terminalen:

node bridge.js
*/
var lys = 0;

// Bridge ip-adresse. Find den fx i hue app'en
var url = '192.168.0.102';
// Fælles brugernavn
var username = 'hdycYCstsRmeDMkO2PKuVI9y0cypqVcvgHf0QEQq';
//Slidere
var dimmer;
var farve = (osc_address*63000)
//Den pære du vil kontrollere
var lightNumber = 17;
//Den osc besked du vil modtage
var osc_address = "/wek/outputs";


function setup() {
    createCanvas(500, 500);
    setupOsc(12000, 6448); //Begynd at lytte efter OSC

    oscDiv = createDiv('OSC response'); // a div for the Hue hub's responses
    oscDiv.position(10, 140); // position it

    resultDiv = createDiv('Hub response'); // a div for the Hue hub's responses
    resultDiv.position(10, 200); // position it

    dimmer = createSlider(1, 254, 127) // createslider(min, max, default,step)
    dimmer.position(10, 10); // position it
    dimmer.mouseReleased(changeBrightness); // mouseReleased callback function

    farve = createSlider(0, 65535, 250) // a slider to dim one light
    farve.position(10, 40); // position it
    farve.mouseReleased(changefarve); // mouseReleased callback function

    text("Lysstyrke", dimmer.x * 2 + dimmer.width, 14);
    text("farve", farve.x * 2 + farve.width, 44);
    textSize(144);
    text(lightNumber, 300, 100);
    connect(); // connect to Hue hub; it will show all light states
}

/*
this function makes the HTTP GET call to get the light data:
HTTP GET http://your.hue.hub.address/api/username/lights/
*/
function connect() {
    url = "http://" + url + '/api/' + username + '/lights/';
    httpDo(url, 'GET', getLights);
}

/*
this function uses the response from the hub
to create a new div for the UI elements
*/
function getLights(result) {
    resultDiv.html("<hr/>" + result);
}

function changeBrightness() {
    var brightness = this.value(); // get the value of this slider
    var lightState = { // make a JSON object with it
        bri: brightness,
        on: true
    }
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}

function changefarve() {
    var lightState = { // make a JSON object with it
        hue: farve,
        sat: 254,
        on: true,
    }
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}
/*
function SkiftFarve() {
        farve = (osc_address*63000)

}
*/
function oscChangeBrightness(lys){
    var lightState = { // make a JSON object with it
        bri: lys,
        on: true
    }
    dimmer.value(lys);
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);    
}

function oscChangeFarve(farve){
    var lightState = { // make a JSON object with it
        hue: farve,
        sat:254,
        on: true,
    }
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);    
}

/*
this function makes an HTTP PUT call to change the properties of the lights:
HTTP PUT http://your.hue.hub.address/api/username/lights/lightNumber/state/
and the body has the light state:
{
  on: true/false,
  bri: brightness
}
*/
function setLight(whichLight, data) {
    var path = url + whichLight + '/state/';

    var content = JSON.stringify(data); // convert JSON obj to string
    httpDo(path, 'PUT', content, 'text', getLights); //HTTP PUT the change
}


/*
Nedenstående er OSC funktioner. 
*/


function receiveOsc(address, value) {
    if (address == osc_address) {
        farve = value[0];
    }
  //  lys = parseInt(map(lys, 0, 500, 1, 254));
    farve = parseInt(map(farve, 0, 1, 0, 65000));
    //oscDiv.html("OSC Lys: " + lys + " farve: " + farve + "<hr/>");
    
    if(frameCount%30==0){
        //oscChangeBrightness(lys);
        oscChangeFarve(farve);
    }
    //console.log("Received osc : " + address + " " + value);
}

function sendOsc(address, value) {
    socket.emit('message', [address].concat(value));
}

function setupOsc(oscPortIn, oscPortOut) {
    var socket = io.connect('http://127.0.0.1:8082', {
        port: 8082,
        rememberTransport: false
    });
    socket.on('connect', function () {
        socket.emit('config', {
            server: {
                port: oscPortIn,
                host: '127.0.0.1'
            },
            client: {
                port: oscPortOut,
                host: '127.0.0.1'
            }
        });
    });
    socket.on('message', function (msg) {
        console.log(msg);
        if (msg[0] == '#bundle') {
            for (var i = 2; i < msg.length; i++) {
                receiveOsc(msg[i][0], msg[i].splice(1));
            }
        } else {
            receiveOsc(msg[0], msg.splice(1));
        }
    });
}
