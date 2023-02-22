import {
    IHttp,
    IHttpResponse,
    IModify,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    ISlashCommand,
    SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';

export class HTTPRequestSubCommandTemplate implements ISlashCommand {
    public command = 'rocketchat';
    public i18nParamsExample = 'slash_sub_http_command_configuration_param';
    public i18nDescription = 'slash_sub_http_command_configuration_description';
    public providesPreview = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
        const jsonConfString = await read.getEnvironmentReader().getSettings().getValueById('slash_sub_http_command_configuration_json');
        let jsonConf = JSON.parse(jsonConfString);
        const urlParams = context.getArguments();

        if (!urlParams || urlParams.length == 0) {
            return await this.notifyMessage(context, modify, 'Error! You need to specify a subcommand.');
        }

        let subcommandName = urlParams[0];

        let itemJsonConf = jsonConf.commands.find(i => i.name === subcommandName);

        if (!itemJsonConf) {
            return await this.notifyMessage(context, modify, 'Error! Could not find in configuration a subcommand with this name ' + subcommandName);
        }

        if (urlParams.length != 1 && urlParams[1].toUpperCase() === 'HELP') {
            return this.sendHelp(context, modify, itemJsonConf);
        }

        let url = itemJsonConf.url;

        if (!url) {
            return await this.notifyMessage(context, modify, 'Error! Configuration for the subcommand missing URL!');
        }

        url = this.replacePlaceholders(url, urlParams);

        let httpMethod = itemJsonConf.method;
        let response: IHttpResponse;
        let headers = mergeHeaders(itemJsonConf.headers, jsonConf.defaultHeaders);

        if (!httpMethod || httpMethod.toUpperCase() === "GET") {
            let headersValue = this.replacePlaceholders(JSON.stringify(headers), urlParams)
            response = await http.get(url, {
                headers: JSON.parse(headersValue)
            })
        } else if (httpMethod === "POST") {
            let payload = itemJsonConf.payload;
            if (!payload) {
                return await this.notifyMessage(context, modify, 'Error! No payload for POST subcommand defined');
            }
            let payloadValue = this.replacePlaceholders(JSON.stringify(payload), urlParams);

            let headersValue = this.replacePlaceholders(JSON.stringify(headers), urlParams)
            response = await http.post(url, {
                content: payloadValue,
                headers: JSON.parse(headersValue)
            })


        } else {
            return await this.notifyMessage(context, modify, 'Error! The subcommand HTTP method ' + httpMethod + ' is not implemented');
        }

        if (response.statusCode != 200) {
            return await this.notifyMessage(context, modify, '*Error calling HTTP:*\n```\n' + response.content + "\n```");
        }

        let formatValue = itemJsonConf.format;
        let message = response.data;
        let maxAllowedString = await read.getEnvironmentReader().getServerSettings().getValueById('Message_MaxAllowedSize');
        let maxAllowed = parseInt(maxAllowedString);
        let messageTruncated = "(the message has been truncated considering size)\n";

        if (!formatValue) {
            if (this.IsObject(message)) {
                message = "```\n" + JSON.stringify(message, null, 2) + "\n```";
            } else {
                message = "```\n" + response.content + "\n```";
            }
        } else {
            if (this.IsObject(message)) {
                message = this.format(message, formatValue)
            } else {
                let headerLine = '*Response is not a JSON and cant be formatted:*\n```\n';
                let bottomLine = "\n```";
                if (message.length + headerLine.length + bottomLine.length + messageTruncated.length > maxAllowed) {
                    message = messageTruncated + message.substring(0, maxAllowed - headerLine.length - bottomLine.length - messageTruncated.length);
                }
                return await this.notifyMessage(context, modify, headerLine + response.content + headerLine);
            }
        }

        if (message.length + messageTruncated.length > maxAllowed) {
            message = messageTruncated + message.substring(0, maxAllowed - messageTruncated.length);
        }

        let postValue = itemJsonConf.post;

        if (!postValue || postValue.toUpperCase() === 'TRUE') {
            await this.sendMessage(context, modify, message);
        } else {
            await this.notifyMessage(context, modify, message);
        }

    }

    private IsObject(value) {
        return (
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null
        );
    }

    private format(obj: any, formatValue: string) {
        let pos = formatValue.indexOf("{");
        while (pos != -1) {
            let firstPart = formatValue.substring(0, pos);
            let secondPart = formatValue.substring(pos + 1);
            let secondPos = secondPart.indexOf("}");
            let path = secondPart.substring(0, secondPos);
            secondPart = secondPart.substring(secondPos + 1);
            let value = this.getValue(obj, path);
            formatValue = firstPart + value + secondPart;
            pos = formatValue.indexOf("{");
        }
        return formatValue;
    }

    private getValue(obj: any, path: string) {
        var paths = path.split('.')
            , current = obj
            , i;

        for (i = 0; i < paths.length; ++i) {
            if (current[paths[i]] == undefined) {
                return undefined;
            } else {
                current = current[paths[i]];
            }
        }
        return current;
    }

    private replacePlaceholders(value: string, params) {
        let i = 0;

        while (params.length > i + 1) {
            value = value.replace("\{" + i + "\}", params[i + 1]);
            i++;
        }
        return value;
    }

    private async notifyMessage(context: SlashCommandContext, modify: IModify, message: string): Promise<void> {
        const notifier = modify.getNotifier();
        const messageBuilder = notifier.getMessageBuilder();
        const room = context.getRoom();
        messageBuilder.setText(message);
        messageBuilder.setRoom(room);
        await notifier.notifyUser(context.getSender(), messageBuilder.getMessage());
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, message: string): Promise<void> {
        const messageStructure = modify.getCreator().startMessage();
        const sender = context.getSender();
        const room = context.getRoom();

        messageStructure
            .setSender(sender)
            .setRoom(room)
            .setText(message);

        await modify.getCreator().finish(messageStructure);
    }

    private async sendHelp(context: SlashCommandContext, modify: IModify, jsonConf: any): Promise<void> {
        delete jsonConf.payload;
        delete jsonConf.headers;
        delete jsonConf.format;

        let message = "Configured subcommand (payload, headers and format instructions hidden):\n```\n" + JSON.stringify(jsonConf, null, 2) + "\n```";
        await this.notifyMessage(context, modify, message);
    }
}
function mergeHeaders(headers: any, defaultHeaders: any) {
    if (!headers && !defaultHeaders)
        return {};
    if (!headers)
        return defaultHeaders;
    if (!defaultHeaders)
        return headers;
    return {
        headers,
        defaultHeaders
    };
}

