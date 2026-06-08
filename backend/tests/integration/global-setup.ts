import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';

// Démarre un Postgres temporaire (même image que docker-compose.yml) et applique
// les vraies migrations. Exécuté une fois avant tous les tests d'intégration.
export default async function globalSetup() {
    const container = await new PostgreSqlContainer('postgres:16-alpine').start();

    process.env.DATABASE_URL = container.getConnectionUri();

    execSync('npx prisma migrate deploy', {
        env: process.env,
        stdio: 'inherit',
    });

    return async () => {
        await container.stop();
    };
}
