import fs from 'node:fs';
import path from 'node:path';
import {PlatformConfig, QuartzConfig} from '../types/config';

/**
 * 获取 quartz.json 文件路径
 */
function getQuartzPath(): string {
    return path.join(process.cwd(), 'quartz.json');
}

/**
 * 读取配置文件
 */
export function readQuartzConfig(): QuartzConfig {
    const quartzPath = getQuartzPath();

    // 默认配置
    const defaultConfig: QuartzConfig = {
        openai: {
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4-turbo-preview',
        },
        platforms: [],
        language: {
            ui: 'en',
            prompt: 'en',
        },
    };

    if (!fs.existsSync(quartzPath)) {
        return defaultConfig;
    }

    try {
        const content = fs.readFileSync(quartzPath, 'utf-8');
        const data = JSON.parse(content);

        if (data.default?.config) {
            return data.default.config;
        }

        return defaultConfig;
    } catch (error) {
        console.error('Failed to parse quartz.json:', error);
        return defaultConfig;
    }
}

/**
 * 写入配置文件
 */
export function writeQuartzConfig(config: QuartzConfig, profileName: string = 'default'): void {
    const quartzPath = getQuartzPath();
    let data: any = {};

    // 读取现有数据
    if (fs.existsSync(quartzPath)) {
        try {
            const content = fs.readFileSync(quartzPath, 'utf-8');
            data = JSON.parse(content);
        } catch (error) {
            console.warn('Failed to read existing config, creating new one:', error);
            data = {};
        }
    }

    // 更新指定profile
    data[profileName] = {
        name: profileName,
        config,
    };

    fs.writeFileSync(quartzPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 加载配置（对外接口，保持兼容性）
 */
export function loadConfig(): QuartzConfig {
    return readQuartzConfig();
}

/**
 * 获取平台配置列表
 */
export function getPlatformConfigs(): PlatformConfig[] {
    const config = readQuartzConfig();
    return config.platforms;
}

/**
 * 根据平台类型获取配置
 */
export function getPlatformConfig(type: 'github' | 'gitlab'): PlatformConfig | undefined {
    const config = readQuartzConfig();
    return config.platforms.find(p => p.type === type);
}

/**
 * 添加或更新平台配置
 */
export function upsertPlatformConfig(platformConfig: PlatformConfig): void {
    const config = readQuartzConfig();
    const existingIndex = config.platforms.findIndex(p => p.type === platformConfig.type && p.url === platformConfig.url);

    if (existingIndex >= 0) {
        config.platforms[existingIndex] = platformConfig;
    } else {
        config.platforms.push(platformConfig);
    }

    writeQuartzConfig(config);
}

/**
 * 删除平台配置
 */
export function removePlatformConfig(type: 'github' | 'gitlab', url?: string): void {
    const config = readQuartzConfig();
    config.platforms = config.platforms.filter(p => {
        if (p.type !== type) return true;
        return !!(url && p.url !== url);
    });
    writeQuartzConfig(config);
}