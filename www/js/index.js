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
          var hrS = "23434100-1fe4-1eff-80cb-00ff78297d8b";//bluetoothLe.longify("180D")
          var hrC = "23434101-1fe4-1eff-80cb-00ff78297d8b";//bluetoothLe.longify("2A37")
          var desc = "00002902-0000-1000-8000-00805f9b34fb";
          if(device.services[hrS]&&device.services[hrS].indexOf(hrC)>-1){
            console.log("will try to read");
            bluetoothLe.write(device.address,[02, 00],hrS,hrC,desc,function(buff){
              var arr = new Uint8Array(buff, 0, buff.length); 
              console.log("write desc",device.address,arr);
              bluetoothLe.subscribe(device.address,hrS,hrC,function(buff){
              var arr = new Uint8Array(buff, 0, buff.length); 
              console.log("read char",device.address,arr);
              var lsb = arr[1].toString(16); 
              var msb = arr[2].toString(16);
              var parsed = {
                mUnits : arr[0] & 1 ? "lb" : "Kg",
                hasTimestamp : !!((arr[0]>>1) & 1),
                measurement :  parseInt(msb + (lsb.length > 1 ? lsb : "0"+lsb),16) / 10
              };
              console.log("parsed data", parsed);
            });
            });
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
