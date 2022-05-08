# WebFace2.0
The source code for my private web interface I use for my Raspberry Pi. This is an attempt to rewrite that interface using more modern JavaScript standards and UI principles. 

## Proxy module:
> /src/server.ts

This module is still missing some features, but is non the less mostly complete.

This module will handle handles redirects to various internal servers based on the host field provided by the browser which is attempting to connect. This is done internally by using node's native http components. 

To access the web interface to configure this module. Please click the button labeled "proxy". 

The incoming field renders the host value that needs to be contained in an http request. The port field renders the internal port that a set request will be redirected to. The hide property will determine if the website should be shown on the 404 page that is rendered when a host attempts to connect with an address that is not recognised. 

The first record is an input form that can be used to add proxy endpoints. 

## Task module:
This module is currently incomplete.

## Scripts module:
The module is currently incomplete.

## Configuration file
This module is yet to be implemented. 
