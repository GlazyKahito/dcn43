export interface CommandOutputLine {
  text: string;
  type?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'header';
  delayMs?: number;
  highlightDeviceId?: string;
}

export interface CommandResult {
  command: string;
  args: string[];
  lines: CommandOutputLine[];
  pathDevices?: string[];
  isContinuous?: boolean;
}
