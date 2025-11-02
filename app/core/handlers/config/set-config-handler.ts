//app/core/handlers/config/set-config-handler.ts

import {BaseHandler, ConfigUtils} from '@/app/core/handlers';
import {getConfigManager} from "@/manager/config";
import {CONFIG_KEYS, DEFAULT_VALUES} from "@/constants/config";
import {PLATFORM_TYPES} from "@/constants/platform";

/**
 * Set configuration command handler
 * Handles setting configuration values
 */
export class SetConfigHandler extends BaseHandler{
    /**
     * Execute set config command
     */
    async execute(): Promise<void> {
        const isGlobal = this.getParameter('global', false);
        const args = this.getArgs();
        
        this.validateRequiredArgs(2, this.t('config.errors.setUsage'));
        
        const key = args[0];
        const value = args[1];
        
        this.setConfigValue(key, value, isGlobal);
    }

    /**
     * Set configuration value for specified key
     */
    setConfigValue(key: string, value: string, isGlobal: boolean = false): void {
        const manager = getConfigManager();
        
        // 根据global参数决定读取哪个配置
        let config;
        if (isGlobal) {
            // 读取全局配置
            config = manager.readConfig(undefined, false); // 不应用运行时覆盖
        } else {
            // 读取当前配置
            config = manager.readConfig();
        }

        switch (key) {
            case CONFIG_KEYS.OPENAI_API_KEY:
                config.openai.apiKey = value;
                break;
            case CONFIG_KEYS.OPENAI_BASE_URL:
                config.openai.baseUrl = value;
                break;
            case CONFIG_KEYS.OPENAI_MODEL:
                config.openai.model = value;
                break;
            case CONFIG_KEYS.QUARTZ_LANG:
                config.language.ui = value;
                break;
            case CONFIG_KEYS.PROMPT_LANG:
                config.language.prompt = value;
                break;
            case CONFIG_KEYS.GITHUB_TOKEN:
                manager.upsertPlatformConfig({type: PLATFORM_TYPES.GITHUB, token: value}, isGlobal ? undefined : manager.getActiveProfile());
                this.logger.log(this.t('config.set', {key, value: '***'}));
                this.logger.success(this.t('config.updated'));
                return;
            case CONFIG_KEYS.GITLAB_TOKEN: {
                const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
                manager.upsertPlatformConfig({
                    type: PLATFORM_TYPES.GITLAB,
                    token: value,
                    url: existingGitlab?.url || DEFAULT_VALUES.GITLAB_URL
                }, isGlobal ? undefined : manager.getActiveProfile());
                this.logger.log(this.t('config.set', {key, value: '***'}));
                this.logger.success(this.t('config.updated'));
                return;
            }
            case CONFIG_KEYS.GITLAB_URL: {
                const existingGitlab = config.platforms.find(p => p.type === PLATFORM_TYPES.GITLAB);
                if (existingGitlab) {
                    manager.upsertPlatformConfig({...existingGitlab, url: value}, isGlobal ? undefined : manager.getActiveProfile());
                } else {
                    this.logger.error(this.t('config.gitlabTokenSetFirst'));
                    return;
                }
                this.logger.log(this.t('config.set', {key, value}));
                this.logger.success(this.t('config.updated'));
                return;
            }
            case CONFIG_KEYS.GIT_PLATFORM:
                this.logger.warn(this.t('config.gitPlatformDeprecated'));
                return;
            default:
                this.logger.error(this.t('config.unknownKey', {key}));
                return;
        }

        // 写入配置到对应的profile
        manager.writeConfig(config, isGlobal ? undefined : manager.getActiveProfile(), isGlobal);
        this.logger.log(this.t('config.set', {key, value: ConfigUtils.isSensitiveKey(key) ? '***' : value}));
        this.logger.success(this.t('config.updated'));
    }
}