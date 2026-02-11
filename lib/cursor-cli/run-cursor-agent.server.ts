import { existsSync } from "fs";

// Use require for node-pty as it's more reliable
const pty = require("node-pty");

// Try to find the agent command
// The installer script installs 'agent' as a standalone command
const AGENT_PATHS = [
  "agent", // Try from PATH first (most likely after installer)
  "C:\\Program Files\\cursor\\Cursor.exe", // Fallback to cursor agent
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Programs\\cursor\\Cursor.exe` : "",
].filter(Boolean);

/**
 * Find the agent executable path
 * The installer script creates an 'agent' command that works in PowerShell
 * Usage: agent chat "your prompt here" --print --output-format text --approve-mcps --force
 */
function findAgentPath(): { path: string; args: string[] } {
  // Try to use agent directly - it should be in PATH when PowerShell profile is loaded
  // We'll use PowerShell to ensure the profile is loaded and PATH is set
  console.log(`[Cursor CLI] Using PowerShell to run 'agent chat' with --print flags`);
  return { 
    path: "powershell.exe", 
    args: ["-NoExit", "-Command"] // -NoExit keeps session, we'll build the full command
  };
}

/**
 * Execute a prompt using Cursor CLI agent
 * This starts a new cursor agent process for each query using a pseudo-terminal
 */
export async function runCursorAgent(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`[Cursor CLI] Processing prompt: "${prompt.substring(0, 50)}..."`);
    
      const { path: agentPath, args: agentArgs } = findAgentPath();
      
      // Escape the prompt for PowerShell - use base64 encoding to avoid escaping issues
      const promptBytes = Buffer.from(prompt, 'utf8');
      const promptBase64 = promptBytes.toString('base64');
      
      // Build PowerShell command with non-interactive flags:
      // Load profile, decode prompt, and run: agent chat "prompt" --print --output-format text --approve-mcps --force
      const psCommand = `
        if (Test-Path $PROFILE) { . $PROFILE }
        $prompt = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${promptBase64}'))
        agent chat $prompt --print --output-format text --approve-mcps --force
        exit
      `.trim().replace(/\s+/g, ' ');
      const fullArgs = [...agentArgs, psCommand];
      
      console.log(`[Cursor CLI] Using PowerShell with base64-encoded prompt and --print flags`);
      
      try {
        // Create a pseudo-terminal for interactive command
        // This allows us to interact with the agent command which requires a TTY
        // Use Windows terminal settings to make it look like a real PowerShell terminal
        const ptyProcess = pty.spawn(agentPath, fullArgs, {
        name: "xterm-256color",
        cols: 120,
        rows: 30,
        cwd: process.cwd(),
        env: {
          ...process.env,
          TERM: "xterm-256color",
          TERM_PROGRAM: "PowerShell",
          PSModulePath: process.env.PSModulePath || "",
          // Make it look like a real PowerShell session
          PROMPT: "$ ",
        } as { [key: string]: string },
      });
      
      let output = "";
      let hasResolved = false;
      let responseTimer: NodeJS.Timeout | null = null;
      
      // Helper function to resolve with cleanup
      const resolveWithCleanup = (value: string) => {
        if (hasResolved) return;
        hasResolved = true;
        if (responseTimer) clearTimeout(responseTimer);
        clearTimeout(timeout);
        try {
          ptyProcess.kill();
        } catch (e) {
          // Ignore kill errors
        }
        resolve(value);
      };
      
      // Helper function to reject with cleanup
      const rejectWithCleanup = (error: Error) => {
        if (hasResolved) return;
        hasResolved = true;
        if (responseTimer) clearTimeout(responseTimer);
        clearTimeout(timeout);
        try {
          ptyProcess.kill();
        } catch (e) {
          // Ignore kill errors
        }
        reject(error);
      };
      
      // Set a timeout - increase for cursor agent which may take longer
      const timeout = setTimeout(() => {
        rejectWithCleanup(new Error("Cursor CLI request timed out after 3 minutes. The agent may be processing your request - try again or check if a GUI window opened."));
      }, 180000); // 3 minute timeout
      
      // Track if we've sent the prompt
      let promptSent = false;
      let initialOutput = "";
      
      // Collect output from the pseudo-terminal
      ptyProcess.onData((data: string) => {
        const text = data.toString();
        output += text;
        
        // Log all output for debugging
        console.log(`[Cursor CLI] Raw output chunk (${text.length} chars):`, JSON.stringify(text.substring(0, 200)));
        
        // Collect initial output before sending prompt
        if (!promptSent) {
          initialOutput += text;
          console.log(`[Cursor CLI] Initial output so far: ${initialOutput.substring(0, 200)}`);
          
          // Wait for cursor agent to be ready (look for prompts or specific markers)
          // Then send our prompt
          if (initialOutput.length > 50 || initialOutput.includes(">") || initialOutput.includes("$") || initialOutput.includes("?")) {
            setTimeout(() => {
              if (!hasResolved && !promptSent && ptyProcess) {
                promptSent = true;
                console.log(`[Cursor CLI] Sending prompt to PTY: "${prompt}"`);
                ptyProcess.write(prompt + "\r\n");
              }
            }, 500);
          }
        }
        
        // Reset the response timer each time we get data (after prompt is sent)
        if (promptSent) {
          if (responseTimer) clearTimeout(responseTimer);
          
          // Wait for a pause in output before considering response complete
          responseTimer = setTimeout(() => {
            if (!hasResolved && output.length > prompt.length + 20) {
              // Get only the output after the prompt was sent
              const responseAfterPrompt = output.substring(output.indexOf(prompt) + prompt.length).trim();
              const response = responseAfterPrompt || output.trim();
              
              // Filter out the prompt echo, command prompts, and control characters
              let cleanedResponse = response
                .replace(new RegExp(prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
                .replace(/>\s*/g, "")
                .replace(/\$\s*/g, "")
                .replace(/\[.*?m/g, "") // Remove ANSI color codes
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
                .split("\n")
                .filter(line => {
                  const trimmed = line.trim();
                  return trimmed && 
                         !trimmed.toLowerCase().includes("cursor") && 
                         !trimmed.toLowerCase().includes("agent") &&
                         !trimmed.toLowerCase().includes("usage:") &&
                         trimmed.length > 3;
                })
                .join("\n")
                .trim();
              
              console.log(`[Cursor CLI] Cleaned response (${cleanedResponse.length} chars): ${cleanedResponse.substring(0, 300)}`);
              
              if (cleanedResponse && cleanedResponse.length > 10 && 
                  !cleanedResponse.toLowerCase().includes("usage:") && 
                  !cleanedResponse.toLowerCase().includes("run with") &&
                  !cleanedResponse.toLowerCase().includes("options")) {
                console.log(`[Cursor CLI] Resolving with cleaned response`);
                resolveWithCleanup(cleanedResponse);
              }
            }
          }, 10000); // Wait 10 seconds after last output to allow for longer responses
        }
      });
      
      // Handle process exit
      ptyProcess.onExit(({ exitCode, signal }: { exitCode: number | null; signal?: number }) => {
        if (hasResolved) return;
        
        console.log(`[Cursor CLI] Process exited with code: ${exitCode}, signal: ${signal}`);
        
        if (responseTimer) clearTimeout(responseTimer);
        
        const response = output.trim();
        let cleanedResponse = response
          .replace(new RegExp(prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
          .replace(/>\s*/g, "")
          .replace(/\$\s*/g, "")
          .replace(/\[.*?m/g, "") // Remove ANSI color codes
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .split("\n")
          .filter(line => line.trim() && !line.includes("cursor") && !line.includes("agent"))
          .join("\n")
          .trim();
        
        if (exitCode !== 0 && exitCode !== null) {
          rejectWithCleanup(new Error(`Cursor CLI exited with code ${exitCode}. Output: ${cleanedResponse.substring(0, 200)}`));
          return;
        }
        
        // Log the full output for debugging
        console.log(`[Cursor CLI] Full output on exit (${output.length} chars):`, JSON.stringify(output.substring(0, 1000)));
        console.log(`[Cursor CLI] Cleaned response on exit (${cleanedResponse.length} chars):`, JSON.stringify(cleanedResponse.substring(0, 500)));
        
        // If output is empty or very short, cursor agent might have opened a GUI window
        // But also check if we got any meaningful output at all
        if (output.length < 20 && !cleanedResponse) {
          const errorMsg = `Cursor agent returned very little output (${output.length} chars). This might mean it opened a GUI window. Full output: ${JSON.stringify(output)}`;
          console.error(`[Cursor CLI] ${errorMsg}`);
          rejectWithCleanup(new Error(errorMsg));
          return;
        }
        
        if (!cleanedResponse || cleanedResponse.toLowerCase().includes("usage:") || cleanedResponse.toLowerCase().includes("run with")) {
          // Return a more informative error with the actual output
          const errorMsg = `Cursor agent returned help/usage message instead of processing the prompt. This suggests the command is interactive-only. Full output: ${output.substring(0, 500)}`;
          console.error(`[Cursor CLI] ${errorMsg}`);
          rejectWithCleanup(new Error(errorMsg));
          return;
        }
        
        if (cleanedResponse.length > 10) {
          resolveWithCleanup(cleanedResponse);
        } else {
          rejectWithCleanup(new Error("Empty or invalid response from Cursor agent."));
        }
      });
      
      // For 'agent chat', we pass the prompt as an argument, so we don't need to send it via stdin
      // But we still need to handle the interactive output
      // The prompt is already in the args, so we just wait for output
      console.log(`[Cursor CLI] Prompt "${prompt}" passed as argument to agent chat`);
      
    } catch (error: any) {
      console.error("[Cursor CLI] Error spawning PTY:", error);
      reject(new Error(`Failed to start Cursor agent: ${error.message || "Unknown error"}`));
    }
  });
}
