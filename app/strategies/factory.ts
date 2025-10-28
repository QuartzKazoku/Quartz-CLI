//cli/strategies/factory.ts
import { PlatformConfig } from "@/types/config";
import { PlatformStrategy } from "./platform";
import { GitHubStrategy } from "./github";
import { GitLabStrategy } from "./gitlab";

/**
 * Platform strategy factory class for creating different platform strategy instances based on configuration
 */
export class PlatformStrategyFactory {
    /**
     * Create platform strategy instance based on configuration
     * @param config Platform configuration information, including platform type and other related configurations
     * @returns Strategy instance for the corresponding platform
     * @throws Error when platform type is not supported
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
     * Detect platform type based on remote URL
     * @param remoteUrl Remote repository URL
     * @returns Detected platform type, returns null if cannot be identified
     */
    static detectPlatformFromUrl(remoteUrl: string): 'github' | 'gitlab' | null {
        if (remoteUrl.includes('github.com')) {
            return 'github';
        }
        if (remoteUrl.includes('gitlab.com')) {
            return 'gitlab';
        }
        return null;
    }
}
