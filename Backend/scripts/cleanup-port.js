#!/usr/bin/env node

/**
 * Port Cleanup Script
 * Kills any existing process using port 3001 before starting the server
 */

import { execSync } from 'child_process';
import { platform } from 'os';

const PORT = process.env.PORT || 3001;
const isWindows = platform() === 'win32';

function killPortProcess() {
  try {
    let pid = null;

    if (isWindows) {
      // Windows command - find process using the port
      try {
        const output = execSync(`netstat -ano | findstr :${PORT}`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });

        if (output) {
          const lines = output.split('\n');
          const match = lines[0]?.match(/\s(\d+)\s*$/);
          
          if (match && match[1]) {
            pid = match[1];
          }
        }
      } catch (error) {
        // No process found, port is available
        console.log(`✓ Port ${PORT} is available`);
        process.exit(0);
      }

      // Kill the process if found
      if (pid) {
        try {
          console.log(`🔍 Found process ${pid} using port ${PORT}`);
          execSync(`taskkill /PID ${pid} /F`, {
            stdio: 'pipe',
          });
          console.log(`✓ Successfully killed process ${pid}`);
          
          // Wait a moment for the port to be released
          execSync('timeout /t 1 /nobreak', { stdio: 'pipe' });
        } catch (error) {
          console.error(`✗ Failed to kill process ${pid}`);
        }
      }
    } else {
      // Unix/Linux/Mac command
      try {
        const output = execSync(`lsof -i :${PORT}`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });

        if (output) {
          const lines = output.split('\n');
          const match = lines[1]?.match(/\s+(\d+)\s+/);
          
          if (match && match[1]) {
            pid = match[1];
          }
        }
      } catch (error) {
        // No process found, port is available
        console.log(`✓ Port ${PORT} is available`);
        process.exit(0);
      }

      // Kill the process if found
      if (pid) {
        try {
          console.log(`🔍 Found process ${pid} using port ${PORT}`);
          execSync(`kill -9 ${pid}`, {
            stdio: 'pipe',
          });
          console.log(`✓ Successfully killed process ${pid}`);
        } catch (error) {
          console.error(`✗ Failed to kill process ${pid}`);
        }
      }
    }

    console.log(`✓ Port ${PORT} is now available`);
    process.exit(0);
  } catch (error) {
    console.error('Error during port cleanup:', error.message);
    process.exit(0); // Continue anyway
  }
}

// Run the cleanup
killPortProcess();

