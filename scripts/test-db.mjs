import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const a=JSON.parse(readFileSync('tests/.accounts.json','utf8'));
const result=spawnSync('docker',['compose','exec','-T','db','psql','-U','postgres','-v','ON_ERROR_STOP=1','-v','account_a='+a[0].id,'-v','account_b='+a[1].id],{input:readFileSync('tests/database.sql'),encoding:'utf8'});console.log(result.stdout);console.error(result.stderr);process.exit(result.status??1);
