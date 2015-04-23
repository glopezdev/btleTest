/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var devices = [{
  name: "NONIN",
  srv : "46a970e0-0d5f-11e2-8b5e-0002a5d5c51b",
  chr : "0aad7ea0-0d60-11e2-8e3c-0002a5d5c51b",
  dsc : "1447af80-0d60-11e2-88b6-0002a5d5c51b",
  parse : function(arr) {
    console.log("parse arr length "+arr.length+" =?= " +arr[0]);
    return {
      satus : {
        raw : arr[1],
        displaySync : (arr[1] & 1) > 0,
        weakSignal : (arr[1] & 2) > 0,
        smartPoint : (arr[1] & 4) > 0,
        searching : (arr[1] & 8) > 0,
        correctCheck : (arr[1] &  16) > 0,
        lowBattery : (arr[1] & 32) > 0,
        encryption : (arr[1] & 64) > 0
      },
      battery : (arr[2]*0.1),
      pAmp : ((arr[3]<<8) + arr[4])/100,
      counter : (arr[5]<<8) + arr[6],
      sp02 : arr[7] === 127 ? "missing sp02 data": arr[7],
      pulse : (((arr[8]<<8) + arr[9]) === 511)? "missing pulse data" : ((arr[8]<<8) + arr[9])
    }
  }, 
  read : function(device) {
    var s = devices[0].srv;
    var c = devices[0].chr;
    var d = devices[0].dsc;
    if(device.services[s]&&device.services[s].indexOf(c)>-1) {
      console.log("will try to write nonin desc");
      bluetoothLe.write(device.address,[0x61,0x05],s,d,function(buff){
        var arr = new Uint8Array(buff, 0, buff.length); 
        console.log("write desc",device.address,arr);
        console.log("will try to read nonin measurement");
        bluetoothLe.subscribe(device.address,s,c,function(buff){
          var arr = new Uint8Array(buff, 0, buff.length); 
          console.log("parsed data", devices[0].parse(arr));
          bluetoothLe.unsubscribe(device.address,s,c,function(buff){
            console.log("unsuscribed ", new Uint8Array(buff, 0, buff.length));
            bluetoothLe.write(device.address,[0x62, 0x4E, 0x4D, 0x49],s,d,function(buff){
              var arr = new Uint8Array(buff, 0, buff.length); 
              console.log("complete procedure", arr);
            });
          });
        });
      });
    }
  }
}, 
{
  name: "Weight Scale",
  srv : "23434100-1fe4-1eff-80cb-00ff78297d8b",
  chr : "23434101-1fe4-1eff-80cb-00ff78297d8b",
  dsc : "00002902-0000-1000-8000-00805f9b34fb",
  timeS : "233bf000-5a34-1b6d-975c-000d5690abe4",
  timeC : "233bf001-5a34-1b6d-975c-000d5690abe4",
  parse : function(arr) {
    console.log("parse arr length "+arr.length);
    var lsb = arr[1].toString(16); 
    var msb = arr[2].toString(16);
    var hasTimestamp = !!((arr[0]>>1) & 1);
    var dateM = null;
    if (hasTimestamp) {
      var year = (arr[3]+(arr[4]<<8));
      var month = arr[5];
      var day = arr[6];
      var hours = arr[7];
      var minutes = arr[8];
      var seconds = arr[9];
      dateM = new Date(year,month,day,hours,minutes,seconds);
    }

    return {
      mUnits : arr[0] & 1 ? "lb" : "Kg",
      dateMeasured : dateM,
      measurement :  (arr[1]+(arr[2]<<8)) / 10 
    };
  },
  read : function(device) {
    var s = devices[1].srv;
    var c = devices[1].chr;
    var d = devices[1].dsc;
    if(device.services[s]&&device.services[s].indexOf(c)>-1) {
      console.log("will try to write weight desc");
      bluetoothLe.write(device.address,[0x02, 0x00],s,c,d,function(buff){
        console.log("will try to read weight measurement");
        bluetoothLe.subscribe(device.address,s,c,function(buff){
          var arr = new Uint8Array(buff, 0, buff.length); 
          console.log("parsed data", devices[1].parse(arr));
          
          var timeConf = [];
          var date = new Date();
          timeConf[0] = 9; //length (-1)
          timeConf[1] = 1; //write
          timeConf[2] = 1; //CMD
          timeConf[3] = date.getFullYear()-2000;
          timeConf[4] = date.getMonth();
          timeConf[5] = date.getDate();
          timeConf[6] = date.getHours();
          timeConf[7] = date.getMinutes();
          timeConf[8] = date.getSeconds();
          console.log("now it is ",date);
          console.log("will try to update date", timeConf);

          bluetoothLe.write(device.address,timeConf,devices[1].timeS,devices[1].timeC,function(buff){
            var arr = new Uint8Array(buff, 0, buff.length); 
            console.log("wrote time", arr);
            bluetoothLe.write(device.address,[0x02,0x00,0x04],devices[1].timeS,devices[1].timeC,function(buff){
              var arr = new Uint8Array(buff, 0, buff.length); 
              console.log("read time", arr);
            });
          });
        });
      });
    }
  }
}];

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        bluetoothLe.registerForBootStart( function () {
          console.log("btService registered for bootStart");
        }, function (err) {
          console.error("btService couldn't register for bootStart " + err);
        });

        bluetoothLe.onFound(function(device){
          console.log("bluetoothLe.onFound", device.address,arguments)
          bluetoothLe.list("GREYLIST",device.address);
        });

        bluetoothLe.onConnected(function(device){
          console.log("bluetoothLe.onConnected",device.address,arguments);
          for( dev in devices) {
            devices[dev].read(device);
          }
        });
        bluetoothLe.startService(function (success) {
          console.log("started bluetooth background service");
        }, function (error) {
          console.error("failed to start bluetooth background service " + error);
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};
