<?php

class EnvLoader {
    public static function load($path) {
        if (!file_exists($path)) {
            // We check for 'APP_ENV' (which we will configure in Azure) or 'ENFORCE_SSL'.
            // If neither exist, we are likely on a local machine where a developer forgot to create the .env file.
            if (getenv('APP_ENV') === false && getenv('ENFORCE_SSL') === false) {
                throw new Exception("CRITICAL ERROR: .env file not found at " . $path . ". If you are a new developer setting this up locally, please copy .env.example to .env and fill in your database credentials.");
            }
            // In cloud environments like Azure, the .env file won't exist.
            // We return silently to allow the app to use injected OS variables.
            return;
        }

        // Read file line by line
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments starting with #
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Split by the first '=' found
            list($name, $value) = explode('=', $line, 2);
            
            $name = trim($name);
            $value = trim($value);

            // Strip optional wrapping quotes from values
            $value = trim($value, '"\'');

            // Set the environment variables globally, ONLY if they are not already set by the system (like Docker!)
            if (getenv($name) === false) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}