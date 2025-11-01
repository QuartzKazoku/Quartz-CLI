//app/core/commands/create.ts
import {CommandDefinition} from "@/app/core/interfaces";
import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandHandler} from "@/app/core";
import {HandlerFactory} from "@/app/core/factories/handler-factory";

/**
 * Create profile command handler - creates a new configuration profile
 */
const createProfileHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.CREATE, CommandObject.PROFILE, context);
    await handler.execute();
};

/**
 * Create branch command handler - creates a new branch
 */
const createBranchHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.CREATE, CommandObject.BRANCH, context);
    await handler.execute();
};

/**
 * Create changelog command handler - generates a changelog
 */
const createChangelogHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.CREATE, CommandObject.CHANGELOG, context);
    await handler.execute();
};

/**
 * Create review command handler - performs AI code review (interactive)
 */
const createReviewHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.CREATE, CommandObject.REVIEW, context);
    await handler.execute();
};

/**
 * Create commit command handler - automatically generates commit messages
 */
const createCommitHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.CREATE, CommandObject.COMMIT, context);
    await handler.execute();
};

/**
 * Create PR command handler - creates a Pull Request
 */
const createPrHandler: CommandHandler = async (context) => {
    const handler = HandlerFactory.createHandler(CommandVerb.CREATE, CommandObject.PR, context);
    await handler.execute();
};

/**
 * Export create command definitions
 */
export const CREATE_COMMANDS: CommandDefinition[] = [
    {
        verb: CommandVerb.CREATE,
        object: CommandObject.PROFILE,
        description: 'Create a new configuration profile',
        parameters: [
            {
                name: 'global',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Create in global profiles instead of project profiles',
                aliases: ['g'],
            },
            {
                name: 'remote',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Create in remote profiles instead of local profiles',
                aliases: ['r'],
            },
        ],
        examples: [
            'create profile my-profile',
            'create profile my-profile --global',
            'create profile my-profile -g',
            'create profile my-profile --remote',
            'create profile my-profile -r',
        ],
        category: 'configuration',
        handler: createProfileHandler
    },
    {
        verb: CommandVerb.CREATE,
        object: CommandObject.BRANCH,
        description: 'Create a new branch',
        parameters: [
            {
                name: 'remote',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Create remote branch instead of local branch',
            },
        ],
        examples: [
            'create branch feature/new-feature',
            'create branch feature/new-feature --remote',
        ],
        category: 'git-workflow',
        handler: createBranchHandler
    },
    {
        verb: CommandVerb.CREATE,
        object: CommandObject.CHANGELOG,
        description: 'Generate a changelog',
        parameters: [
            {
                name: 'from',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Start date or tag for changelog generation',
                aliases: ['f'],
            },
            {
                name: 'to',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'End date or tag for changelog generation',
                aliases: ['t'],
            },
        ],
        examples: [
            'create changelog',
            'create changelog --from v1.0.0',
            'create changelog -f v1.0.0 -t v2.0.0',
        ],
        category: 'git-workflow',
        handler: createChangelogHandler
    },
    {
        verb: CommandVerb.CREATE,
        object: CommandObject.REVIEW,
        description: 'AI code review (interactive)',
        parameters: [
            {
                name: 'ci',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Run in CI environment instead of local',
            },
            {
                name: 'local',
                type: 'boolean',
                required: false,
                defaultValue: false,
                description: 'Run in local environment (default)',
                aliases: ['l'],
            },
            {
                name: 'target',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Specific target to review (file, directory, etc.)',
                aliases: ['t'],
            },
        ],
        examples: [
            'create review',
            'create review --ci',
            'create review --local',
            'create review -l',
            'create review --target src/components',
            'create review -t src/components',
        ],
        category: 'ai-features',
        handler: createReviewHandler
    },
    {
        verb: CommandVerb.CREATE,
        object: CommandObject.COMMIT,
        description: 'Automatically generate commit messages',
        parameters: [
            {
                name: 'message',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Additional context message for commit generation',
                aliases: ['m'],
            },
            {
                name: 'type',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Commit type hint (feat, fix, docs, etc.)',
                aliases: ['t'],
            },
            {
                name: 'scope',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Commit scope hint (component name, etc.)',
                aliases: ['s'],
            },
        ],
        examples: [
            'create commit',
            'create commit --message "fix authentication bug"',
            'create commit -m "fix authentication bug"',
            'create commit --type feat --scope auth',
            'create commit -t fix -s "core module"',
        ],
        category: 'ai-features',
        handler: createCommitHandler
    },
    {
        verb: CommandVerb.CREATE,
        object: CommandObject.PR,
        description: 'Create a Pull Request',
        parameters: [
            {
                name: 'title',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Pull Request title',
                aliases: ['t'],
            },
            {
                name: 'body',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Pull Request description/body',
                aliases: ['b'],
            },
            {
                name: 'base',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Base branch for the PR (default: main)',
                aliases: ['b'],
            },
            {
                name: 'head',
                type: 'string',
                required: false,
                defaultValue: '',
                description: 'Head branch for the PR (current branch)',
                aliases: ['h'],
            },
        ],
        examples: [
            'create pr',
            'create pr --title "Add new feature"',
            'create pr -t "Add new feature"',
            'create pr --title "Feature" --body "Description"',
            'create pr --base develop --head feature/new-feature',
        ],
        category: 'git-workflow',
        handler: createPrHandler
    },
];