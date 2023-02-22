import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings/SettingType';
import { HTTPRequestSubCommandTemplate } from './commands/HTTPRequestSubCommandTemplate';

export class SlashSubHttpCommandApp extends App  {


    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend, environmentRead: IEnvironmentRead
      ): Promise<void> {

        await configuration.settings.provideSetting({
            id: 'slash_sub_http_command_main_name',
            type: SettingType.STRING,
            packageValue: 'rocketchat',
            required: true,
            public: false,
            multiline: false,
            i18nLabel: 'slash_sub_http_command_main_name',
            i18nDescription: 'slash_sub_http_command_main_name_desc',
        });

        await configuration.settings.provideSetting({
            id: 'slash_sub_http_command_configuration_json',
            type: SettingType.STRING,
            packageValue: '{"defaultHeaders":{"X-Auth-Token":"DDDmB7D4jt_5_wabxBSZR0tgl6InsZOABoAQJL5DWAf","X-User-Id":"6DW49CqcAvoByuYbX","Content-Type":"application/json"},"commands":[{"name":"login","url":"http://localhost:3000/api/v1/login","method":"POST","payload":{"user":"{0}","password":"{1}"},"format":"*userId*: `{data.userId}`\\n*authToken*: `{data.authToken}`"}]}',
            required: true,
            public: false,
            multiline: true,
            i18nLabel: 'slash_sub_http_command_configuration_json',
            i18nDescription: 'slash_sub_http_command_configuration_json_desc',
        });

        const slashCommandName = await environmentRead.getSettings().getValueById('slash_sub_http_command_main_name');
        let slashCommand=new HTTPRequestSubCommandTemplate();
        slashCommand.command=slashCommandName;
        configuration.slashCommands.provideSlashCommand(slashCommand);

      }

}
