@echo off
set OPENSSL_CONF=C:\opensll\openssl.cnf

rem if not exist .\conf\ssl.crt mkdir .\conf\ssl.crt
rem if not exist .\conf\ssl.key mkdir .\conf\ssl.key

C:\opensll\bin\openssl.exe req -new -out server.csr
C:\opensll\bin\openssl.exe rsa -in privkey.pem -out server.key
C:\opensll\bin\openssl.exe req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
C:\opensll\bin\openssl.exe rsa -in key.pem -out newkey.pem 
move newkey.pem key.pem

set OPENSSL_CONF=
del .rnd
del privkey.pem
del server.csr

::move /y server.csr c:\xampp\apache\conf\ssl.csr
::move /y server.crt c:\xampp\apache\conf\ssl.crt
::move /y server.key c:\xampp\apache\conf\ssl.key

echo.
echo The certificate was provided.
echo.
pause