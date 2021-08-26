import { exec } from 'child_process';
import os from 'os';
import path from 'path';
import { quote } from 'shell-quote';

export function execCommand(
    command: string,
    encoding: BufferEncoding = 'utf8'
): Promise<string> {
    return new Promise((resolve, reject) => {
        const results: string[] = [];
        const errors: string[] = [];
        const child = exec(command);
        if (!child.stdout || !child.stderr) {
            throw new Error('Could not start the command process.');
        }
        child.stdout.on('data', (data: Buffer) =>
            results.push(data.toString(encoding))
        );
        child.stderr.on('data', (data: Buffer) =>
            errors.push(data.toString(encoding))
        );
        child.on('close', (code) =>
            code === 0
                ? resolve(results.join(''))
                : reject(
                      new Error(
                          `Process terminated with exit code ${code}: ${errors.join(
                              ''
                          )}`
                      )
                  )
        );
        child.on('error', (error: Error) => reject(error));
    });
}

export async function rpc<I, O>(endpoint: string, data: I): Promise<O> {
    const result = await execCommand(
        `curl ${[
            '--insecure',
            '--cert',
            path.join(
                process.env.CHIA_HOME ?? path.join(os.homedir(), '.chia'),
                'mainnet',
                'config',
                'ssl',
                'full_node',
                'private_full_node.crt'
            ),
            '--key',
            path.join(
                process.env.CHIA_HOME ?? path.join(os.homedir(), '.chia'),
                'mainnet',
                'config',
                'ssl',
                'full_node',
                'private_full_node.key'
            ),
            '-d',
            quote([JSON.stringify(data)]),
            '-H',
            'Content-Type: application/json',
            '-X',
            'POST',
            `https://localhost:${process.env.CHIA_PORT ?? 8555}/${endpoint}`,
        ].join(' ')}`
    );
    return JSON.parse(result);
}
