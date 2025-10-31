//app/core/commands/help.ts
/**
 * @fileoverview Help command definitions
 * @description Implements hierarchical help system for commands
 * @author Quartz CLI Team
 * @version 2.0.0
 */


import {CommandObject, CommandVerb} from "@/app/core/enums";
import {CommandDefinition, ExecutionContext} from "@/app/core/interfaces";
import {CommandHandler} from "@/app/core";

/**
 * Help command handler - shows all available verbs
 */
const helpVerbHandler: CommandHandler = async (context: ExecutionContext) => {
  const { t, logger } = context;
  
  logger.info(`
${t('cli.helpTitle')}
${t('cli.helpDescription')}

${t('cli.availableVerbs')}:

  ${t('cli.initVerb')}     ${t('cli.initVerbDesc')}
  ${t('cli.configVerb')}    ${t('cli.configVerbDesc')}
  ${t('cli.branchVerb')}    ${t('cli.branchVerbDesc')}
  ${t('cli.commitVerb')}    ${t('cli.commitVerbDesc')}
  ${t('cli.prVerb')}        ${t('cli.prVerbDesc')}
  ${t('cli.reviewVerb')}    ${t('cli.reviewVerbDesc')}
  ${t('cli.changelogVerb')}  ${t('cli.changelogVerbDesc')}
  ${t('cli.helpVerb')}      ${t('cli.helpVerbDesc')}
  ${t('cli.versionVerb')}    ${t('cli.versionVerbDesc')}

${t('cli.helpUsageExamples')}:
  quartz help                    ${t('cli.helpShowAllVerbs')}
  quartz help init               ${t('cli.helpShowVerbObjects')}
  quartz help init project       ${t('cli.helpShowCommandDetails')}
  quartz help --verbose          ${t('cli.helpShowVerbose')}
`);
};

/**
 * Help with verb command handler - shows objects for a specific verb
 */
const helpWithVerbHandler: CommandHandler = async (context: ExecutionContext) => {
  const { t, logger, command } = context;
  const targetVerb = command.args[0]; // The verb after 'help'
  
  // Get all commands for this verb
  const registry = (global as any).commandRegistry;
  const verbCommands = registry.findByVerb(CommandVerb[targetVerb.toUpperCase() as keyof typeof CommandVerb]);
  
  if (verbCommands.length === 0) {
    logger.error(t('cli.helpVerbNotFound', { verb: targetVerb }));
    return;
  }
  
  logger.info(`
${t('cli.helpObjectsForVerb', { verb: targetVerb })}:

${verbCommands.map((cmd: any) =>
  `  ${cmd.object}    ${cmd.description}`
).join('\n')}

${t('cli.helpUsageExamples')}:
  quartz help ${targetVerb} <object>  ${t('cli.helpShowCommandDetails')}
`);
};

/**
 * Help with verb and object command handler - shows detailed command help
 */
const helpWithVerbAndObjectHandler: CommandHandler = async (context: ExecutionContext) => {
  const { t, logger, command } = context;
  const targetVerb = command.args[0];
  const targetObject = command.args[1];
  
  // Get the specific command
  const registry = (global as any).commandRegistry;
  const commandDef = registry.get(
    CommandVerb[targetVerb.toUpperCase() as keyof typeof CommandVerb],
    CommandObject[targetObject.toUpperCase() as keyof typeof CommandObject]
  );
  
  if (!commandDef) {
    logger.error(t('cli.helpCommandNotFound', { verb: targetVerb, object: targetObject }));
    return;
  }
  
  const parameters = commandDef.parameters.map((param: any) => {
    const required = param.required ? 'required' : 'optional';
    const aliases = param.aliases ? ` (-${param.aliases.join(', -')})` : '';
    return `    --${param.name}${aliases}  ${param.description} (${required})`;
  }).join('\n');
  
  const examples = commandDef.examples.map((example: any) => `    ${example}`).join('\n');
  
  logger.info(`
${t('cli.helpCommandDetails', { command: `${targetVerb} ${targetObject}` })}

${t('cli.helpDescription')}:
  ${commandDef.description}

${t('cli.helpParameters')}:
${parameters || `    ${t('cli.helpNoParameters')}`}

${t('cli.helpExamples')}:
${examples}

${t('cli.helpUsage')}:
  quartz ${targetVerb} ${targetObject} [options]
`);
};

/**
 * Version command handler
 */
const versionHandler: CommandHandler = async (context: ExecutionContext) => {
  const { t, logger } = context;
  
  // Get version from package.json
  const packageJson = await import('../../../package.json');
  const version = packageJson.version;
  
  logger.info(`
${t('cli.versionTitle')}
${t('cli.versionInfo', { version })}

${t('cli.versionDetails')}:
  Node.js: ${process.version}
  Platform: ${process.platform}
  Architecture: ${process.arch}

${t('cli.versionMoreInfo')}: https://github.com/quartz-cli/quartz-cli
`);
};

/**
 * Export help command definitions
 */
export const helpCommands: CommandDefinition[] = [
  // quartz help
  {
    verb: CommandVerb.HELP,
    object: CommandObject.HELP,
    description: 'Show help information',
    parameters: [
      {
        name: 'verb',
        type: 'string',
        required: false,
        description: 'Command verb to get help for',
        aliases: ['v']
      },
      {
        name: 'object',
        type: 'string',
        required: false,
        description: 'Command object to get help for',
        aliases: ['o']
      },
      {
        name: 'verbose',
        type: 'boolean',
        required: false,
        description: 'Show verbose help information',
        aliases: ['V']
      }
    ],
    examples: [
      'quartz help',
      'quartz help init',
      'quartz help init project',
      'quartz help --verbose'
    ],
    handler: helpVerbHandler,
    category: 'help'
  },
  
  // quartz help <verb>
  {
    verb: CommandVerb.HELP,
    object: CommandObject.PROJECT, // This will be overridden in routing
    description: 'Show help for a specific verb',
    parameters: [
      {
        name: 'verb',
        type: 'string',
        required: true,
        description: 'Command verb to get help for'
      }
    ],
    examples: [
      'quartz help init',
      'quartz help config',
      'quartz help branch'
    ],
    handler: helpWithVerbHandler,
    category: 'help'
  },
  
  // quartz help <verb> <object>
  {
    verb: CommandVerb.HELP,
    object: CommandObject.CONFIG, // This will be overridden in routing
    description: 'Show detailed help for a specific command',
    parameters: [
      {
        name: 'verb',
        type: 'string',
        required: true,
        description: 'Command verb'
      },
      {
        name: 'object',
        type: 'string',
        required: true,
        description: 'Command object'
      }
    ],
    examples: [
      'quartz help init project',
      'quartz help config list',
      'quartz help branch create'
    ],
    handler: helpWithVerbAndObjectHandler,
    category: 'help'
  },
  
  // quartz version
  {
    verb: CommandVerb.VERSION,
    object: CommandObject.VERSION,
    description: 'Show version information',
    parameters: [],
    examples: [
      'quartz version',
      'quartz version --verbose'
    ],
    handler: versionHandler,
    category: 'system'
  }
];