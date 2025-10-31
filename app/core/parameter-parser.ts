//app/core/parameter-parser.ts


import {ParameterDefinition, ValidationResult} from "@/app/core/interfaces";

/**
 * Parameter Parser Implementation
 * Handles parsing and validation of command parameters
 */
export class ParameterParser {
  /**
   * Parse parameters from command arguments based on parameter definitions
   */
  parseParameters(args: string[], parameterDefinitions: ParameterDefinition[]): {
    parameters: Record<string, any>;
    remainingArgs: string[];
    validation: ValidationResult;
  } {
    const parameters: Record<string, any> = {};
    const remainingArgs: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Create a map of parameter names and aliases for quick lookup
    const paramMap = new Map<string, ParameterDefinition>();
    for (const param of parameterDefinitions) {
      paramMap.set(param.name, param);
      if (param.aliases) {
        for (const alias of param.aliases) {
            paramMap.set(alias, param);
        }
      }
    }

      let i = 0;
    while (i < args.length) {
      const arg = args[i];
      
      // Check if it's a parameter (starts with -- or -)
      if (arg.startsWith('--') || arg.startsWith('-')) {
        const paramName = arg.replace(/^--?/, '');
        const paramDef = paramMap.get(paramName);
        
        if (!paramDef) {
          errors.push(`Unknown parameter: ${arg}`);
          i++;
          continue;
        }

        // Get the actual parameter name (not alias)
        const actualParamName = paramDef.name;
        
        // Handle boolean flags
        if (paramDef.type === 'boolean') {
          // Check if it's a negated flag (--no-param)
          parameters[actualParamName] = !paramName.startsWith('no-');
          i++;
          continue;
        }

        // Handle parameters with values
        if (i + 1 >= args.length) {
          errors.push(`Parameter ${arg} requires a value`);
          i++;
          continue;
        }

        const value = args[i + 1];
        const parsedValue = this.parseValue(value, paramDef);
        
        if (parsedValue.error) {
          errors.push(`Invalid value for ${arg}: ${parsedValue.error}`);
          i += 2;
          continue;
        }

        parameters[actualParamName] = parsedValue.value;
        i += 2;
      } else {
        // Not a parameter, add to remaining args
        remainingArgs.push(arg);
        i++;
      }
    }

    // Set default values for missing parameters
    for (const param of parameterDefinitions) {
      if (!(param.name in parameters) && param.defaultValue !== undefined) {
        parameters[param.name] = param.defaultValue;
        warnings.push(`Using default value for ${param.name}: ${param.defaultValue}`);
      }
    }

      // Validate required parameters
    for (const param of parameterDefinitions) {
      if (param.required && !(param.name in parameters)) {
        errors.push(`Required parameter --${param.name} is missing`);
      }
    }

      // Run custom validators
    for (const param of parameterDefinitions) {
      if (param.name in parameters && param.validator) {
        const validationResult = param.validator(parameters[param.name]);
        if (validationResult !== true) {
          if (typeof validationResult === 'string') {
            errors.push(`Parameter --${param.name}: ${validationResult}`);
          } else {
            errors.push(`Parameter --${param.name} validation failed`);
          }
        }
      }
    }

      return {
      parameters,
      remainingArgs,
      validation: {
        valid: errors.length === 0,
        errors,
        warnings,
      },
    };
  }

  /**
   * Parse a single value based on parameter type
   */
  private parseValue(value: string, paramDef: ParameterDefinition): { value?: any; error?: string } {
    try {
      switch (paramDef.type) {
        case 'string':
          return { value };

        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            return { error: `Invalid number: ${value}` };
          }
          return { value: num };

        case 'boolean':
          if (value.toLowerCase() === 'true') return { value: true };
          if (value.toLowerCase() === 'false') return { value: false };
          return { error: `Invalid boolean value: ${value}. Use 'true' or 'false'` };

        case 'array':
          // Handle comma-separated values
          return { value: value.split(',').map(s => s.trim()) };

        case 'object':
          try {
            return { value: JSON.parse(value) };
          } catch {
            return { error: `Invalid JSON: ${value}` };
          }

        default:
          return { error: `Unknown parameter type: ${paramDef.type}` };
      }
    } catch (error) {
      return { error: `Failed to parse value: ${error}` };
    }
  }

  /**
   * Generate parameter help text
   */
  generateParameterHelp(parameterDefinitions: ParameterDefinition[]): string {
    if (parameterDefinitions.length === 0) {
      return 'No parameters defined for this command.';
    }

    let help = '\n⚙️  Parameters\n';
    help += '-'.repeat(30) + '\n';

    for (const param of parameterDefinitions) {
      const required = param.required ? 'required' : 'optional';
      const defaultValue = param.defaultValue !== undefined ? ` (default: ${param.defaultValue})` : '';
      const aliases = param.aliases && param.aliases.length > 0
        ? `, -${param.aliases.join(', -')}`
        : '';

      help += `  --${param.name}${aliases}\n`;
      help += `    Type: ${param.type}, ${required}${defaultValue}\n`;
      help += `    ${param.description}\n`;

      if (param.validator) {
        help += `    ⚠️  Custom validation applied\n`;
      }

      help += '\n';
    }

      return help;
  }

  /**
   * Validate parsed parameters against definitions
   */
  validateParameters(
    parameters: Record<string, any>, 
    parameterDefinitions: ParameterDefinition[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unknown parameters
    const knownParams = new Set(parameterDefinitions.map(p => p.name));
    for (const paramName of Object.keys(parameters)) {
      if (!knownParams.has(paramName)) {
        warnings.push(`Unknown parameter: ${paramName}`);
      }
    }

      // Validate each parameter
    for (const param of parameterDefinitions) {
      const value = parameters[param.name];

      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        errors.push(`Required parameter --${param.name} is missing`);
        continue;
      }

      // Skip validation if parameter is not provided and not required
      if (value === undefined && !param.required) {
        continue;
      }

      // Type validation
      const typeError = this.validateType(value, param);
      if (typeError) {
        errors.push(`Parameter --${param.name}: ${typeError}`);
        continue;
      }

      // Custom validation
      if (param.validator) {
        const validationResult = param.validator(value);
        if (validationResult !== true) {
          if (typeof validationResult === 'string') {
            errors.push(`Parameter --${param.name}: ${validationResult}`);
          } else {
            errors.push(`Parameter --${param.name} validation failed`);
          }
        }
      }
    }

      return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate parameter type
   */
  private validateType(value: any, paramDef: ParameterDefinition): string | null {
    switch (paramDef.type) {
      case 'string':
        if (typeof value !== 'string') {
          return `Expected string, got ${typeof value}`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `Expected number, got ${typeof value}`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Expected boolean, got ${typeof value}`;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return `Expected array, got ${typeof value}`;
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return `Expected object, got ${typeof value}`;
        }
        break;

      default:
        return `Unknown parameter type: ${paramDef.type}`;
    }

    return null;
  }

  /**
   * Generate parameter suggestions for invalid values
   */
  generateParameterSuggestions(
    paramName: string, 
    invalidValue: string, 
    paramDef: ParameterDefinition
  ): string[] {
    const suggestions: string[] = [];

    switch (paramDef.type) {
      case 'boolean':
        suggestions.push('true', 'false');
        break;

      case 'string':
        if (paramDef.name.includes('file') || paramDef.name.includes('path')) {
          suggestions.push('./file.txt', '/path/to/file');
        }
        if (paramDef.name.includes('url')) {
          suggestions.push('https://example.com', 'http://localhost:3000');
        }
        break;

      case 'number':
        if (paramDef.name.includes('port')) {
          suggestions.push('3000', '8080', '443');
        }
        if (paramDef.name.includes('count') || paramDef.name.includes('limit')) {
          suggestions.push('1', '5', '10');
        }
        break;

      case 'array':
        suggestions.push('item1,item2,item3', 'value1,value2');
        break;
    }

    // Add default value if available
    if (paramDef.defaultValue !== undefined) {
      suggestions.push(String(paramDef.defaultValue));
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Convert parameters back to command line arguments
   */
  parametersToArgs(parameters: Record<string, any>, parameterDefinitions: ParameterDefinition[]): string[] {
    const args: string[] = [];

    for (const param of parameterDefinitions) {
      const value = parameters[param.name];
      if (value === undefined || value === null) {
        continue;
      }

      if (param.type === 'boolean') {
        if (value === true) {
          args.push(`--${param.name}`);
        } else if (value === false) {
          args.push(`--no-${param.name}`);
        }
      } else {
        args.push(`--${param.name}`, String(value));
      }
    }

      return args;
  }
}