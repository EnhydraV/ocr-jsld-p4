import express, {NextFunction} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Routes
app.use(routes);


// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({status: 'ok', message: 'Yoga Studio API is running'});
});

// Error Handling
app.use((err: Error, req: express.Request, res: express.Response, next: NextFunction) => {
    // Erreur inattendue
    console.error(err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Une erreur interne est survenue',
        },
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
