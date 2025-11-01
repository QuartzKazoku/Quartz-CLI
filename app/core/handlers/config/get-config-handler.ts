//app/core/handlers/config/get-config-handler.ts

import {BaseHandler} from '../base/base-handler';
import type {IConfigHandler} from '../base/config-handler-interface';
import {ConfigUtils} from '../base/config-utils';
import {getConfigManager} from "@/manager/config";
import {ExecutionContext} from "@/app/core/models";

/**
 * Get configuration command handler
 * Handles retrieving configuration values
 */
export class GetConfigHandler extends BaseHandler implements IConfigHandler {
    /**
     * Execute get config command
     */
    async execute(): Promise<void> {
        const isGlobal = this.getParameter('global', false);
        const args = this.getArgs();
        
        this.validateRequiredArgs(1, this.t('config.errors.getUsage'));
        
        const key = args[0];
        this.getConfigValue(key, isGlobal);
    }

    /**
     * Get configuration value for specified key
     */
    getConfigValue(key: string, isGlobal: boolean = false): void {
        const manager = getConfigManager();
        
        // 根据global参数决定读取哪个配置
        let config;
        if (isGlobal) {
            // 只读取全局配置
            config = manager.readConfig(undefined, false); // 不应用运行时覆盖
        } else {
            // 读取完整配置（包含优先级处理：环境变量 > 项目配置 > 全局配置 > 默认值）
            config = manager.readConfig();
        }
        
        const value = ConfigUtils.getConfigDisplayValue(config, key);

        if (value) {
            const displayValue = ConfigUtils.isSensitiveKey(key) 
                ? ConfigUtils.formatSensitiveValue(value) 
                : value;
            this.logger.log(`${key}=${displayValue}`);
        } else {
            this.logger.log(this.t('config.notSet', {key}));
        }
    }

    /**
     * Set configuration value (not implemented for get handler)
     */
    setConfigValue(key: string, value: string, isGlobal?: boolean): void {
        throw new Error('Set operation not supported by GetConfigHandler');
    }

    /**
     * Show all configuration (not implemented for get handler)
     */
    showAllConfig(isGlobal?: boolean): void {
        throw new Error('Show all operation not supported by GetConfigHandler');
    }

    /**
     * Show profile configuration (not implemented for get handler)
     */
    showProfileConfig(isGlobal?: boolean): void {
        throw new Error('Show profile operation not supported by GetConfigHandler');
    }
}