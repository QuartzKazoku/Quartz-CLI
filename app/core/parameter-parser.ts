//app/core/parameter-parser.ts
import { ParameterDefinition, ValidationResult } from './interfaces';

/**
 * Parameter Parser Implementation
 * Handles parsing and validation of command parameters
 * Supports: [参数] -- {特殊参数} -{短特殊参数}
 */
export class ParameterParser {
  /**
   * Parse parameters from command arguments
   */
  parseParameters(
    args: string[], 
    parameterDefinitions: ParameterDefinition[]
  ): { validation: ValidationResult; parameters: Record<string, any>; remainingArgs: string[] } {
    const parameters: Record<string, any> = {};
    const remainingArgs: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      
      // Handle special parameters (--key=value or --key)
      if (arg.startsWith('--')) {
        const equalIndex = arg.indexOf('=');
        if (equalIndex !== -1) {
          // --key=value format
          const key = arg.substring(2, equalIndex);
          const value = arg.substring(equalIndex + 1);
          const validation = this.validateParameter(key, value, parameterDefinitions);
          
          if (validation.valid) {
            parameters[key] = value;
          } else {
            errors.push(...validation.errors);
            warnings.push(...validation.warnings);
          }
        } else {
          // --key format (boolean flag)
          const key = arg.substring(2);
          const paramDef = parameterDefinitions.find(p => p.name === key);
          
          if (paramDef && paramDef.type === 'boolean') {
            parameters[key] = true;
          } else {
            // Unknown parameter, keep as remaining argument
            remainingArgs.push(arg);
          }
        }
      } else if (arg.startsWith('-') && !arg.startsWith('--')) {
        // Handle short special parameters (-k)
        const key = arg.substring(1);
        const paramDef = parameterDefinitions.find(p => p.aliases?.includes(key));
        
        if (paramDef) {
          if (paramDef.type === 'boolean') {
            // Boolean flag
            parameters[paramDef.name] = true;
          } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
            // Short parameter with value
            const value = args[i + 1];
            const validation = this.validateParameter(paramDef.name, value, parameterDefinitions);
            
            if (validation.valid) {
              parameters[paramDef.name] = value;
              i++; // Skip the value
            } else {
              errors.push(...validation.errors);
              warnings.push(...validation.warnings);
            }
          } else {
            errors.push(`Parameter "-${key}" requires a value`);
          }
        } else {
          // Unknown short parameter, keep as remaining argument
          remainingArgs.push(arg);
        }
      } else {
        // Positional argument
        remainingArgs.push(arg);
      }
      
      i++;
    }

    // Check for missing required parameters
    for (const paramDef of parameterDefinitions) {
      if (paramDef.required && !(paramDef.name in parameters)) {
        errors.push(`Required parameter "${paramDef.name}" is missing`);
      }
    }

    return {
      validation: {
        valid: errors.length === 0,
        errors,
        warnings,
      },
      parameters,
      remainingArgs,
    };
  }

  /**
   * Validate a single parameter value
   */
  private validateParameter(
    key: string, 
    value: any, 
    parameterDefinitions: ParameterDefinition[]
  ): ValidationResult {
    const paramDef = parameterDefinitions.find(p => p.name === key || p.aliases?.includes(key));
    
    if (!paramDef) {
      return {
        valid: false,
        errors: [`Unknown parameter: ${key}`],
        warnings: [],
      };
    }

    // Type validation
    if (paramDef.type === 'string' && typeof value !== 'string') {
      return {
        valid: false,
        errors: [`Parameter "${key}" must be a string`],
        warnings: [],
      };
    }

    if (paramDef.type === 'number' && typeof value !== 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          errors: [`Parameter "${key}" must be a number`],
          warnings: [],
        };
      }
    }

    if (paramDef.type === 'boolean' && typeof value !== 'boolean') {
      return {
        valid: false,
        errors: [`Parameter "${key}" must be a boolean`],
        warnings: [],
      };
    }

    // Custom validator
    if (paramDef.validator) {
      const result = paramDef.validator(value);
      if (result !== true) {
        return {
          valid: false,
          errors: [`Parameter "${key}" validation failed: ${result}`],
          warnings: [],
        };
      }
    }

    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Validate all parameters
   */
  validateParameters(
    parameters: Record<string, any>, 
    parameterDefinitions: ParameterDefinition[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const paramDef of parameterDefinitions) {
      const value = parameters[paramDef.name];
      
      if (value === undefined || value === null) {
        if (paramDef.required) {
          errors.push(`Required parameter "${paramDef.name}" is missing`);
        }
      } else {
        // Type validation
        const validation = this.validateParameter(paramDef.name, value, parameterDefinitions);
        if (!validation.valid) {
          errors.push(...validation.errors);
          warnings.push(...validation.warnings);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate help text for parameters
   */
  generateParameterHelp(parameterDefinitions: ParameterDefinition[]): string {
    if (parameterDefinitions.length === 0) {
      return '  No parameters\n';
    }

    let help = '\n📋 Parameters:\n';
    help += '─'.repeat(40) + '\n';
    
    for (const param of parameterDefinitions) {
      const aliases = param.aliases ? ` (-${param.aliases.join(', -')})` : '';
      const required = param.required ? 'required' : 'optional';
      const defaultValue = param.defaultValue !== undefined ? ` [default: ${param.defaultValue}]` : '';
      
      help += `  --${param.name}${aliases}\n`;
      help += `    ${param.description}\n`;
      help += `    Type: ${param.type}, ${required}${defaultValue}\n\n`;
    }

    return help;
  }
}