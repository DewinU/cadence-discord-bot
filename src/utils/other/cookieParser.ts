import path from 'node:path';
import fs from 'node:fs';
/* eslint-disable @typescript-eslint/no-var-requires */
const cookies = require(path.resolve('./cookies.json'));

try {
    const cookieString = cookies
        .map(({ name, value }: { name: string; value: string }) => {
            return `${name}=${value}`;
        })
        .join('; ');

    fs.writeFile(path.resolve('./cookies.txt'), cookieString, () => {
        return process.exit(0);
    });
} catch (error) {
    process.exit(1);
}
