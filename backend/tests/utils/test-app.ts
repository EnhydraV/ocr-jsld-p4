import express from 'express';
import routes from '../../src/routes';
import {errorHandler} from '../../src/middleware/errorHandler';

export const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use(routes);
    app.use(errorHandler);
    return app;
};
