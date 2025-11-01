//app/core/handlers/system/help-handler.ts

import {BaseHandler} from '../base/base-handler';
import {commandRegistry} from '@/app/core/registry';
import {CommandObject, CommandVerb} from '@/app/core/enums';

/**
 * Help command handler
 * Handles displaying help information for commands
 */
export class HelpHandler extends BaseHandler {
    /**
     * Execute help command
     */
    async execute(): Promise<void> {
        const args = this.getArgs();
        
        if (args.length === 0) {
            this.showAllVerbsHelp();
        } else if (args.length === 1) {
            this.showVerbHelp(args[0]);
        } else {
            this.showCommandHelp(args[0], args[1]);
        }
    }

    /**
     * Show help for all available verbs
     */
    private showAllVerbsHelp(): void {
        this.logger.info(`
${this.t('cli.helpTitle')}
${this.t('cli.helpDescription')}

${this.t('cli.availableVerbs')}:

  ${this.t('cli.initVerb')}     ${this.t('cli.initVerbDesc')}
  ${this.t('cli.configVerb')}    ${this.t('cli.configVerbDesc')}
  ${this.t('cli.branchVerb')}    ${this.t('cli.branchVerbDesc')}
  ${this.t('cli.commitVerb')}    ${this.t('cli.commitVerbDesc')}
  ${this.t('cli.prVerb')}        ${this.t('cli.prVerbDesc')}
  ${this.t('cli.reviewVerb')}    ${this.t('cli.reviewVerbDesc')}
  ${this.t('cli.changelogVerb')}  ${this.t('cli.changelogVerbDesc')}
  ${this.t('cli.helpVerb')}      ${this.t('cli.helpVerbDesc')}
  ${this.t('cli.versionVerb')}    ${this.t('cli.versionVerbDesc')}

${this.t('cli.helpUsageExamples')}:
  quartz help                    ${this.t('cli.helpShowAllVerbs')}
  quartz help init               ${this.t('cli.helpShowVerbObjects')}
  quartz help init project       ${this.t('cli.helpShowCommandDetails')}
  quartz help --verbose          ${this.t('cli.helpShowVerbose')}
`);
    }

    /**
     * Show help for a specific verb
     */
    private showVerbHelp(targetVerb: string): void {
        // Get all commands for this verb
        const verbCommands = commandRegistry.findByVerb(CommandVerb[targetVerb.toUpperCase() as keyof typeof CommandVerb]);
        
        if (verbCommands.length === 0) {
            this.logger.error(this.t('cli.helpVerbNotFound', { verb: targetVerb }));
            return;
        }
        
        this.logger.info(`
${this.t('cli.helpObjectsForVerb', { verb: targetVerb })}:

${verbCommands.map((cmd: any) =>
  `  ${cmd.object}    ${cmd.description}`
).join('\n')}

${this.t('cli.helpUsageExamples')}:
  quartz help ${targetVerb} <object>  ${this.t('cli.helpShowCommandDetails')}
`);
    }

    /**
     * Show detailed help for a specific command
     */
    private showCommandHelp(targetVerb: string, targetObject: string): void {
        // Get the specific command
        const commandDef = commandRegistry.get(
            CommandVerb[targetVerb.toUpperCase() as keyof typeof CommandVerb],
            CommandObject[targetObject.toUpperCase() as keyof typeof CommandObject]
        );
        
        if (!commandDef) {
            this.logger.error(this.t('cli.helpCommandNotFound', { verb: targetVerb, object: targetObject }));
            return;
        }
        
        const parameters = commandDef.parameters.map((param: any) => {
            const required = param.required ? 'required' : 'optional';
            const aliases = param.aliases ? ` (-${param.aliases.join(', -')})` : '';
            return `    --${param.name}${aliases}  ${param.description} (${required})`;
        }).join('\n');
        
        const examples = commandDef.examples.map((example: any) => `    ${example}`).join('\n');
        
        this.logger.info(`
${this.t('cli.helpCommandDetails', { command: `${targetVerb} ${targetObject}` })}

${this.t('cli.helpDescription')}:
  ${commandDef.description}

${this.t('cli.helpParameters')}:
${parameters || `    ${this.t('cli.helpNoParameters')}`}

${this.t('cli.helpExamples')}:
${examples}

${this.t('cli.helpUsage')}:
  quartz ${targetVerb} ${targetObject} [options]
`);
    }
}