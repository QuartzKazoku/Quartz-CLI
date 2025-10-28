//cli/strategies/factory.ts
import {PlatformConfig} from "../types/config.ts";
import {PlatformStrategy} from "./platform.ts";
import {GitHubStrategy} from "./github.ts";
import {GitLabStrategy} from "./gitlab.ts";

/**
 * 平台策略工厂类，用于根据配置创建不同的平台策略实例
 */
export class PlatformStrategyFactory {
    /**
     * 根据配置创建平台策略实例
     * @param config 平台配置信息，包含平台类型和其他相关配置
     * @returns 对应平台的策略实例
     * @throws 当平台类型不支持时抛出错误
     */
    static create(config: PlatformConfig): PlatformStrategy {
        switch (config.type) {
            case 'github':
                return new GitHubStrategy(config);
            case 'gitlab':
                return new GitLabStrategy(config);
            default:
                throw new Error(`Unsupported platform type: ${(config as any).type}`);
        }
    }

    /**
     * 根据远程URL检测平台类型
     * @param remoteUrl 远程仓库URL
     * @returns 检测到的平台类型，如果无法识别则返回null
     */
    static detectPlatformFromUrl(remoteUrl: string): 'github' | 'gitlab' | null {
        if (remoteUrl.includes('github.com')) {
            return 'github';
        }
        if (remoteUrl.includes('gitlab.ts')) {
            return 'gitlab';
        }
        return null;
    }
}
