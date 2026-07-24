@echo off
if not exist public ( mkdir public )
if not exist public\images ( mkdir public\images )
copy "Aura img\*" public\images\
call npm install
