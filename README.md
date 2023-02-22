# slashcommand
This extension app adds slash sub commands that allow to make HTTP (GET and POST) preconfigured calls with placeholders for the arguments of the slash command for the URL, payload and headers. To call the slash command use <pre><code>/<name_of_command_configured> <subcommand_name_configured> <arguments_placeholders></pre></code>

The placeholders for the arguments are of the format {0}, {1}... 

In general the slash commands will post the response of the HTTP call unless a format string is specified for the command.

The App has one setting "Configuration JSON" that receives a json for configuration of the sub commands. 

The App also has one setting "Slash Command Name" for the main name of the slash command.

*Note*: 
- If you change the main command name on the configuration you will need to upload the app again (without uninstalling the existing one) for the changes to take effect. So with the first upload of the app the default name <pre><code>/rocketchat</pre></code> will be the one used.
- Subcommands can be changed any time just like the default headers.
- Currently there is a bug in Rocket.Chat that forces the presentation of the setting as single text cell inputbox even if configured for being multiline. Once this is sorted you should see the configuration setting of the App as a multiline textbox.)

Each subcommand is configured by specifying the following:
- *name*: The name to be used to call the subcommand
- *url*: The URL to be executed by the command. It can contain placeholders for the arguments.
- *method*: The HTTP method to be used for calling the URL before. At the moment only GET and POST are supported
- *post*: (default: true) If set to false the message with the response of the HTTP call is sent only to the user as a notification on the channel.
- *payload*: Only applicable to POST calls. It can contain also placeholders for the arguments.
- *headers*: For the headers of the HTTP call. It can contain also placeholders for the arguments.
- *format*: In case it is specified the message to be posted is based on it. It will in general contain placeholders for values in the JSON of the response from the HTTP call.

It also has the option of calling the help for the slash command:

<pre><code>/&lt;name of main command&gt; &lt;name of subcommand&gt; help</pre></code>

The configuration for the subcommand is presented. Details as the header, payload and format if configured the commands are not listed.

The default value for "Configuration JSON" is the following (as you can see you can add generic headers for all calls, if you don't need just keep that piece empty):

<pre><code>{
  "defaultHeaders": {
    "X-Auth-Token": "DDDmB7D4jt_5_wabxBSZR0tgl6InsZOABoAQJL5DWAf",
    "X-User-Id": "6DW49CqcAvoByuYbX",
    "Content-Type": "application/json"
  },
  "commands": [{
      "name": "login",
      "url": "http://localhost:3000/api/v1/login",
      "method": "POST",
      "payload": {
        "user": "{0}",
        "password": "{1}"
      },
      "format": "*userId*: `{data.userId}`\\n*authToken*: `{data.authToken}`"
    }
  ]
}</pre></code>

With this default configuration you should be able to do the following calls:

## /rocketchat login demo demo

It assumes you have a local rocketchat executing on port 3000 with an account with username demo and password demo and since it has a format string defined you would get as response something like this (it's true that since you are already logged in cause of the headers it doesnt make completely sense but its an example):

*userId*: 6DW49CqcAvoByuYbX

*authToken*: DDDmB7D4jt_5_wabxBSZR0tgl6InsZOABoAQJL5DWAf
