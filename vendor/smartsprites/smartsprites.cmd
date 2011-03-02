@echo off

rem
rem Add extra JVM options here
rem
set OPTS=-Xms64m -Xmx256m

rem
rem Build command line arguments
rem
set CMD_LINE_ARGS=%1
if ""%1""=="""" goto doneStart
shift
:setupArgs
if ""%1""=="""" goto doneStart
set CMD_LINE_ARGS=%CMD_LINE_ARGS% %1
shift
goto setupArgs
:doneStart

rem
rem Launch SmartSprites
rem
java %OPTS% -Djava.ext.dirs=lib org.carrot2.labs.smartsprites.SmartSprites %CMD_LINE_ARGS%
