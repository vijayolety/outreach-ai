// web/src/lib/swagger.ts
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: 'src/app/api', // Scans this folder for Swagger JSDoc comments
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Example Outreach AI API',
                version: '1.0.0',
                description: 'Interactive API documentation for the Example Outreach AI platform.',
            },
            components: {
                securitySchemes: {
                    // Documenting that our API uses secure sessions/tokens
                    sessionAuth: {
                        type: 'apiKey',
                        in: 'cookie',
                        name: 'next-auth.session-token',
                    },
                },
            },
            security: [
                { sessionAuth: [] }
            ],
        },
    });

    return spec;
};