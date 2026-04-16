import app from "./app";
import { envVars } from "./app/config/env";

const port = envVars.PORT;

const bootstrap = () => {
    try {
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Error starting the server:", error);
    }
};

bootstrap();
