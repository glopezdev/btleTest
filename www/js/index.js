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
          console.log("bluetoothLe.onFound", arguments)
          bluetoothLe.list("GREYLIST",device.address);
        });

        bluetoothLe.onConnected(function(device){
          console.log("bluetoothLe.onConnected",arguments);
          var hrS = bluetoothLe.longify("180D")
          var hrC = bluetoothLe.longify("2A37")
          if(device.services[hrS]&&device.services[hrS].indexOf(hrC)>-1){
            bluetoothLe.subscribe(device.address,hrS,hrC,function(buff){
              var arr = new Uint8Array(buff, 0, buff.length); 
              console.log("subscribe",arr);
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
