/**
 * 配置文件迁移注册中心
 *
 * 此文件用于注册所有配置文件迁移函数。当配置文件结构发生变化时，
 * 需要在此处注册相应版本的迁移函数，以确保用户的配置能够自动升级。
 *
 * 使用步骤：
 * 1. 在 utils/migrations/ 目录下创建新的迁移文件（参考 template.example.ts）
 * 2. 文件命名使用目标版本号，例如：1.2.0.ts、2.0.0.ts
 * 3. 实现迁移逻辑
 * 4. 在下方导入并注册迁移函数
 *
 * 示例：
 * ```typescript
 * import { migrate as migrate120 } from './1.2.0'
 * import { migrate as migrate150 } from './1.5.0'
 *
 * registerMigration('1.2.0', migrate120)
 * registerMigration('1.5.0', migrate150)
 * ```
 *
 * 注意事项：
 * - 版本号必须遵循语义化版本规范（Semver）
 * - 迁移函数会按版本号顺序自动执行
 * - 确保迁移函数是幂等的（多次执行结果相同）
 * - 迁移失败会阻止命令执行，请务必测试迁移逻辑
 */

// import {registerMigration} from '@/utils/migration'


// ============================================================
// 在此处导入并注册迁移函数
// ============================================================

// 示例（取消注释并替换为实际的迁移文件）：

// import {migration_template_example} from "@/utils/migrations/template.example";
// registerMigration(migration_template_example)

// ============================================================
// 当前无需迁移（配置文件版本：0.1.1）
// ============================================================
