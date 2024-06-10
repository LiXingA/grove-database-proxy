@echo off
chcp 65001
mode con: cols=150 lines=2500
setlocal enabledelayedexpansion 
set str=
for /f "delims=" %%i in ('dir /b lib') do ( 
set str=!str!lib/%%i;
)
java -Dfile.encoding=UTF-8 -Xms32m -Xmx128m -Xmn32m -DsystemRoot=./ -cp target/classes/;%str% StartServer ./target/server
pause
exit
